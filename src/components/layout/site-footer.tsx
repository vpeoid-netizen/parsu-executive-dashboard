import Image from "next/image";
import Link from "next/link";
import { UNIVERSITY_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy-950 text-cream">
      <div className="mx-auto max-w-7xl px-4 py-10 pb-[max(6.5rem,calc(2.5rem+env(safe-area-inset-bottom)))] sm:px-6 sm:py-12 sm:pb-12 lg:px-8 lg:py-14">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
          <div className="flex gap-4">
            <Image
              src="/parsu-logo.png"
              alt="Partido State University official seal"
              width={52}
              height={52}
              sizes="52px"
              className="h-[52px] w-[52px] object-contain"
            />
            <div>
              <p className="font-display max-w-md text-lg font-semibold leading-snug">{UNIVERSITY_NAME}</p>
              <p className="mt-1 text-sm text-cream/65">Official executive analytics platform</p>
            </div>
          </div>
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">Contact</h2>
            <p className="mt-3 text-sm leading-6 text-cream/80">
              Office of the Vice President for Executive Operations
              <br />
              <a href="mailto:vpeoid@parsu.edu.ph" className="text-gold hover:underline">
                vpeoid@parsu.edu.ph
              </a>
              <br />
              Goa, Camarines Sur
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-cream/50 sm:text-sm">
          <p>© 2026 Partido State University. All rights reserved.</p>
          <Link href="/admin/login" className="rounded-full border border-white/15 px-3 py-1.5 text-cream/45 hover:border-gold hover:text-gold">
            Administrator access
          </Link>
        </div>
      </div>
    </footer>
  );
}
