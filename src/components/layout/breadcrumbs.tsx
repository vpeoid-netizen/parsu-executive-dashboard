import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-muted-foreground sm:mb-6">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        <li>
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-navy-800">
            Dashboard
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {item.href ? (
              <Link href={item.href} className="inline-flex min-h-11 items-center hover:text-navy-800">
                {item.label}
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
