"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { newsScreensaverBatch, nextNewsScreensaverBatchStart, type ParsuNewsItem } from "@/lib/parsu-news";

const IDLE_MS = 60_000;
const SLIDE_MS = 30_000;
const VIDEO_SRC = "/video/welcome-banner-kiosk.mp4";

export function NewsScreensaver() {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<ParsuNewsItem[]>([]);
  const [active, setActive] = useState(false);
  const [landingHold, setLandingHold] = useState(false);
  const [phase, setPhase] = useState<"news" | "video">("news");
  const [index, setIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const batchStartRef = useRef(0);
  const completingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/public/parsu-news")
      .then((response) => response.json() as Promise<{ items?: ParsuNewsItem[] }>)
      .then((payload) => {
        if (!cancelled) setItems(Array.isArray(payload.items) ? payload.items : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const returnToLanding = useCallback(
    (advanceBatch: boolean) => {
      if (advanceBatch) {
        if (completingRef.current) return;
        completingRef.current = true;
        batchStartRef.current = nextNewsScreensaverBatchStart(batchStartRef.current, items.length);
      }
      setPhase("news");
      setIndex(0);
      setActive(false);
      setLandingHold(advanceBatch);
      if (pathname !== "/") router.push("/");
      window.scrollTo(0, 0);
    },
    [items.length, pathname, router],
  );

  const dismiss = useCallback(() => returnToLanding(false), [returnToLanding]);
  const finishBatch = useCallback(() => returnToLanding(true), [returnToLanding]);

  useEffect(() => {
    if (items.length === 0 || landingHold) return;
    let timer: number | undefined;
    const arm = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      timer = window.setTimeout(() => {
        completingRef.current = false;
        setPhase("news");
        setIndex(0);
        setActive(true);
      }, IDLE_MS);
    };
    const onActivity = () => {
      if (!active) arm();
    };
    if (!active) arm();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("pointermove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("wheel", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    document.addEventListener("visibilitychange", onActivity);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("wheel", onActivity);
      window.removeEventListener("scroll", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
    };
  }, [active, items.length, landingHold]);

  useEffect(() => {
    if (!landingHold) return;
    const timer = window.setTimeout(() => {
      completingRef.current = false;
      setLandingHold(false);
      setPhase("news");
      setIndex(0);
      setActive(true);
    }, SLIDE_MS);
    const cancelHold = () => {
      window.clearTimeout(timer);
      setLandingHold(false);
    };
    window.addEventListener("pointerdown", cancelHold);
    window.addEventListener("keydown", cancelHold);
    window.addEventListener("wheel", cancelHold, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", cancelHold);
      window.removeEventListener("keydown", cancelHold);
      window.removeEventListener("wheel", cancelHold);
    };
  }, [landingHold]);

  const batch = newsScreensaverBatch(items, batchStartRef.current);
  const item = batch[index] ?? batch[0];

  useEffect(() => {
    if (!active || items.length === 0) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    overlayRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [active, dismiss, items.length]);

  useEffect(() => {
    if (!active || phase !== "news" || batch.length === 0) return;
    const timer = window.setTimeout(() => {
      if (index + 1 < batch.length) setIndex(index + 1);
      else setPhase("video");
    }, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, batch.length, index, phase]);

  useEffect(() => {
    if (!active || phase !== "video") return;
    const video = videoRef.current;
    if (!video) {
      finishBatch();
      return;
    }
    video.muted = true;
    video.volume = 0;
    video.currentTime = 0;
    void video.play().catch(() => finishBatch());
  }, [active, finishBatch, phase]);

  if (!active || items.length === 0) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={phase === "video" ? "ParSU welcome banner" : "ParSU news screensaver"}
      className="fixed inset-0 z-[80] cursor-pointer bg-navy-950 text-white outline-none"
      onClick={dismiss}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") dismiss();
      }}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        preload="auto"
        playsInline
        onEnded={() => {
          if (phase === "video") finishBatch();
        }}
        className={phase === "video" ? "absolute inset-0 h-full w-full object-cover" : "hidden"}
      />
      {phase === "news" && item ? (
        <>
          {item.image ? (
            <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,31,70,0.35)_0%,rgba(7,31,70,0.18)_38%,rgba(7,31,70,0.88)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-1.5 overflow-hidden bg-white/15">
            <span key={`${batchStartRef.current}-${item.href}`} className="news-slide-progress block h-full w-full origin-left bg-gold" />
          </div>
          <div className="relative flex h-full flex-col justify-between px-[max(1.25rem,env(safe-area-inset-left))] py-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3">
              <Image src="/parsu-logo.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">ParSU News</p>
                <p className="text-sm text-white/75">Click to return to the dashboard</p>
              </div>
            </div>
            <div className="max-w-4xl">
              {item.publishedLabel ? (
                <p className="text-sm font-semibold text-gold">{item.publishedLabel}</p>
              ) : null}
              <h2 className="font-display mt-2 text-[clamp(1.8rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-tight">
                {item.title}
              </h2>
              {item.excerpt ? <p className="mt-4 max-w-3xl text-base leading-7 text-white/85 sm:text-lg">{item.excerpt}</p> : null}
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                {batchStartRef.current + index + 1} / {items.length}
              </p>
            </div>
          </div>
        </>
      ) : null}
      {phase === "video" ? (
        <p className="sr-only">
          Welcome banner. Click or press Escape to return to the Executive Dashboard.
        </p>
      ) : null}
    </div>
  );
}
