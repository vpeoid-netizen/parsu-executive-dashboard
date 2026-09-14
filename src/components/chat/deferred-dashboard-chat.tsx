"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DashboardChat = dynamic(
  () => import("./dashboard-chat").then((mod) => ({ default: mod.DashboardChat })),
  { ssr: false },
);

export function DeferredDashboardChat() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(enable, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(enable, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <DashboardChat />;
}
