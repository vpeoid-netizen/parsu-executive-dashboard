import Image from "next/image";
import Link from "next/link";
import { UNIVERSITY_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 lg:grid-cols-2 lg:gap-14 lg:p-10">
          <div>
            <Image
              src="/parsu-logo.png"
              alt="Partido State University official seal"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
            <p className="font-display mt-5 max-w-md text-xl font-semibold leading-snug">{UNIVERSITY_NAME}</p>
            <p className="mt-2 text-sm text-white/70">Executive Dashboard</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Contact</h2>
            <p className="mt-4 text-sm leading-6 text-white/80">
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
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-white/55">
          <p>© 2026 Partido State University. All rights reserved.</p>
          <Link href="/admin/login" className="text-white/40 hover:text-gold">
            Administrator access
          </Link>
        </div>
      </div>
    </footer>
  );
}
