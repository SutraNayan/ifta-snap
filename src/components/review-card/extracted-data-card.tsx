"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export function ExtractedDataCard({
  data,
  imageUrl,
  onConfirm,
  onDiscard,
}: ExtractedDataCardProps) {
  const [form, setForm] = useState<ExtractedReceiptData>({ ...data });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ExtractedReceiptData, string>>>({});

  const isGa = form.seller_state.toUpperCase() === "GA";

  function update<K extends keyof ExtractedReceiptData>(key: K, value: ExtractedReceiptData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.seller_name.trim()) next.seller_name = "Required";
    if (!form.seller_state.trim()) next.seller_state = "Required";
    if (!form.seller_city.trim()) next.seller_city = "Required";
    if (form.gallons <= 0) next.gallons = "Must be > 0";
    if (!form.receipt_date) next.receipt_date = "Required";
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Review Extracted Data</CardTitle>
          <div className="flex gap-2">
            {isGa && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">GA Purchase</Badge>
            )}
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              <AlertCircle className="h-3 w-3 mr-1" />
              Verify Before Saving
            </Badge>
          </div>
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Receipt"
            className="mt-2 rounded-md max-h-40 object-contain border border-slate-200 w-full"
          />
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Seller Info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Seller Information
          </p>
          <div>
            <Label htmlFor="seller_name">Seller Name *</Label>
            <Input
              id="seller_name"
              value={form.seller_name}
              onChange={(e) => update("seller_name", e.target.value)}
              className={errors.seller_name ? "border-red-400" : ""}
            />
            {errors.seller_name && (
              <p className="text-xs text-red-500 mt-1">{errors.seller_name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="seller_address">Address</Label>
            <Input
              id="seller_address"
              value={form.seller_address}
              onChange={(e) => update("seller_address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="seller_city">City *</Label>
              <Input
                id="seller_city"
                value={form.seller_city}
                onChange={(e) => update("seller_city", e.target.value)}
                className={errors.seller_city ? "border-red-400" : ""}
              />
              {errors.seller_city && (
                <p className="text-xs text-red-500 mt-1">{errors.seller_city}</p>
              )}
            </div>
            <div>
              <Label htmlFor="seller_state">State *</Label>
              <Input
                id="seller_state"
                value={form.seller_state}
                onChange={(e) => update("seller_state", e.target.value.toUpperCase())}
                maxLength={2}
                className={`uppercase ${errors.seller_state ? "border-red-400" : ""}`}
              />
              {errors.seller_state && (
                <p className="text-xs text-red-500 mt-1">{errors.seller_state}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fuel Data */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Fuel Data
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="fuel_type">Fuel Type</Label>
              <Select
                value={form.fuel_type}
                onValueChange={(v) => update("fuel_type", v as FuelType)}
              >
                <SelectTrigger id="fuel_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="receipt_date">Date *</Label>
              <Input
                id="receipt_date"
                type="date"
                value={form.receipt_date}
                onChange={(e) => update("receipt_date", e.target.value)}
                className={errors.receipt_date ? "border-red-400" : ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="gallons">Gallons *</Label>
              <Input
                id="gallons"
                type="number"
                step="0.001"
                value={form.gallons}
                onChange={(e) => update("gallons", parseFloat(e.target.value) || 0)}
                className={errors.gallons ? "border-red-400" : ""}
              />
              {errors.gallons && (
                <p className="text-xs text-red-500 mt-1">{errors.gallons}</p>
              )}
            </div>
            <div>
              <Label htmlFor="ppg">$/Gallon</Label>
              <Input
                id="ppg"
                type="number"
                step="0.001"
                value={form.price_per_gallon}
                onChange={(e) => update("price_per_gallon", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="total">Total $</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={form.total_price}
                onChange={(e) => update("total_price", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</p>
          <div>
            <Label htmlFor="truck_id">Unit # / License Plate</Label>
            <Input
              id="truck_id"
              value={form.truck_id}
              onChange={(e) => update("truck_id", e.target.value)}
              placeholder="e.g., Unit 42 or ABC-1234"
            />
          </div>
        </div>

        {/* GA Tax Callout */}
        {isGa && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            <p className="font-semibold">Georgia In-State Purchase</p>
            <p className="text-xs mt-1">
              GA Diesel Tax (Q1 2026): $0.373/gal ·{" "}
              <span className="font-mono font-semibold">
                Est. tax: ${(form.gallons * 0.373).toFixed(2)}
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={onDiscard}>
            <X className="h-4 w-4" />
            Discard
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save to Log
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-400 text-center">
          Saved receipts are retained 4 years per IFTA Procedures Manual.
        </p>
      </CardContent>
    </Card>
  );
}
