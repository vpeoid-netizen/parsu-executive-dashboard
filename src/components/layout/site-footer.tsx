import Image from "next/image";
import Link from "next/link";
import { UNIVERSITY_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-gold bg-navy-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
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
              <p className="mt-1 text-sm text-white/65">Official executive analytics platform</p>
            </div>
          </div>
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">Contact</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50 sm:text-sm">
          <p>© 2026 Partido State University. All rights reserved.</p>
          <Link href="/admin/login" className="text-white/35 hover:text-gold">
            Administrator access
          </Link>
        </div>
      </div>
    </footer>
  );
}
