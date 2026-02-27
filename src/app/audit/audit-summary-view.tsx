"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  TrendingUp,
  Fuel,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
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
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-4 ${accent ?? ""}`}>
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

export function AuditSummaryView() {
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterOption>(QUARTERS[0]);
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [milesTotal, setMilesTotal] = useState<string>("");
  const [milesGa, setMilesGa] = useState<string>("");

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

  const totalGallons   = logs.reduce((s, l) => s + Number(l.gallons), 0);
  const gaGallons      = logs.filter((l) => l.seller_state.toUpperCase() === "GA" && l.fuel_type === "Diesel").reduce((s, l) => s + Number(l.gallons), 0);
  const dieselGallons  = logs.filter((l) => l.fuel_type === "Diesel").reduce((s, l) => s + Number(l.gallons), 0);
  const totalMiles     = parseFloat(milesTotal) || 0;
  const gaMiles        = parseFloat(milesGa) || 0;
  const mpg                = dieselGallons > 0 ? totalMiles / dieselGallons : 0;
  const gallonsConsumedGa  = mpg > 0 ? gaMiles / mpg : 0;
  const netTaxableGallonsGa = gallonsConsumedGa - gaGallons;
  const taxDueGa           = netTaxableGallonsGa * GA_DIESEL_TAX_RATE_2026;

  const isDeadlineSoon = (() => {
    const diff = (new Date(selectedQuarter.deadline).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 14;
  })();

  const taxPositive = taxDueGa >= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Header ── */}
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

      {/* ── Quarter selector ── */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-white/40 mb-1.5">Reporting Quarter</p>
            <Select
              value={selectedQuarter.value}
              onValueChange={(v) => { const q = QUARTERS.find((q) => q.value === v); if (q) setSelectedQuarter(q); }}
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

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <GlassStatCard label="Total Gallons Purchased" value={totalGallons.toFixed(3)} sub="All fuel types" icon={Fuel} />
        <GlassStatCard label="GA Diesel Purchased"     value={gaGallons.toFixed(3)}    sub="Georgia in-state" icon={Fuel} />
        <GlassStatCard label="Total Receipts"          value={String(logs.length)}     sub={selectedQuarter.label} icon={FileText} />
        <GlassStatCard label="Diesel Gallons"          value={dieselGallons.toFixed(3)} sub="IFTA-taxable fuel" icon={TrendingUp} />
      </div>

      {/* ── Mileage inputs ── */}
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
              value={milesTotal}
              onChange={(e) => setMilesTotal(e.target.value)}
              placeholder="e.g. 12500"
              className="mt-1 w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-white/40">Miles in Georgia</label>
            <input
              type="number"
              value={milesGa}
              onChange={(e) => setMilesGa(e.target.value)}
              placeholder="e.g. 4200"
              className="mt-1 w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
        {mpg > 0 && (
          <p className="text-xs text-white/30">
            Fleet MPG: <span className="font-mono font-semibold text-white/60">{mpg.toFixed(2)}</span>
          </p>
        )}
      </div>

      {/* ── Net Taxable Gallons result ── */}
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

      {/* ── Receipt log table ── */}
      {logs.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm font-semibold text-white mb-3">Receipt Log ({logs.length})</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-white/60">
              <thead>
                <tr className="border-b border-white/10 text-white/30">
                  <th className="text-left py-1.5 pr-3">Date</th>
                  <th className="text-left py-1.5 pr-3">Seller</th>
                  <th className="text-left py-1.5 pr-3">State</th>
                  <th className="text-left py-1.5 pr-3">Type</th>
                  <th className="text-right py-1.5">Gallons</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2 pr-3 font-mono text-white/50">{log.receipt_date}</td>
                    <td className="py-2 pr-3 max-w-[130px] truncate text-white/70">{log.seller_name}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${log.seller_state === "GA" ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-white/50"}`}>
                        {log.seller_state}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-white/50">{log.fuel_type}</td>
                    <td className="py-2 text-right font-mono text-white/70">{Number(log.gallons).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
