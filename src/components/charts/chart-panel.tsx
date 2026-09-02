import Link from "next/link";

export function ChartPanel({
  title,
  period,
  children,
  action,
}: {
  title: string;
  period?: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <section className="card min-w-0 overflow-x-auto p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">{title}</h2>
          {period ? <p className="mt-1 text-sm text-muted-foreground">{period}</p> : null}
        </div>
        {action ? (
          <Link href={action.href} className="shrink-0 text-sm font-semibold text-navy-800">
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
