"use client";

import { formatShareLabel, sharesThatSumTo100 } from "@/lib/percent-share";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TREND_COLORS = [
  "#071f46",
  "#f7b918",
  "#304e70",
  "#166534",
  "#9a3412",
  "#1d4ed8",
  "#7c3aed",
  "#0f766e",
  "#be185d",
  "#854d0e",
];

export function TrendChart({
  data,
  xKey,
  series,
  height = 320,
  valueFormat = "number",
}: {
  data: Array<Record<string, string | number | null>>;
  xKey: string;
  series: { key: string; label: string; dashed?: boolean; color?: string }[];
  height?: number;
  valueFormat?: "number" | "percent";
}) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Data not yet available</p>;
  }
  const formatValue = (value: number) => {
    if (Number.isNaN(value)) return "Data not yet available";
    if (valueFormat === "percent") return `${value.toFixed(1)}%`;
    return new Intl.NumberFormat("en-PH", { maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
  };
  const formatTick = (value: number) => {
    if (valueFormat === "percent") return `${value}%`;
    return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0, notation: value >= 10000 ? "compact" : "standard" }).format(value);
  };
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d7e0ec" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-28}
            textAnchor="end"
            height={58}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatTick} width={valueFormat === "percent" ? 48 : 56} />
          <Tooltip
            formatter={(value, name) => {
              const numeric = typeof value === "number" ? value : Number(value);
              return [formatValue(numeric), String(name)];
            }}
            labelFormatter={(label, payload) => {
              const fullLabel = payload?.[0]?.payload?.fullLabel;
              return typeof fullLabel === "string" && fullLabel ? fullLabel : String(label);
            }}
          />
          <Legend />
          {series.map((item, index) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color ?? TREND_COLORS[index % TREND_COLORS.length]}
              strokeDasharray={item.dashed ? "6 4" : undefined}
              strokeWidth={item.dashed ? 2 : 2.5}
              connectNulls={false}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonBars({
  data,
  xKey,
  bars,
  horizontal = false,
  categoryWidth,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  bars: { key: string; label: string }[];
  horizontal?: boolean;
  categoryWidth?: number;
}) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Data not yet available</p>;
  }
  const height = horizontal ? Math.max(320, data.length * 36) : 320;
  const yWidth = categoryWidth ?? (horizontal ? 168 : 56);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 16, left: horizontal ? 8 : 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#d7e0ec" />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey={xKey} width={yWidth} tick={{ fontSize: 11 }} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} />
            </>
          )}
          <Tooltip
            labelFormatter={(label, payload) => {
              const fullName = payload?.[0]?.payload?.fullName;
              if (typeof fullName === "string" && fullName && fullName !== label) {
                return `${label} — ${fullName}`;
              }
              return String(label);
            }}
          />
          <Legend />
          {bars.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={["#071f46", "#f7b918", "#304e70"][index % 3]}
              radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SHARE_COLORS = [
  "#071f46",
  "#f7b918",
  "#304e70",
  "#166534",
  "#a47b00",
  "#5c6b82",
  "#10294d",
  "#c45c26",
  "#3d6b99",
  "#8b6914",
  "#1d4a3a",
  "#6b3a4a",
];

export type DonutSlice = { name: string; value: number; fullName?: string };

export function DonutChart({
  data,
  centerLabel,
  hideSliceLabels = false,
}: {
  data: DonutSlice[];
  centerLabel?: { primary: string; secondary?: string };
  hideSliceLabels?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!data.length || total <= 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Data not yet available</p>;
  }
  const shares = sharesThatSumTo100(data.map((item) => item.value));
  const slices = data.map((item, index) => ({
    ...item,
    sharePct: shares[index],
    color: SHARE_COLORS[index % SHARE_COLORS.length],
  }));
  const useHoleLabel = Boolean(centerLabel) || hideSliceLabels;
  const pie = (
    <PieChart>
      <Pie
        data={slices}
        dataKey="value"
        nameKey="name"
        innerRadius={useHoleLabel ? "62%" : "55%"}
        outerRadius={useHoleLabel ? "88%" : "80%"}
        paddingAngle={2}
        label={useHoleLabel ? false : ({ payload }) => formatShareLabel(payload?.sharePct)}
        labelLine={!useHoleLabel}
      >
        {slices.map((item, index) => (
          <Cell key={`${item.name}-${index}`} fill={item.color} />
        ))}
      </Pie>
      <Tooltip
        formatter={(_value, name) => {
          const slice = slices.find((item) => item.name === name);
          const label =
            slice?.fullName && slice.fullName !== slice.name ? `${slice.name} — ${slice.fullName}` : String(name);
          return [`${(slice?.sharePct ?? 0).toFixed(1)}%`, label];
        }}
      />
      {useHoleLabel ? null : (
        <Legend
          formatter={(value) => {
            const slice = slices.find((item) => item.name === value);
            return slice ? `${value} (${slice.sharePct.toFixed(1)}%)` : String(value);
          }}
        />
      )}
    </PieChart>
  );
  if (!useHoleLabel) {
    return (
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {pie}
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <div>
      <div className="relative mx-auto h-64 w-full max-w-sm">
        <ResponsiveContainer width="100%" height="100%">
          {pie}
        </ResponsiveContainer>
        {centerLabel ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-display text-3xl font-bold tabular-nums leading-none text-navy-900">
              {centerLabel.primary}
            </p>
            {centerLabel.secondary ? (
              <p className="mt-1.5 text-sm tabular-nums text-muted-foreground">{centerLabel.secondary}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {slices.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex max-w-full items-start gap-1.5">
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="leading-snug">
              <span className="font-semibold text-navy-800">{item.name}</span>
              <span className="whitespace-nowrap text-muted-foreground">
                {` · ${Number.isInteger(item.value) ? item.value : item.value.toFixed(1)}`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StackedPercentBars({
  data,
  xKey,
  keys,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  keys: string[];
}) {
  const visibleKeys = keys.filter((key) => data.some((row) => Number(row[key] ?? 0) > 0));
  if (!data.length || !visibleKeys.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Data not yet available</p>;
  }
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d7e0ec" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} width={48} />
          <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, String(name)]} />
          <Legend />
          {visibleKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              name={key}
              stackId="share"
              fill={SHARE_COLORS[index % SHARE_COLORS.length]}
              radius={index === visibleKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
