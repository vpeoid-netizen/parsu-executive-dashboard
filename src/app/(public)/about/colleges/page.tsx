import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleHeader } from "@/components/ui/primitives";
import { COLLEGES_DIRECTORY, COLLEGES_INTRO, COLLEGES_SOURCE_URL } from "@/lib/about/colleges";
import { collegeAbbrev } from "@/lib/import/normalize";

export default function CollegesPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/about", label: "About ParSU" }, { label: "Colleges" }]} />
      <ModuleHeader title="Colleges" description={COLLEGES_INTRO} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {COLLEGES_DIRECTORY.map((college) => (
          <article key={college.code} className="card flex h-full flex-col overflow-hidden p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <Image
                src={college.image.src}
                alt={college.image.alt}
                width={88}
                height={88}
                className="h-16 w-16 shrink-0 rounded-2xl bg-muted object-contain p-1 ring-1 ring-border sm:h-20 sm:w-20"
              />
              <div className="min-w-0">
                <p className="section-kicker">{collegeAbbrev(college.code)}</p>
                <h2 className="font-display mt-2 text-lg font-semibold leading-snug tracking-tight text-navy-900">
                  {college.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-navy-800">{college.campus}</p>
              </div>
            </div>
            <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground">{college.body}</p>
            <a href={college.href} className="mt-4 inline-block text-sm font-semibold text-navy-800">
              View on parsu.edu.ph
            </a>
          </article>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Source:{" "}
        <a href={COLLEGES_SOURCE_URL} className="font-semibold text-navy-800">
          parsu.edu.ph/academics/colleges
        </a>
      </p>
    </div>
  );
}
