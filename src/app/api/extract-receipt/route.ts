import { NextRequest, NextResponse } from "next/server";
import { extractReceiptData } from "@/lib/ocr/extract-receipt";
import { supabase, uploadReceiptImage } from "@/lib/supabase";
import { ExtractedReceiptData } from "@/types/fuel-log";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("receipt") as File | null;
    const truckId = (formData.get("truck_id") as string) || "unknown";

    if (!file) {
      return NextResponse.json({ error: "No receipt file provided" }, { status: 400 });
    }

    // Convert to base64 for Vision API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    // Run OCR extraction
    const extracted: ExtractedReceiptData = await extractReceiptData(base64, mediaType);

    // Upload to Supabase Storage
    const imageUrl = await uploadReceiptImage(file, truckId);

    // Save to fuel_logs table
    const { data, error } = await supabase
      .from("fuel_logs")
      .insert({
        truck_id: extracted.truck_id || truckId,
        seller_name: extracted.seller_name,
        seller_address: extracted.seller_address,
        seller_city: extracted.seller_city,
        seller_state: extracted.seller_state,
        fuel_type: extracted.fuel_type,
        gallons: extracted.gallons,
        price_per_gallon: extracted.price_per_gallon,
        total_price: extracted.total_price,
        receipt_date: extracted.receipt_date,
        image_url: imageUrl,
        extracted_json: extracted,
      })
      .select()
      .single();

    if (error) throw new Error(`DB insert failed: ${error.message}`);

    return NextResponse.json({ success: true, log: data, extracted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
