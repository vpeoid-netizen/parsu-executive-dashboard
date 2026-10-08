"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import type { ComparisonBars, DonutChart, StackedPercentBars, TrendChart } from "./charts";

type ChartsModule = typeof import("./charts");

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return narrow;
}

function ChartPlaceholder({ height }: { height: number }) {
  return <div className="animate-pulse rounded-xl bg-muted" style={{ height }} aria-hidden="true" />;
}

function useLazyChart<K extends keyof ChartsModule>(name: K) {
  const ref = useRef<HTMLDivElement>(null);
  const [Chart, setChart] = useState<ChartsModule[K] | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || Chart) return;
    let cancelled = false;
    const load = () => {
      void import("./charts").then((mod) => {
        if (!cancelled) setChart(() => mod[name]);
      });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          load();
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [Chart, name]);

  return { ref, Chart };
}

export function LazyTrendChart(props: ComponentProps<typeof TrendChart>) {
  const { ref, Chart } = useLazyChart("TrendChart");
  const narrow = useIsNarrow();
  const height = narrow ? Math.min(props.height ?? 320, 220) : (props.height ?? 320);
  return <div ref={ref}>{Chart ? <Chart {...props} height={height} /> : <ChartPlaceholder height={height} />}</div>;
}

export function LazyDonutChart(props: ComponentProps<typeof DonutChart>) {
  const { ref, Chart } = useLazyChart("DonutChart");
  const narrow = useIsNarrow();
  const compact = props.compact || narrow;
  return (
    <div ref={ref} className="h-full">
      {Chart ? <Chart {...props} compact={compact} /> : <ChartPlaceholder height={compact ? 208 : 288} />}
    </div>
  );
}

export function LazyComparisonBars(props: ComponentProps<typeof ComparisonBars>) {
  const { ref, Chart } = useLazyChart("ComparisonBars");
  const height = props.horizontal ? Math.max(320, props.data.length * 36) : 320;
  return <div ref={ref}>{Chart ? <Chart {...props} /> : <ChartPlaceholder height={height} />}</div>;
}

export function LazyStackedPercentBars(props: ComponentProps<typeof StackedPercentBars>) {
  const { ref, Chart } = useLazyChart("StackedPercentBars");
  return <div ref={ref}>{Chart ? <Chart {...props} /> : <ChartPlaceholder height={280} />}</div>;
}
