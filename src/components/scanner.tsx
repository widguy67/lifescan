import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, ImagePlus, X, Loader2, ScanLine, Zap, Crown, Infinity as InfinityIcon } from "lucide-react";
import { identify } from "@/lib/identify.functions";
import { fileToScaledDataUrl, scaleDataUrl } from "@/lib/image";
import { addScan } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { AdOverlay } from "@/components/ad-overlay";
import { PaywallDialog } from "@/components/paywall-dialog";
import { useQuota } from "@/hooks/use-quota";
import { canScan, grantBonusScan, recordScan, isPremium } from "@/lib/quota";
import type { ScanRecord } from "@/lib/types";

type Mode = "idle" | "camera" | "analyzing";

const STEPS = ["Reading the image…", "Matching against millions of species…", "Compiling expert details…"];

export function Scanner() {
  const navigate = useNavigate();
  const runIdentify = useServerFn(identify);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [step, setStep] = useState(0);
  const quota = useQuota();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingRecord, setPendingRecord] = useState<ScanRecord | null>(null);
  const [ad, setAd] = useState<null | "interstitial" | "rewarded">(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "analyzing") return;
    setStep(0);
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1600);
    return () => clearInterval(t);
  }, [mode]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setMode("camera");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      toast.error("Camera unavailable. Try importing a photo instead.");
      fileRef.current?.click();
    }
  }

  async function captureFromCamera() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    const scaled = await scaleDataUrl(dataUrl);
    startScan(scaled);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToScaledDataUrl(file);
      startScan(dataUrl);
    } catch {
      toast.error("Could not read that image.");
    }
  }

  /** Gate every scan through the daily quota / paywall before analyzing. */
  function startScan(image: string) {
    if (!isPremium() && !canScan()) {
      setPendingImage(image);
      setPaywallOpen(true);
      return;
    }
    analyze(image);
  }

  async function analyze(image: string) {
    setMode("analyzing");
    try {
      const result = await runIdentify({ data: { image } });
      const record = addScan(result, image);
      if (isPremium()) {
        navigate({ to: "/scan/$id", params: { id: record.id } });
        return;
      }
      // Free users: count the scan and show an ad before revealing the result.
      recordScan();
      setPendingRecord(record);
      setAd("interstitial");
      setMode("idle");
    } catch (err) {
      setMode("idle");
      toast.error(err instanceof Error ? err.message : "Identification failed. Please try again.");
    }
  }

  function handleWatchRewardedAd() {
    setPaywallOpen(false);
    setAd("rewarded");
  }

  function onAdComplete() {
    const variant = ad;
    setAd(null);
    if (variant === "interstitial") {
      const record = pendingRecord;
      setPendingRecord(null);
      if (record) navigate({ to: "/scan/$id", params: { id: record.id } });
    } else if (variant === "rewarded") {
      grantBonusScan();
      const image = pendingImage;
      setPendingImage(null);
      if (image) analyze(image);
    }
  }


  if (mode === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-elegant">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
          <Loader2 className="h-10 w-10 animate-spin text-primary-foreground" />
        </div>
        <div>
          <p className="font-display text-lg font-bold">Identifying…</p>
          <p className="mt-1 text-sm text-muted-foreground transition-all">{STEPS[step]}</p>
        </div>
      </div>
    );
  }

  if (mode === "camera") {
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-black shadow-elegant">
        <div className="relative aspect-[3/4] w-full sm:aspect-video">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          {/* Scan frame overlay */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-3/5 w-4/5 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border-2 border-white/70">
              <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-primary/60 to-transparent animate-scanline" />
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              setMode("idle");
            }}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
            aria-label="Close camera"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-6">
            <button
              onClick={captureFromCamera}
              aria-label="Capture"
              className="flex items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur transition-transform active:scale-95"
              style={{ height: 72, width: 72 }}
            >
              <span className="h-14 w-14 rounded-full bg-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-surface p-1 shadow-elegant">
        <div className="rounded-[1.4rem] bg-card p-6 sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <ScanLine className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-center font-display text-xl font-bold sm:text-2xl">Point. Scan. Discover.</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
            Identify plants, animals, fish, mushrooms, food, minerals and more in seconds with high-accuracy AI.
          </p>
          <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            <Button variant="hero" size="xl" className="flex-1" onClick={startCamera}>
              <Camera className="h-5 w-5" />
              Scan with camera
            </Button>
            <Button variant="outline" size="xl" className="flex-1" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-5 w-5" />
              Import photo
            </Button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Instant results · 14+ categories · Confidence scoring
          </p>

          <div className="mx-auto mt-5 flex max-w-md items-center justify-center">
            {quota.premium ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-secondary/40 px-3 py-1 text-xs font-medium text-primary">
                <InfinityIcon className="h-3.5 w-3.5" />
                Premium · unlimited scans
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                {quota.remaining > 0 ? (
                  <>
                    {quota.remaining} free {quota.remaining === 1 ? "scan" : "scans"} left today ·{" "}
                  </>
                ) : (
                  <>No free scans left today · </>
                )}
                <Link to="/premium" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <Crown className="h-3 w-3" />
                  Go Premium
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>

      {ad && <AdOverlay variant={ad} onComplete={onAdComplete} />}
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        onWatchAd={handleWatchRewardedAd}
      />
    </div>
  );
}
