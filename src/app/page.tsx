import Link from "next/link";
import { Camera, BarChart3, FileText, Shield, Truck, Upload, CheckCircle, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Snap or Upload a Receipt",
    desc: "Take a photo with your phone camera or upload an image of any fuel receipt — gas station printout, handwritten slip, or e-receipt.",
    color: "text-blue-400",
    bg: "from-blue-500/15 to-cyan-500/5",
    border: "border-blue-500/20",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "AI Reads & You Confirm",
    desc: "Claude Vision automatically extracts the seller name, state, fuel type, gallons (3 decimal), price per gallon, and total. Review and correct anything before saving.",
    color: "text-emerald-400",
    bg: "from-emerald-500/15 to-teal-500/5",
    border: "border-emerald-500/20",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "File with Confidence",
    desc: "The Audit Summary page calculates your Georgia Net Taxable Gallons and estimated IFTA-100 tax due — ready for the GA Dept. of Revenue by your quarterly deadline.",
    color: "text-orange-400",
    bg: "from-orange-500/15 to-amber-500/5",
    border: "border-orange-500/20",
  },
];

const features = [
  {
    icon: Camera,
    title: "Vision-to-Audit Pipeline",
    desc: "AI extracts seller, gallons, fuel type, and location from any receipt photo.",
    gradient: "from-blue-500/20 to-cyan-500/10",
    iconColor: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    icon: BarChart3,
    title: "Net Taxable Gallons",
    desc: "Auto-calculates GA IFTA liability at 37.3¢/gal for Q1 2026.",
    gradient: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    icon: Shield,
    title: "Audit-Defensible",
    desc: "Digital scans stored as primary evidence for 4 years per IFTA Manual.",
    gradient: "from-orange-500/20 to-amber-500/10",
    iconColor: "text-orange-400",
    border: "border-orange-500/20",
  },
  {
    icon: FileText,
    title: "IFTA-100 PDF Export",
    desc: "Quarterly reports ready for GA Dept. of Revenue submission.",
    gradient: "from-purple-500/20 to-violet-500/10",
    iconColor: "text-purple-400",
    border: "border-purple-500/20",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center">

      {/* ── Hero ── */}
      <section className="w-full max-w-md px-4 pt-12 pb-6 flex flex-col items-center text-center">

        {/* Floating truck icon */}
        <div className="animate-float mb-6">
          <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center shadow-2xl shadow-blue-500/20 mx-auto">
            <Truck className="h-9 w-9 text-blue-400" />
          </div>
        </div>

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 glass border-blue-500/25 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          Georgia IFTA Compliance · 2026
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-3">
          <span className="text-white">Gwinnett IFTA</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent animate-pulse-glow">
            Snap-Audit
          </span>
        </h1>

        <p className="text-slate-400 text-sm max-w-[260px] leading-relaxed mb-8">
          AI-powered fuel receipt logging for small fleets. Audit-ready records in seconds.
        </p>

        {/* CTA buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/scan"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-all duration-150 shadow-lg shadow-blue-600/30"
          >
            <Camera className="h-4 w-4" />
            Scan Receipt
          </Link>
          <Link
            href="/audit"
            className="flex items-center gap-2 glass hover:bg-white/12 active:scale-95 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-all duration-150"
          >
            <BarChart3 className="h-4 w-4" />
            Audit Summary
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mt-10 w-full glass rounded-2xl px-4 py-4 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-white">37.3¢</p>
            <p className="text-xs text-slate-500 mt-0.5">GA Diesel/gal</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-white">Apr 30</p>
            <p className="text-xs text-slate-500 mt-0.5">Q1 Deadline</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-white">4 yr</p>
            <p className="text-xs text-slate-500 mt-0.5">Retention</p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="w-full max-w-md px-4 pb-8">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4 text-center">
          How It Works
        </p>

        <div className="space-y-3">
          {steps.map((s) => (
            <div
              key={s.number}
              className={`glass bg-gradient-to-br ${s.bg} ${s.border} rounded-2xl p-4 flex gap-4`}
            >
              {/* Step number + icon */}
              <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                <span className={`text-xs font-black ${s.color} opacity-60 tabular-nums`}>
                  {s.number}
                </span>
                <div className={`p-2 rounded-xl bg-white/5`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </div>
              {/* Text */}
              <div>
                <p className="font-semibold text-white text-sm">{s.title}</p>
                <p className="text-white/40 text-xs mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* IFTA formula explainer */}
        <div className="glass rounded-2xl p-4 mt-3 border-white/5">
          <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">IFTA Formula Used</p>
          <div className="space-y-1.5 text-xs text-white/40 font-mono">
            <p><span className="text-white/60">Fleet MPG</span> = Total Miles ÷ Diesel Gallons</p>
            <p><span className="text-white/60">GA Consumed</span> = GA Miles ÷ Fleet MPG</p>
            <p><span className="text-white/60">Net Taxable</span> = GA Consumed − GA Purchased</p>
            <p><span className="text-orange-400/80">Tax Due</span> = Net Taxable × $0.373</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="w-full max-w-md px-4 pb-10">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3 text-center">
          Features
        </p>
        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className={`glass bg-gradient-to-br ${f.gradient} ${f.border} rounded-2xl p-4 hover:scale-[1.02] transition-transform duration-200`}
            >
              <f.icon className={`h-5 w-5 ${f.iconColor} mb-3`} />
              <p className="font-semibold text-white text-xs leading-snug">{f.title}</p>
              <p className="text-white/40 text-xs mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pb-8 text-center px-4">
        <div className="glass rounded-2xl px-4 py-3 inline-block">
          <p className="text-xs text-white/30">
            Quarterly deadlines: <span className="text-white/50">Apr 30 · Jul 31 · Oct 31 · Jan 31</span>
          </p>
          <p className="text-xs text-white/20 mt-1">
            Late interest: 9%/yr (0.75%/mo) · GA Code §48-2-40
          </p>
        </div>
      </footer>
    </main>
  );
}
