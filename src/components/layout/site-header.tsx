"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { publicNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const match = publicNavigation.find(
      (item) => item.children && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    );
    setExpanded(match?.href ?? null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/88 shadow-[0_1px_0_rgba(247,185,24,0.85)] backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg sm:gap-3 xl:flex-none xl:shrink-0">
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
            <span className="font-display block text-[13px] font-semibold text-navy-900 sm:whitespace-nowrap sm:text-[15px]">
              Executive Dashboard
            </span>
            <span className="block text-[11px] font-medium text-muted-foreground sm:whitespace-nowrap sm:text-xs">
              Partido State University
            </span>
          </span>
        </Link>
        <nav className="ml-auto hidden min-w-0 items-center gap-0.5 xl:flex" aria-label="Primary">
          {publicNavigation.map((item) => {
            const active = isActivePath(pathname, item.href);
            const linkClass = cn(
              "relative inline-flex min-h-11 items-center gap-1 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-navy-700 transition-colors hover:bg-muted hover:text-navy-900",
              active && "bg-muted text-navy-900 after:absolute after:inset-x-2.5 after:bottom-1 after:h-0.5 after:rounded-full after:bg-gold",
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
                <div className="invisible absolute left-0 top-full z-20 min-w-56 rounded-xl border border-border bg-white py-2 opacity-0 shadow-[0_16px_40px_rgba(7,31,70,0.12)] transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
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
          className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-navy-900 hover:bg-muted xl:ml-2"
          aria-label="Search the dashboard"
        >
          <Search className="h-5 w-5" />
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-navy-900 hover:bg-muted xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle navigation</span>
        </button>
      </div>
      {open ? (
        <div className="xl:hidden">
          <button
            type="button"
            className="fixed inset-0 top-[calc(env(safe-area-inset-top)+3.75rem)] z-40 bg-navy-950/40"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label="Primary"
            className="relative z-50 max-h-[min(80dvh,36rem)] overflow-y-auto overscroll-contain border-t border-border bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            {publicNavigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              if (!item.children) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block min-h-12 rounded-lg px-3 py-3 text-base font-semibold text-navy-900",
                      active && "bg-muted",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }
              const sectionOpen = expanded === item.href;
              return (
                <div key={item.href} className="py-1">
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between rounded-lg px-3 py-3 text-left text-base font-semibold text-navy-900",
                      active && "bg-muted",
                    )}
                    aria-expanded={sectionOpen}
                    onClick={() => setExpanded((current) => (current === item.href ? null : item.href))}
                  >
                    {item.label}
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", sectionOpen && "rotate-180")} />
                  </button>
                  {sectionOpen ? (
                    <div className="pb-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block min-h-11 rounded-lg py-2.5 pl-6 pr-3 text-sm font-medium text-navy-800",
                            isActivePath(pathname, child.href) && "bg-gold-soft text-navy-900",
                          )}
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
