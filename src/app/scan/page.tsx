"use client";

import { useState } from "react";
import { ReceiptScanner } from "@/components/scanner/receipt-scanner";
import { ExtractedDataCard } from "@/components/review-card/extracted-data-card";
import { ExtractedReceiptData } from "@/types/fuel-log";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Camera, ClipboardCheck, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PageState = "scan" | "review" | "saved";

const steps = [
  { id: "scan",   label: "Capture", icon: Camera },
  { id: "review", label: "Review",  icon: ClipboardCheck },
  { id: "saved",  label: "Saved",   icon: Save },
];

export default function ScanPage() {
  const [pageState, setPageState] = useState<PageState>("scan");
  const [extracted, setExtracted] = useState<ExtractedReceiptData | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [savedId,   setSavedId]   = useState<string>("");
  // ── FIX: store the DB record ID from the OCR API so we can update by PK ──
  const [logId, setLogId]         = useState<string>("");

  // ── Scanner calls this once OCR + initial insert is done ─────────────────
  function handleExtracted(data: ExtractedReceiptData, file: File, id: string) {
    setExtracted(data);
    setImageFile(file);
    setLogId(id);          // ← persist the inserted row's UUID
    setPageState("review");
  }

  // ── User confirmed / edited → update the existing row by PK ─────────────
  async function handleConfirm(data: ExtractedReceiptData) {
    // FIX: use .eq("id", logId) — .order()/.limit() are not valid on UPDATE
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
      .eq("id", logId)    // ← direct PK match, always succeeds
      .select()
      .single();

    if (error) throw new Error(error.message);
    setSavedId(updated?.id ?? "");
    setPageState("saved"); // ← now reliably reached every time
  }

  function handleDiscard() {
    setExtracted(null);
    setImageFile(null);
    setLogId("");
    setPageState("scan");
  }

  const previewUrl  = imageFile ? URL.createObjectURL(imageFile) : undefined;
  const currentStep = steps.findIndex((s) => s.id === pageState);

  return (
    <main className="min-h-screen flex flex-col">

      {/* ── Step indicator ───────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-1">
        <div className="glass rounded-2xl px-5 py-4 flex items-center max-w-md mx-auto">
          {steps.map((step, i) => {
            const done   = i < currentStep;
            const active = i === currentStep;
            const Icon   = step.icon;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    done   ? "bg-emerald-500 shadow-lg shadow-emerald-500/40" :
                    active ? "bg-blue-500 shadow-lg shadow-blue-500/40" :
                             "bg-white/10"
                  }`}>
                    {done
                      ? <span className="text-white font-bold text-sm">✓</span>
                      : <Icon className={`h-4 w-4 ${active ? "text-white" : "text-white/30"}`} />
                    }
                  </div>
                  <span className={`text-[11px] font-semibold tracking-wide transition-colors ${
                    active ? "text-blue-400" : done ? "text-emerald-400" : "text-white/25"
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-colors duration-300 ${
                    done ? "bg-emerald-500/50" : "bg-white/10"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sub-heading ──────────────────────────────────────────────── */}
      <p className="text-center text-sm text-white/40 px-4 py-2">
        {pageState === "scan"   && "Capture or upload a fuel receipt"}
        {pageState === "review" && "Check the details — fix anything before saving"}
        {pageState === "saved"  && "Receipt saved to your IFTA log"}
      </p>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-md mx-auto px-4 pb-10">

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
          <div className="flex flex-col items-center gap-6 pt-10 pb-6 text-center">
            <div className="animate-float">
              <div className="glass rounded-full p-7 shadow-2xl shadow-emerald-500/25">
                <CheckCircle2 className="h-16 w-16 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">Receipt Logged!</p>
              <p className="text-white/40 text-sm leading-relaxed max-w-[220px] mx-auto">
                Fuel purchase saved and counted in your Q1 2026 IFTA summary.
              </p>
              {savedId && (
                <p className="font-mono text-xs text-white/20 mt-1">#{savedId.slice(0, 8)}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleDiscard}
                className="w-full h-14 text-base font-semibold rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30"
              >
                <Camera className="h-5 w-5 mr-2" />
                Scan Another Receipt
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-14 text-base font-semibold rounded-2xl glass border-white/20 text-white hover:bg-white/10"
              >
                <Link href="/audit">View Audit Summary</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
