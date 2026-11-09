"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ variant }: { variant: "side" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className="flex gap-2 overflow-x-auto overscroll-x-contain px-3 pb-3" aria-label="Administration">
        {adminNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn(
              "btn min-h-11 shrink-0 whitespace-nowrap px-3 text-xs",
              isActive(pathname, item.href) ? "btn-primary" : "btn-ghost",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="mt-6 space-y-0.5" aria-label="Administration">
      {adminNavigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={cn(
            "block min-h-11 rounded-xl px-3 py-2 text-sm",
            isActive(pathname, item.href) ? "bg-navy-900 font-semibold text-white" : "text-navy-800 hover:bg-muted",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
