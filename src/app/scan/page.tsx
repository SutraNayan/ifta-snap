"use client";

import { useState } from "react";
import { ReceiptScanner } from "@/components/scanner/receipt-scanner";
import { ExtractedDataCard } from "@/components/review-card/extracted-data-card";
import { ExtractedReceiptData } from "@/types/fuel-log";
import { supabase } from "@/lib/supabase";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PageState = "scan" | "review" | "saved";

const steps = [
  { id: "scan",   label: "Capture" },
  { id: "review", label: "Review"  },
  { id: "saved",  label: "Saved"   },
];

export default function ScanPage() {
  const [pageState, setPageState] = useState<PageState>("scan");
  const [extracted, setExtracted] = useState<ExtractedReceiptData | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [savedId, setSavedId] = useState<string>("");

  function handleExtracted(data: ExtractedReceiptData, file: File) {
    setExtracted(data);
    setImageFile(file);
    setPageState("review");
  }

  async function handleConfirm(data: ExtractedReceiptData) {
    const { data: updated, error } = await supabase
      .from("fuel_logs")
      .update({
        seller_name:      data.seller_name,
        seller_address:   data.seller_address,
        seller_city:      data.seller_city,
        seller_state:     data.seller_state,
        fuel_type:        data.fuel_type,
        gallons:          data.gallons,
        price_per_gallon: data.price_per_gallon,
        total_price:      data.total_price,
        receipt_date:     data.receipt_date,
        truck_id:         data.truck_id,
        extracted_json:   data,
      })
      .eq("truck_id", data.truck_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .select()
      .single();

    if (error) throw new Error(error.message);
    setSavedId(updated?.id ?? "");
    setPageState("saved");
  }

  function handleDiscard() {
    setExtracted(null);
    setImageFile(null);
    setPageState("scan");
  }

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
  const currentStep = steps.findIndex((s) => s.id === pageState);

  return (
    <main className="min-h-screen">
      {/* ── Glass step indicator ── */}
      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
          {steps.map((step, i) => {
            const done   = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      done   ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/40" :
                      active ? "bg-blue-500 text-white shadow-md shadow-blue-500/40" :
                               "bg-white/10 text-white/30"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block transition-colors ${
                    active ? "text-blue-400" : done ? "text-emerald-400" : "text-white/30"
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 transition-colors duration-300 ${done ? "bg-emerald-500/50" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-10 space-y-4">
        <p className="text-center text-sm text-white/40">
          {pageState === "scan"   && "Capture or upload a fuel receipt"}
          {pageState === "review" && "Review and correct the extracted data before saving"}
          {pageState === "saved"  && "Receipt successfully saved to your IFTA log"}
        </p>

        {pageState === "scan" && (
          <ReceiptScanner onExtracted={handleExtracted} />
        )}

        {pageState === "review" && extracted && (
          <ExtractedDataCard
            data={extracted}
            imageUrl={previewUrl}
            onConfirm={handleConfirm}
            onDiscard={handleDiscard}
          />
        )}

        {pageState === "saved" && (
          <div className="flex flex-col items-center gap-5 py-14 text-center">
            {/* Animated success icon */}
            <div className="animate-float">
              <div className="glass rounded-full p-6 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-white">Receipt Logged</p>
              <p className="text-sm text-white/40 mt-1">Saved to your IFTA fuel log.</p>
              {savedId && (
                <p className="font-mono text-xs text-white/20 mt-1">#{savedId.slice(0, 8)}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="glass border-white/20 text-white hover:bg-white/10"
              >
                Scan Another
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30">
                <Link href="/audit">View Audit Summary</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
