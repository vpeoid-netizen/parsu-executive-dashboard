import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DocumentLink } from "@/components/ui/document-link";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import {
  ADMINISTRATIVE_ORDER_FOLDER_URL,
  ADMINISTRATIVE_ORDER_YEARS,
  administrativeOrderLabel,
  administrativeOrderUrl,
  administrativeOrdersForYear,
} from "@/lib/administrative-orders";
import { cn } from "@/lib/utils";

const DEFAULT_YEAR = ADMINISTRATIVE_ORDER_YEARS[0];

export default async function AdministrativeOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const requestedYear = Number(params.year);
  const activeYear = ADMINISTRATIVE_ORDER_YEARS.includes(requestedYear as (typeof ADMINISTRATIVE_ORDER_YEARS)[number])
    ? requestedYear
    : DEFAULT_YEAR;
  const orders = administrativeOrdersForYear(activeYear);

  return (
    <div className="page-shell">
      <Breadcrumbs
        items={[
          { href: "/documents", label: "Documents" },
          { label: "Administrative Orders" },
        ]}
      />
      <ModuleHeader
        title="Administrative Orders"
        description="Official Partido State University administrative orders. Each title opens the signed document."
      />
      <div role="tablist" aria-label="Administrative order year" className="mb-5 flex flex-wrap gap-2">
        {ADMINISTRATIVE_ORDER_YEARS.map((year) => {
          const selected = year === activeYear;
          return (
            <Link
              key={year}
              href={year === DEFAULT_YEAR ? "/documents/administrative-orders" : `/documents/administrative-orders?year=${year}`}
              role="tab"
              aria-selected={selected}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
                selected ? "bg-navy-900 text-white" : "bg-white text-navy-800 ring-1 ring-border hover:bg-muted",
              )}
            >
              {year}
            </Link>
          );
        })}
      </div>
      {orders.length === 0 ? (
        <EmptyState description={`No administrative orders are listed for ${activeYear}.`} />
      ) : (
        <ul className="card divide-y overflow-hidden">
          {orders.map((order) => (
            <li key={order.fileId} className="px-4 py-3 sm:px-5">
              <DocumentLink
                title={administrativeOrderLabel(order)}
                category="Administrative Orders"
                href={administrativeOrderUrl(order.fileId)}
                meta={order.title}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Source:{" "}
        <a href={ADMINISTRATIVE_ORDER_FOLDER_URL} className="font-semibold text-navy-800" target="_blank" rel="noreferrer">
          Administrative Order folder
        </a>
        . {activeYear} orders open as individual PDFs.
      </p>
    </div>
  );
}
