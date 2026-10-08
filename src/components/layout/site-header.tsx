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
  const home = pathname === "/";

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
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-full px-1 py-1 xl:flex-none">
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
            <span className="font-display block text-[13px] font-semibold text-cream sm:whitespace-nowrap sm:text-[15px]">
              ParSU
            </span>
            <span className="block text-[11px] font-medium text-cream/65 sm:whitespace-nowrap sm:text-xs">
              Executive Dashboard
            </span>
          </span>
        </Link>
        <nav
          className="mx-auto hidden min-w-0 items-center rounded-full border border-white/10 bg-white/6 px-1.5 py-1 backdrop-blur-xl xl:flex"
          aria-label="Primary"
        >
          {publicNavigation.map((item) => {
            const active = isActivePath(pathname, item.href);
            const linkClass = cn(
              "relative inline-flex min-h-10 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold text-cream/80 transition-colors hover:bg-white/8 hover:text-cream",
              active && "bg-gold text-navy-950 hover:bg-gold hover:text-navy-950",
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
                <div className="invisible absolute left-1/2 top-full z-20 mt-2 min-w-56 -translate-x-1/2 rounded-2xl border border-white/10 bg-navy-950 py-2 opacity-0 shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-2.5 text-sm font-medium text-cream/80 hover:bg-white/8 hover:text-cream"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/search"
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-transparent text-cream hover:bg-white/8",
              "h-11 w-11 xl:w-auto xl:px-4",
            )}
            aria-label="Search the dashboard"
          >
            <Search className="h-4 w-4 xl:mr-2" />
            <span className="hidden text-[13px] font-semibold xl:inline">Search</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-cream hover:bg-white/8 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle navigation</span>
          </button>
        </div>
      </div>
      {open ? (
        <div className="xl:hidden">
          <button
            type="button"
            className="fixed inset-0 top-[calc(env(safe-area-inset-top)+4.25rem)] z-40 bg-navy-950/60"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label="Primary"
            className="relative z-50 mx-3 max-h-[min(80dvh,36rem)] overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-navy-950 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            {publicNavigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              if (!item.children) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block min-h-12 rounded-2xl px-3 py-3 text-base font-semibold text-cream",
                      active && "bg-gold text-navy-950",
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
                      "flex min-h-12 w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-base font-semibold text-cream",
                      active && "bg-white/8",
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
                            "block min-h-11 rounded-2xl py-2.5 pl-6 pr-3 text-sm font-medium text-cream/75",
                            isActivePath(pathname, child.href) && "bg-gold text-navy-950",
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
      {!home ? <div className="pointer-events-none absolute inset-0 -z-10 bg-navy-950/92 backdrop-blur-xl" /> : null}
    </header>
  );
}
