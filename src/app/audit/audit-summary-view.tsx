"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  TrendingUp,
  Fuel,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { FuelLog, GA_DIESEL_TAX_RATE_2026 } from "@/types/fuel-log";

const QUARTERS = [
  { label: "Q1 2026 (Jan–Mar)", value: "2026-Q1", start: "2026-01-01", end: "2026-03-31", deadline: "Apr 30, 2026" },
  { label: "Q4 2025 (Oct–Dec)", value: "2025-Q4", start: "2025-10-01", end: "2025-12-31", deadline: "Jan 31, 2026" },
  { label: "Q3 2025 (Jul–Sep)", value: "2025-Q3", start: "2025-07-01", end: "2025-09-30", deadline: "Oct 31, 2025" },
  { label: "Q2 2025 (Apr–Jun)", value: "2025-Q2", start: "2025-04-01", end: "2025-06-30", deadline: "Jul 31, 2025" },
];

interface QuarterOption {
  label: string; value: string; start: string; end: string; deadline: string;
}

function GlassStatCard({
  label, value, sub, icon: Icon,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
        </div>
        <div className="p-2 rounded-xl bg-white/10">
          <Icon className="h-4 w-4 text-white/60" />
        </div>
      </div>
    </div>
  );
}

// ── Format date for display e.g. "Feb 18, 2026" ───────────────────────────
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

export function AuditSummaryView() {
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption>(QUARTERS[0]);
  const [logs,       setLogs]       = useState<FuelLog[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [milesTotal, setMilesTotal] = useState<string>("");
  const [milesGa,    setMilesGa]    = useState<string>("");
  // ── Delete state: id of the row currently showing the confirm prompt ──────
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");

  const fetchLogs = useCallback(async (q: QuarterOption) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fuel_logs")
      .select("*")
      .gte("receipt_date", q.start)
      .lte("receipt_date", q.end)
      .order("receipt_date", { ascending: true });
    if (!error && data) setLogs(data as FuelLog[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(selectedQuarter); }, [selectedQuarter, fetchLogs]);

  // ── Delete a receipt log by ID ────────────────────────────────────────────
  async function confirmDelete(id: string) {
    setDeleteError("");
    const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
    if (error) {
      setDeleteError("Delete failed — try again.");
      return;
    }
    // Optimistic remove from local state (no full refetch needed)
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  }

  const totalGallons        = logs.reduce((s, l) => s + Number(l.gallons), 0);
  const gaGallons           = logs.filter((l) => l.seller_state.toUpperCase() === "GA" && l.fuel_type === "Diesel").reduce((s, l) => s + Number(l.gallons), 0);
  const dieselGallons       = logs.filter((l) => l.fuel_type === "Diesel").reduce((s, l) => s + Number(l.gallons), 0);
  const totalMiles          = parseFloat(milesTotal) || 0;
  const gaMiles             = parseFloat(milesGa) || 0;
  const mpg                 = dieselGallons > 0 ? totalMiles / dieselGallons : 0;
  const gallonsConsumedGa   = mpg > 0 ? gaMiles / mpg : 0;
  const netTaxableGallonsGa = gallonsConsumedGa - gaGallons;
  const taxDueGa            = netTaxableGallonsGa * GA_DIESEL_TAX_RATE_2026;

  const isDeadlineSoon = (() => {
    const diff = (new Date(selectedQuarter.deadline).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 14;
  })();

  const taxPositive = taxDueGa >= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-white">IFTA Audit Summary</h1>
          <p className="text-sm text-white/40">Georgia · Net Taxable Gallons Calculator</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchLogs(selectedQuarter)}
          disabled={loading}
          className="glass border border-white/15 text-white/70 hover:text-white hover:bg-white/10 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Quarter selector ─────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-white/40 mb-1.5">Reporting Quarter</p>
            <Select
              value={selectedQuarter.value}
              onValueChange={(v) => {
                const q = QUARTERS.find((q) => q.value === v);
                if (q) { setSelectedQuarter(q); setDeletingId(null); }
              }}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUARTERS.map((q) => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-white/40">Filing Deadline</p>
            <Badge
              variant={isDeadlineSoon ? "destructive" : "outline"}
              className={`mt-1 text-xs ${!isDeadlineSoon ? "border-white/20 text-white/60 bg-transparent" : ""}`}
            >
              {isDeadlineSoon && <AlertTriangle className="h-3 w-3 mr-1" />}
              {selectedQuarter.deadline}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <GlassStatCard label="Total Gallons Purchased" value={totalGallons.toFixed(3)} sub="All fuel types"    icon={Fuel} />
        <GlassStatCard label="GA Diesel Purchased"     value={gaGallons.toFixed(3)}    sub="Georgia in-state" icon={Fuel} />
        <GlassStatCard label="Total Receipts"          value={String(logs.length)}     sub={selectedQuarter.label} icon={FileText} />
        <GlassStatCard label="Diesel Gallons"          value={dieselGallons.toFixed(3)} sub="IFTA-taxable fuel" icon={TrendingUp} />
      </div>

      {/* ── Mileage inputs ───────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-white/40" />
          Mileage Inputs
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40">Total Miles (All States)</label>
            <input
              type="number"
              inputMode="numeric"
              value={milesTotal}
              onChange={(e) => setMilesTotal(e.target.value)}
              placeholder="e.g. 12500"
              className="mt-1 w-full bg-white/10 border border-white/15 rounded-xl px-3 py-3 text-base text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-white/40">Miles in Georgia</label>
            <input
              type="number"
              inputMode="numeric"
              value={milesGa}
              onChange={(e) => setMilesGa(e.target.value)}
              placeholder="e.g. 4200"
              className="mt-1 w-full bg-white/10 border border-white/15 rounded-xl px-3 py-3 text-base text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
        {mpg > 0 && (
          <p className="text-xs text-white/30">
            Fleet MPG: <span className="font-mono font-semibold text-white/60">{mpg.toFixed(2)}</span>
          </p>
        )}
      </div>

      {/* ── Net Taxable Gallons result ────────────────────────────────── */}
      <div className={`glass rounded-2xl p-4 border ${taxPositive ? "border-orange-500/30 bg-orange-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
        <p className="text-sm font-semibold text-white mb-3">
          Georgia Net Taxable Gallons (IFTA-100)
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-white/40">Consumed GA</p>
            <p className="text-lg font-bold text-white mt-1">{gallonsConsumedGa.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Purchased GA</p>
            <p className="text-lg font-bold text-white mt-1">{gaGallons.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Net Taxable</p>
            <p className={`text-lg font-bold mt-1 ${taxPositive ? "text-orange-400" : "text-emerald-400"}`}>
              {netTaxableGallonsGa.toFixed(3)}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
          <div>
            <p className="text-xs text-white/30">$0.373/gal · GA Code §48-2-40</p>
            {!taxPositive && (
              <p className="text-xs text-emerald-400 mt-1 font-medium">GA owes you a credit.</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-white/30">Estimated Tax</p>
            <p className={`text-2xl font-bold ${taxPositive ? "text-orange-400" : "text-emerald-400"}`}>
              {taxPositive ? "" : "−"}${Math.abs(taxDueGa).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Receipt log — card list with delete ──────────────────────── */}
      {logs.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">
              Receipt Log <span className="text-white/40">({logs.length})</span>
            </p>
            <p className="text-xs text-white/25">Tap 🗑 to remove</p>
          </div>

          {deleteError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">
              {deleteError}
            </div>
          )}

          {logs.map((log) => (
            <div key={log.id}>
              {/* ── Normal row ───────────────────────────────────────── */}
              {deletingId !== log.id && (
                <div className="flex items-center gap-3 bg-white/4 hover:bg-white/7 rounded-xl px-3 py-3 transition-colors group">
                  {/* State badge */}
                  <span className={`shrink-0 w-8 text-center text-xs font-bold px-1 py-0.5 rounded-md ${
                    log.seller_state === "GA"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-white/10 text-white/50"
                  }`}>
                    {log.seller_state}
                  </span>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/85 text-sm font-medium truncate">{log.seller_name}</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {fmtDate(log.receipt_date)} · {log.fuel_type}
                    </p>
                  </div>

                  {/* Gallons */}
                  <div className="text-right shrink-0">
                    <p className="font-mono text-white/70 text-sm font-semibold">
                      {Number(log.gallons).toFixed(3)}
                    </p>
                    <p className="text-white/25 text-xs">gal</p>
                  </div>

                  {/* Delete trigger */}
                  <button
                    onClick={() => { setDeletingId(log.id); setDeleteError(""); }}
                    className="shrink-0 p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all duration-150"
                    aria-label="Delete receipt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* ── Inline delete confirmation ────────────────────────── */}
              {deletingId === log.id && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-3">
                  <p className="text-white/80 text-sm font-medium mb-0.5 truncate">
                    Delete <span className="text-white">{log.seller_name}</span>?
                  </p>
                  <p className="text-white/35 text-xs mb-3">
                    {fmtDate(log.receipt_date)} · {Number(log.gallons).toFixed(3)} gal — this cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmDelete(log.id)}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-400 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all duration-150"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => { setDeletingId(null); setDeleteError(""); }}
                      className="flex-1 h-10 flex items-center justify-center gap-1.5 glass border border-white/20 hover:bg-white/10 active:scale-[0.98] text-white/60 text-sm font-semibold rounded-xl transition-all duration-150"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {logs.length === 0 && !loading && (
        <div className="glass rounded-2xl border-dashed border-white/10 py-12 text-center">
          <FileText className="h-8 w-8 mx-auto mb-3 text-white/20" />
          <p className="text-sm text-white/30">No receipts for {selectedQuarter.label}</p>
          <p className="text-xs text-white/20 mt-1">Scan receipts to populate this quarter.</p>
        </div>
      )}
    </div>
  );
}
