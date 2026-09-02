"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { publicNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 rounded-xl sm:gap-3 xl:flex-none xl:shrink-0">
          <Image
            src="/parsu-logo.png"
            alt="Partido State University official seal"
            width={40}
            height={40}
            sizes="40px"
            className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
            priority
          />
          <span className="min-w-0 leading-tight">
            <span className="font-display block text-[13px] font-semibold text-navy-900 sm:whitespace-nowrap sm:text-base">
              Executive Dashboard
            </span>
            <span className="block text-[11px] font-medium text-muted-foreground sm:whitespace-nowrap sm:text-xs">
              Partido State University
            </span>
          </span>
        </Link>
        <nav className="ml-auto hidden min-w-0 items-center gap-0.5 xl:flex" aria-label="Primary">
          {publicNavigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const linkClass = cn(
              "inline-flex min-h-11 items-center gap-1 rounded-xl px-2.5 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-muted hover:text-navy-900",
              active && "bg-muted text-navy-900",
            );
            if (!item.children) {
              return (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              );
            }
            return (
              <div key={item.href} className="group relative">
                <Link href={item.children[0]?.href ?? item.href} className={linkClass}>
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <div className="invisible absolute left-0 top-full z-20 min-w-56 rounded-3xl border border-border bg-white py-2 opacity-0 shadow-[0_10px_24px_rgba(7,31,70,0.12)] transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-2.5 text-sm font-medium text-navy-800 hover:bg-muted"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <Link
          href="/search"
          className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-navy-900 shadow-[0_1px_2px_rgba(7,31,70,0.06)] hover:bg-muted xl:ml-2"
          aria-label="Search the dashboard"
        >
          <Search className="h-5 w-5" />
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-navy-900 shadow-[0_1px_2px_rgba(7,31,70,0.06)] hover:bg-muted xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle navigation</span>
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="max-h-[min(70vh,32rem)] overflow-y-auto border-t border-border bg-white px-4 py-3 xl:hidden">
          {publicNavigation.map((item) => (
            <div key={item.href} className="py-1">
              <Link
                href={item.href}
                className="block rounded-xl px-3 py-3 text-base font-semibold text-navy-900"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block rounded-xl py-2 pl-6 text-sm text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}
