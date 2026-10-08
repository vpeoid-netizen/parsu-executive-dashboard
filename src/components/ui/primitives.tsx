import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn, normalizeParSuSpelling } from "@/lib/utils";

function ParSuText({ text }: { text: string }) {
  const normalized = normalizeParSuSpelling(text);
  return normalized.split(/(ParSU)/g).map((part, index) =>
    part === "ParSU" ? (
      <span key={index} className="normal-case">
        ParSU
      </span>
    ) : (
      part
    ),
  );
}

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
    <article className="card card-interactive relative flex h-full flex-col overflow-hidden border-l-[3px] border-l-gold p-4 sm:p-6">
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          {group ? (
            <p className="section-kicker">
              <ParSuText text={group} />
            </p>
          ) : null}
          <h3 className={cn("text-sm font-medium leading-5 text-muted-foreground", group && "mt-2")}>{title}</h3>
        </div>
        {Icon ? (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-navy-900"
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-5 font-display font-semibold tabular-nums tracking-tight text-navy-900",
          emphasizeValue ? "text-[clamp(1.75rem,6vw,2.75rem)] leading-none" : "text-[1.75rem] leading-none sm:text-3xl",
        )}
      >
        {display}
      </p>
      {period ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{period}</p> : null}
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
      {href ? (
        <span className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-navy-800 transition-colors group-hover:text-navy-950">
          View details <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
    </article>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="group block h-full rounded-[var(--radius-card)] focus-visible:outline-none">
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
      <div className={cn("h-1.5", accent === "gold" ? "bg-gold" : "bg-navy-900")} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="font-display text-[1.1rem] font-semibold leading-snug text-navy-900">{title}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-navy-800 transition-colors group-hover:text-navy-950">
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
      <h1 className="font-display text-[1.65rem] font-bold tracking-tight text-navy-900 sm:text-2xl md:text-[2rem]">{title}</h1>
      <span className="accent-rule mt-3" aria-hidden="true" />
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-navy-900">{title}</h2>
        <span className="accent-rule mt-2" aria-hidden="true" />
      </div>
      {action ? (
        <Link href={action.href} className="text-sm font-semibold text-navy-800">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
