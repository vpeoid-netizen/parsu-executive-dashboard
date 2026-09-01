import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleHeader } from "@/components/ui/primitives";
import { CAMPUSES_DIRECTORY, CAMPUSES_INTRO, CAMPUSES_SOURCE_URL } from "@/lib/about/campuses";

export default function CampusesPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/about", label: "About ParSU" }, { label: "Campuses" }]} />
      <ModuleHeader title="Campuses" description={CAMPUSES_INTRO} />
      <div className="grid gap-6 md:grid-cols-2">
        {CAMPUSES_DIRECTORY.map((campus) => (
          <article key={campus.slug} className="card overflow-hidden">
            <Image
              src={campus.image.src}
              alt={campus.image.alt}
              width={1200}
              height={750}
              className="h-52 w-full object-cover sm:h-60"
            />
            <div className="p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">{campus.name}</h2>
              <p className="mt-1 text-sm font-medium text-navy-800">{campus.town}</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{campus.body}</p>
              <p className="mt-3 text-xs text-muted-foreground">{campus.address}</p>
              <ul className="mt-4 space-y-1 text-sm text-navy-800">
                {campus.colleges.map((college) => (
                  <li key={college}>{college}</li>
                ))}
              </ul>
              <a href={campus.href} className="mt-4 inline-block text-sm font-semibold text-navy-800">
                View on parsu.edu.ph
              </a>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Source:{" "}
        <a href={CAMPUSES_SOURCE_URL} className="font-semibold text-navy-800">
          parsu.edu.ph/academics/campuses
        </a>
      </p>
    </div>
  );
}
