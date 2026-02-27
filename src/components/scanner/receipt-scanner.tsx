"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, Upload, X, RotateCcw, Loader2, Fuel, ImagePlus } from "lucide-react";
import { ExtractedReceiptData } from "@/types/fuel-log";

interface ReceiptScannerProps {
  // FIX: added `logId` (3rd arg) so parent can store the DB record's PK
  onExtracted: (data: ExtractedReceiptData, imageFile: File, logId: string) => void;
  truckId?: string;
}

type ScanState = "idle" | "camera" | "preview" | "processing" | "error";

export function ReceiptScanner({ onExtracted, truckId = "" }: ReceiptScannerProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const [scanState,   setScanState]   = useState<ScanState>("idle");
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [errorMsg,    setErrorMsg]    = useState<string>("");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    setScanState("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setErrorMsg("Camera access denied. Use the Upload button instead.");
      setScanState("error");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" });
        setCapturedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stopStream();
        setScanState("preview");
      },
      "image/jpeg",
      0.92
    );
  }, [stopStream]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState("preview");
  }, []);

  const processReceipt = useCallback(async () => {
    if (!capturedFile) return;
    setScanState("processing");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("receipt",  capturedFile);
      formData.append("truck_id", truckId);

      const res  = await fetch("/api/extract-receipt", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Extraction failed");

      // FIX: pass json.log.id as 3rd argument so parent can update by PK
      onExtracted(json.extracted as ExtractedReceiptData, capturedFile, json.log?.id ?? "");
      setScanState("idle");
      setCapturedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Processing failed. Please try again.");
      setScanState("error");
    }
  }, [capturedFile, truckId, onExtracted]);

  const reset = useCallback(() => {
    stopStream();
    setPreviewUrl(null);
    setCapturedFile(null);
    setErrorMsg("");
    setScanState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [stopStream]);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── IDLE ─────────────────────────────────────────────────────── */}
      {scanState === "idle" && (
        <div className="glass rounded-3xl overflow-hidden">
          {/* Hero area */}
          <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-6 text-center">
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Fuel className="h-9 w-9 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">Scan Fuel Receipt</p>
              <p className="text-sm text-white/40 mt-1 leading-relaxed max-w-[240px] mx-auto">
                Snap a photo or upload an image — AI reads seller, gallons &amp; fuel type in seconds.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 pb-8 flex flex-col gap-3">
            <button
              onClick={startCamera}
              className="w-full h-16 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-150"
            >
              <Camera className="h-6 w-6" />
              Take Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-16 flex items-center justify-center gap-3 glass border border-white/20 hover:bg-white/10 active:scale-[0.98] text-white font-bold text-lg rounded-2xl transition-all duration-150"
            >
              <ImagePlus className="h-6 w-6 text-white/70" />
              Upload Image
            </button>
          </div>

          {/* Tips */}
          <div className="border-t border-white/8 px-6 py-4">
            <p className="text-xs text-white/25 text-center leading-relaxed">
              Supports JPG, PNG · Gas station printouts, handwritten slips, e-receipts
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* ── CAMERA ───────────────────────────────────────────────────── */}
      {scanState === "camera" && (
        <div className="rounded-3xl overflow-hidden relative bg-black">
          <video
            ref={videoRef}
            className="w-full aspect-[3/4] object-cover"
            playsInline
            muted
          />
          {/* Crop guide */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-5 border-2 border-white/50 rounded-2xl" />
            <div className="absolute top-8 left-0 right-0 text-center">
              <span className="glass text-white text-xs font-medium px-3 py-1.5 rounded-full">
                Align receipt within frame
              </span>
            </div>
          </div>
          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 pb-8 pt-6 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center gap-8">
            <button
              onClick={reset}
              className="w-12 h-12 rounded-full glass border border-white/30 flex items-center justify-center"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white border-4 border-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/40 active:scale-95 transition-transform"
            >
              <Camera className="h-8 w-8 text-blue-600" />
            </button>
            <div className="w-12 h-12" /> {/* spacer */}
          </div>
        </div>
      )}

      {/* ── PREVIEW ──────────────────────────────────────────────────── */}
      {scanState === "preview" && previewUrl && (
        <div className="glass rounded-3xl overflow-hidden">
          {/* Receipt image */}
          <div className="relative bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="w-full object-contain max-h-[55vh]"
            />
            <div className="absolute top-3 right-3">
              <span className="glass border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                Ready to Process
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 flex flex-col gap-3">
            <button
              onClick={processReceipt}
              className="w-full h-16 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-150"
            >
              <Upload className="h-5 w-5" />
              Extract with AI
            </button>
            <button
              onClick={reset}
              className="w-full h-14 flex items-center justify-center gap-2 glass border border-white/20 hover:bg-white/10 active:scale-[0.98] text-white/70 font-semibold text-base rounded-2xl transition-all duration-150"
            >
              <RotateCcw className="h-4 w-4" />
              Retake / Choose Different
            </button>
          </div>
        </div>
      )}

      {/* ── PROCESSING ───────────────────────────────────────────────── */}
      {scanState === "processing" && (
        <div className="glass rounded-3xl px-6 py-14 flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center">
              <Fuel className="h-9 w-9 text-blue-400" />
            </div>
            <Loader2 className="absolute -top-2 -right-2 h-8 w-8 animate-spin text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">Reading Receipt…</p>
            <p className="text-white/40 text-sm mt-2 leading-relaxed max-w-[220px] mx-auto">
              AI is extracting seller, gallons, fuel type &amp; date. Takes 3–5 seconds.
            </p>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────────────────── */}
      {scanState === "error" && (
        <div className="glass rounded-3xl px-6 py-12 flex flex-col items-center gap-5 text-center border border-red-500/20">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Something went wrong</p>
            <p className="text-red-400/80 text-sm mt-2 leading-relaxed max-w-[240px] mx-auto">
              {errorMsg}
            </p>
          </div>
          <button
            onClick={reset}
            className="w-full max-w-xs h-14 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 active:scale-[0.98] text-white font-semibold text-base rounded-2xl transition-all duration-150"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
