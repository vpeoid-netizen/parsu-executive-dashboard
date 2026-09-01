import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleHeader } from "@/components/ui/primitives";
import { CORE_VALUES, CORE_VALUES_IMAGE, VMGO_SECTIONS, VMGO_SOURCE_URL, VMGO_TITLE } from "@/lib/about/content";

export default function VisionMissionCoreValuesPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/about", label: "About ParSU" }, { label: VMGO_TITLE }]} />
      <ModuleHeader
        title={VMGO_TITLE}
        description="Official vision, mission, and core values of Partido State University."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {VMGO_SECTIONS.map((section) => (
          <article key={section.heading} className="card overflow-hidden">
            <Image
              src={section.image.src}
              alt={section.image.alt}
              width={900}
              height={520}
              className="h-56 w-full object-cover sm:h-64"
            />
            <div className="p-6">
              <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">{section.heading}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </div>
          </article>
        ))}
      </div>
      <article className="card mt-6 overflow-hidden">
        <Image
          src={CORE_VALUES_IMAGE.src}
          alt={CORE_VALUES_IMAGE.alt}
          width={1200}
          height={520}
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">Core Values</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {CORE_VALUES.map((value) => (
              <section key={value.letter} className="rounded-2xl bg-muted/60 p-5">
                <p className="font-display text-3xl font-bold text-gold">{value.letter}</p>
                <h3 className="mt-2 font-semibold text-navy-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.body}</p>
              </section>
            ))}
          </div>
        </div>
      </article>
      <p className="mt-6 text-xs text-muted-foreground">
        Source:{" "}
        <a href={VMGO_SOURCE_URL} className="font-semibold text-navy-800">
          parsu.edu.ph/about/vision-mission-core-values
        </a>
      </p>
    </div>
  );
}
