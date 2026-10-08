"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ParsuNewsItem } from "@/lib/parsu-news";

const IDLE_MS = 60_000;
const SLIDE_MS = 30_000;

export function NewsScreensaver() {
  const [items, setItems] = useState<ParsuNewsItem[]>([]);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

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

  const dismiss = useCallback(() => setActive(false), []);

  useEffect(() => {
    if (items.length === 0) return;
    let timer: number | undefined;
    const arm = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      timer = window.setTimeout(() => {
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
  }, [active, items.length]);

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
    const rotate = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, SLIDE_MS);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearInterval(rotate);
    };
  }, [active, dismiss, items.length]);

  if (!active || items.length === 0) return null;
  const item = items[index] ?? items[0];
  if (!item) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="ParSU news screensaver"
      className="fixed inset-0 z-[80] cursor-pointer bg-navy-950 text-white outline-none"
      onClick={dismiss}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") dismiss();
      }}
      tabIndex={0}
    >
      {item.image ? (
        <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,31,70,0.35)_0%,rgba(7,31,70,0.18)_38%,rgba(7,31,70,0.88)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-1.5 overflow-hidden bg-white/15">
        <span key={item.href} className="news-slide-progress block h-full w-full origin-left bg-gold" />
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
            {index + 1} / {items.length}
          </p>
        </div>
      </div>
    </div>
  );
}
