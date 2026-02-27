export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 px-4 pt-5 pb-8 text-center space-y-3">

      {/* Disclaimer */}
      <div className="max-w-sm mx-auto space-y-1.5">
        <p className="text-[11px] text-white/20 leading-relaxed">
          <span className="text-white/30 font-semibold">Disclaimer:</span> Tax figures shown are
          estimates only and are provided for informational purposes. Verify all calculations with a
          licensed tax professional or CPA before submitting your IFTA-100 return to the Georgia
          Department of Revenue.
        </p>
        <p className="text-[11px] text-white/15 leading-relaxed">
          This app is not affiliated with, endorsed by, or sponsored by the Georgia Department of
          Revenue, IFTA, Inc., or any government agency.
        </p>
      </div>

      {/* Divider */}
      <div className="w-12 h-px bg-white/10 mx-auto" />

      {/* Copyright */}
      <p className="text-[11px] text-white/20 tracking-wide">
        © {new Date().getFullYear()} Nayan · PropTechAgent · All rights reserved
      </p>

    </footer>
  );
}
