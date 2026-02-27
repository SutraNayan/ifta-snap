"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExtractedReceiptData, FuelType } from "@/types/fuel-log";

interface ExtractedDataCardProps {
  data: ExtractedReceiptData;
  imageUrl?: string;
  onConfirm: (data: ExtractedReceiptData) => Promise<void>;
  onDiscard: () => void;
}

const FUEL_TYPES: FuelType[] = ["Diesel", "Gas", "DEF", "Other"];

// ── Shared input style — text-base (16px) prevents iOS auto-zoom ──────────
const inputCls = (err?: string) =>
  `w-full bg-white/10 border ${err ? "border-red-400/70" : "border-white/15"} rounded-xl px-4 py-3.5 text-base text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors`;

const labelCls = "block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5";

export function ExtractedDataCard({
  data,
  imageUrl,
  onConfirm,
  onDiscard,
}: ExtractedDataCardProps) {
  const [form,    setForm]    = useState<ExtractedReceiptData>({ ...data });
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState<Partial<Record<keyof ExtractedReceiptData, string>>>({});
  const [imgOpen, setImgOpen] = useState(false);

  const isGa = form.seller_state.toUpperCase() === "GA";

  function update<K extends keyof ExtractedReceiptData>(key: K, val: ExtractedReceiptData[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.seller_name.trim())  next.seller_name  = "Required";
    if (!form.seller_state.trim()) next.seller_state = "Required";
    if (!form.seller_city.trim())  next.seller_city  = "Required";
    if (form.gallons <= 0)         next.gallons       = "Must be > 0";
    if (!form.receipt_date)        next.receipt_date  = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await onConfirm(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-4 pb-4">

      {/* ── AI confidence banner ─────────────────────────────────────── */}
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertCircle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Review Before Saving</p>
          <p className="text-white/40 text-xs mt-0.5">AI reads most receipts perfectly — check critical fields just in case.</p>
        </div>
        {isGa && (
          <span className="shrink-0 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold px-2 py-1 rounded-lg">
            GA
          </span>
        )}
      </div>

      {/* ── Receipt image preview (collapsible) ──────────────────────── */}
      {imageUrl && (
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setImgOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-white/60 hover:text-white transition-colors"
          >
            <span className="text-sm font-semibold text-white/70">Receipt Image</span>
            {imgOpen
              ? <ChevronUp className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />
            }
          </button>
          {imgOpen && (
            <div className="border-t border-white/8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Receipt"
                className="w-full object-contain max-h-64 bg-white/5"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Section: Seller ──────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Seller Info</p>

        <div>
          <label className={labelCls}>Seller Name *</label>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={form.seller_name}
            onChange={(e) => update("seller_name", e.target.value)}
            placeholder="e.g. Pilot Flying J"
            className={inputCls(errors.seller_name)}
          />
          {errors.seller_name && <p className="text-xs text-red-400 mt-1">{errors.seller_name}</p>}
        </div>

        <div>
          <label className={labelCls}>Street Address</label>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={form.seller_address}
            onChange={(e) => update("seller_address", e.target.value)}
            placeholder="e.g. 6200 Governors Lake Pkwy"
            className={inputCls()}
          />
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <label className={labelCls}>City *</label>
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={form.seller_city}
              onChange={(e) => update("seller_city", e.target.value)}
              placeholder="City"
              className={inputCls(errors.seller_city)}
            />
            {errors.seller_city && <p className="text-xs text-red-400 mt-1">{errors.seller_city}</p>}
          </div>
          <div className="col-span-2">
            <label className={labelCls}>State *</label>
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={form.seller_state}
              onChange={(e) => update("seller_state", e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="GA"
              className={`${inputCls(errors.seller_state)} uppercase text-center tracking-widest`}
            />
            {errors.seller_state && <p className="text-xs text-red-400 mt-1">{errors.seller_state}</p>}
          </div>
        </div>
      </div>

      {/* ── Section: Fuel Data ───────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Fuel Data</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Fuel Type</label>
            <Select value={form.fuel_type} onValueChange={(v) => update("fuel_type", v as FuelType)}>
              <SelectTrigger className="h-14 bg-white/10 border-white/15 text-white text-base rounded-xl focus:ring-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUEL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-base">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Date *</label>
            <input
              type="date"
              value={form.receipt_date}
              onChange={(e) => update("receipt_date", e.target.value)}
              className={inputCls(errors.receipt_date)}
            />
            {errors.receipt_date && <p className="text-xs text-red-400 mt-1">{errors.receipt_date}</p>}
          </div>
        </div>

        {/* Gallons — most important field, gets full width */}
        <div>
          <label className={labelCls}>Gallons * (3 decimal places)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            value={form.gallons}
            onChange={(e) => update("gallons", parseFloat(e.target.value) || 0)}
            className={`${inputCls(errors.gallons)} text-xl font-bold tracking-wider`}
          />
          {errors.gallons && <p className="text-xs text-red-400 mt-1">{errors.gallons}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Price / Gallon</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              value={form.price_per_gallon}
              onChange={(e) => update("price_per_gallon", parseFloat(e.target.value) || 0)}
              className={inputCls()}
            />
          </div>
          <div>
            <label className={labelCls}>Total $</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.total_price}
              onChange={(e) => update("total_price", parseFloat(e.target.value) || 0)}
              className={inputCls()}
            />
          </div>
        </div>
      </div>

      {/* ── Section: Vehicle ─────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Vehicle</p>
        <div>
          <label className={labelCls}>Unit # / License Plate</label>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={form.truck_id}
            onChange={(e) => update("truck_id", e.target.value)}
            placeholder="e.g. Unit 42 or GWI-TRUCK-01"
            className={inputCls()}
          />
        </div>
      </div>

      {/* ── GA tax callout ───────────────────────────────────────────── */}
      {isGa && (
        <div className="glass rounded-2xl p-4 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-blue-300 text-xs font-bold">GA</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Georgia In-State Purchase</p>
              <p className="text-white/40 text-xs mt-1">
                Q1 2026 rate: $0.373/gal ·{" "}
                <span className="text-blue-300 font-mono font-semibold">
                  Est. tax: ${(form.gallons * 0.373).toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Action buttons ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-16 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-150"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-6 w-6" />
              Save to Log
            </>
          )}
        </button>

        <button
          onClick={onDiscard}
          disabled={saving}
          className="w-full h-14 flex items-center justify-center gap-2 glass border border-white/15 hover:bg-white/10 active:scale-[0.98] disabled:opacity-40 text-white/60 font-semibold text-base rounded-2xl transition-all duration-150"
        >
          <X className="h-4 w-4" />
          Discard
        </button>
      </div>

      <p className="text-xs text-white/20 text-center pb-2">
        Receipts retained 4 years per IFTA Procedures Manual
      </p>
    </div>
  );
}
