import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("page-shell", className)}>{children}</div>;
}

export function Card({
  children,
  className,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return <div className={cn("card", interactive && "card-interactive", className)}>{children}</div>;
}

export function KpiCard({
  title,
  value,
  format = "integer",
  href,
  period,
  note,
  group,
  icon: Icon,
  emphasizeValue = false,
}: {
  title: string;
  value: number | null | undefined;
  format?: string;
  href?: string | null;
  period?: string | null;
  note?: string | null;
  group?: string | null;
  icon?: LucideIcon;
  emphasizeValue?: boolean;
}) {
  const display =
    format === "percent" ? formatPercent(value) : formatNumber(value, 0);
  const inner = (
    <article className="card card-interactive relative flex h-full flex-col overflow-hidden p-5 sm:p-6">
      {Icon ? (
        <Icon
          className="pointer-events-none absolute -bottom-4 -right-3 h-32 w-32 text-navy-900/[0.08]"
          strokeWidth={1.1}
          aria-hidden="true"
        />
      ) : null}
      {group ? <p className="section-kicker relative">{group}</p> : null}
      <h3 className={cn("relative text-sm font-medium text-muted-foreground", group && "mt-3")}>{title}</h3>
      <div className="relative mt-4 flex items-end justify-between gap-4">
        <p
          className={cn(
            "font-display font-bold tabular-nums tracking-tight text-navy-900",
            emphasizeValue ? "text-[clamp(2.75rem,6vw,4.25rem)] leading-none" : "text-3xl",
          )}
        >
          {display}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-navy-900 ring-1 ring-[rgba(247,185,24,0.4)]",
              emphasizeValue ? "h-14 w-14" : "h-16 w-16",
            )}
            aria-hidden="true"
          >
            <Icon className={emphasizeValue ? "h-7 w-7" : "h-8 w-8"} strokeWidth={1.7} />
          </span>
        ) : null}
      </div>
      {period ? <p className="relative mt-2 text-xs leading-5 text-muted-foreground">{period}</p> : null}
      {note ? <p className="relative mt-1 text-xs text-muted-foreground">{note}</p> : null}
      {href ? (
        <span className="relative mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition-colors group-hover:bg-navy-800">
          View details <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
    </article>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="group block h-full rounded-3xl focus-visible:outline-none">
      {inner}
    </Link>
  );
}

export function NavCard({
  href,
  title,
  description,
  accent = "navy",
}: {
  href: string;
  title: string;
  description: string;
  accent?: "navy" | "gold";
}) {
  return (
    <Link href={href} className="card card-interactive group flex h-full flex-col overflow-hidden">
      <div
        className={cn(
          "relative h-24 overflow-hidden",
          accent === "gold"
            ? "bg-[linear-gradient(145deg,#FFF6D6_0%,#F7B918_120%)]"
            : "bg-[linear-gradient(145deg,#E8F0FA_0%,#A8C0DC_100%)]",
        )}
      >
        <span
          className={cn(
            "illust-blob -right-4 -top-6 h-28 w-28",
            accent === "gold" ? "bg-[rgba(247,185,24,0.35)]" : "bg-[rgba(48,78,112,0.2)]",
          )}
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="font-display text-[1.15rem] font-semibold leading-snug text-navy-900">{title}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition-colors group-hover:bg-navy-800">
          Open <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function EmptyState({
  title = "Data not yet available",
  description = "No data is currently available for this reporting period.",
  action,
}: {
  title?: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card border-dashed px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold tracking-tight text-navy-900">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? (
        <Link href={action.href} className="mt-4 inline-block text-sm font-semibold text-navy-800">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "partial";
}) {
  const classes = {
    neutral: "bg-muted text-navy-800",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    partial: "bg-gold-soft text-gold-dark",
  }[tone];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", classes)}>
      {label}
    </span>
  );
}

export function ModuleHeader({
  title,
  description,
  period,
  asOf,
}: {
  title: string;
  description?: string;
  period?: string | null;
  asOf?: string | null;
}) {
  return (
    <header className="mb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900 md:text-3xl">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {(period || asOf) && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-navy-800">
          {period ? (
            <span className="rounded-full bg-white px-3 py-1.5 font-semibold ring-1 ring-border">
              Reporting period: {period}
            </span>
          ) : null}
          {asOf ? (
            <span className="rounded-full bg-white px-3 py-1.5 font-semibold ring-1 ring-border">Data as of: {asOf}</span>
          ) : null}
        </div>
      )}
    </header>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h2 className="font-display text-lg font-bold tracking-tight text-navy-900">{title}</h2>
      {action ? (
        <Link href={action.href} className="text-sm font-semibold text-navy-800">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
