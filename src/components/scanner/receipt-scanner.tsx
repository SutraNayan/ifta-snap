"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, Upload, X, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExtractedReceiptData } from "@/types/fuel-log";

interface ReceiptScannerProps {
  onExtracted: (data: ExtractedReceiptData, imageFile: File) => void;
  truckId?: string;
}

type ScanState = "idle" | "camera" | "preview" | "processing" | "error";

export function ReceiptScanner({ onExtracted, truckId = "" }: ReceiptScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

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
      setErrorMsg("Camera access denied. Use file upload instead.");
      setScanState("error");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setCapturedFile(file);
        setPreviewUrl(url);
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
    const url = URL.createObjectURL(file);
    setCapturedFile(file);
    setPreviewUrl(url);
    setScanState("preview");
  }, []);

  const processReceipt = useCallback(async () => {
    if (!capturedFile) return;
    setScanState("processing");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("receipt", capturedFile);
      formData.append("truck_id", truckId);

      const res = await fetch("/api/extract-receipt", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Extraction failed");
      onExtracted(json.extracted as ExtractedReceiptData, capturedFile);
      // reset called via onExtracted handler in parent
      setScanState("idle");
      setCapturedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Processing failed");
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
    <div className="w-full max-w-md mx-auto">
      <canvas ref={canvasRef} className="hidden" />

      {/* IDLE STATE */}
      {scanState === "idle" && (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="flex flex-col items-center gap-4 py-10 px-6">
            <div className="rounded-full bg-blue-100 p-4">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Scan Fuel Receipt</p>
              <p className="text-sm text-slate-500 mt-1">
                Capture or upload a receipt to extract IFTA data automatically.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Button className="flex-1 gap-2" onClick={startCamera}>
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </CardContent>
        </Card>
      )}

      {/* CAMERA STATE */}
      {scanState === "camera" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative">
            <video
              ref={videoRef}
              className="w-full aspect-[3/4] object-cover bg-black"
              playsInline
              muted
            />
            {/* Crop guide overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 border-2 border-white/60 rounded-lg" />
              <p className="absolute bottom-16 left-0 right-0 text-center text-white text-sm drop-shadow">
                Align receipt within the frame
              </p>
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
              <Button variant="outline" size="icon" onClick={reset} className="rounded-full bg-white/90">
                <X className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-white border-4 border-blue-500 hover:bg-blue-50"
                onClick={capturePhoto}
              >
                <Camera className="h-6 w-6 text-blue-600" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PREVIEW STATE */}
      {scanState === "preview" && previewUrl && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Receipt preview" className="w-full object-contain max-h-96" />
              <Badge className="absolute top-3 right-3 bg-green-500">Ready to Process</Badge>
            </div>
            <div className="p-4 flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <Button className="flex-1 gap-2" onClick={processReceipt}>
                <Camera className="h-4 w-4" />
                Extract Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PROCESSING STATE */}
      {scanState === "processing" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <div className="text-center">
              <p className="font-semibold text-slate-800">Extracting Receipt Data</p>
              <p className="text-sm text-slate-500 mt-1">
                AI is reading seller info, gallons, and fuel type...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ERROR STATE */}
      {scanState === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <X className="h-8 w-8 text-red-500" />
            <div className="text-center">
              <p className="font-semibold text-red-700">Extraction Failed</p>
              <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
            </div>
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
