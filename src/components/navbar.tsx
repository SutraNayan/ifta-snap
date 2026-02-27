"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Camera, BarChart3, Fuel } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-sm">
      <div className="flex items-center gap-2">
        {!isHome && (
          <Link
            href="/"
            className="p-1.5 rounded-xl hover:bg-white/10 transition-colors mr-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-white/70" />
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/40">
            <Fuel className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">
            IFTA Snap-Audit
          </span>
        </Link>
      </div>

      {isHome && (
        <div className="flex items-center gap-1">
          <Link
            href="/scan"
            className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all"
          >
            <Camera className="h-3.5 w-3.5" />
            Scan
          </Link>
          <Link
            href="/audit"
            className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Audit
          </Link>
        </div>
      )}

      {!isHome && (
        <span className="text-xs text-white/30 font-medium">
          {pathname === "/scan" ? "Scan Receipt" : "Audit Summary"}
        </span>
      )}
    </nav>
  );
}
