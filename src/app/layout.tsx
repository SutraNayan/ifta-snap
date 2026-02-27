import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gwinnett IFTA Snap-Audit",
  description: "AI-powered fuel receipt logging for Georgia IFTA compliance.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* ── Fixed deep-space gradient background ── */}
        <div className="fixed inset-0 -z-20 bg-gradient-to-br from-[#0a0a1a] via-[#0d1b3e] to-[#0a0a1a]" />

        {/* ── Animated colour blobs ── */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="animate-blob absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-blue-600/20 blur-3xl" />
          <div className="animate-blob delay-2000 absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="animate-blob delay-4000 absolute -bottom-32 left-1/3 w-[360px] h-[360px] rounded-full bg-cyan-600/15 blur-3xl" />
        </div>

        <Navbar />

        {/* Flex-grow so footer always stays at the bottom */}
        <div className="flex-1">
          {children}
        </div>

        <SiteFooter />
      </body>
    </html>
  );
}
