import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { OFFICIALS_AS_OF, OFFICIALS_SOURCE_URL } from "@/lib/about/content";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function OfficialsPage() {
  const officials = await prisma.official.findMany({
    where: { published: true },
    orderBy: { displayOrder: "asc" },
  });
  const sections: { title: string; people: typeof officials }[] = [];
  for (const official of officials) {
    const title = official.section ?? official.office ?? "University Officials";
    const current = sections.at(-1);
    if (!current || current.title !== title) {
      sections.push({ title, people: [official] });
    } else {
      current.people.push(official);
    }
  }
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/about", label: "About ParSU" }, { label: "University Officials" }]} />
      <ModuleHeader
        title="University Officials"
        description={`Leadership and administrative officials as of ${OFFICIALS_AS_OF}.`}
      />
      {officials.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-10">
          {sections.map((section) => {
            const president = section.people.find((person) => /SUC President/i.test(person.position));
            const others = president
              ? section.people.filter((person) => person.id !== president.id)
              : section.people;
            return (
              <section key={section.title}>
                <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">{section.title}</h2>
                {president ? (
                  <div className="mt-4">
                    <OfficialCard official={president} featured />
                  </div>
                ) : null}
                {others.length ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {others.map((official) => (
                      <OfficialCard key={official.id} official={official} />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
      <p className="mt-8 text-xs text-muted-foreground">
        Source:{" "}
        <a href={OFFICIALS_SOURCE_URL} className="font-semibold text-navy-800">
          parsu.edu.ph/governance/university-officials
        </a>
        . Reference: The University Officials as of {OFFICIALS_AS_OF}.
      </p>
    </div>
  );
}

function OfficialCard({
  official,
  featured = false,
}: {
  official: {
    id: string;
    name: string;
    position: string;
    email: string | null;
    photoPath: string | null;
  };
  featured?: boolean;
}) {
  return (
    <article className={cn("card p-5 text-center", featured && "mx-auto max-w-md p-8")}>
      {official.photoPath ? (
        // Native img so the same portrait can appear on every concurrent office without lazy-load skip.
        <img
          src={official.photoPath}
          alt={official.name}
          width={featured ? 208 : 160}
          height={featured ? 208 : 160}
          loading="eager"
          decoding="async"
          className={cn(
            "mx-auto rounded-full object-cover ring-1 ring-border",
            featured ? "h-52 w-52" : "h-40 w-40",
          )}
        />
      ) : (
        <div
          className={cn(
            "mx-auto flex items-center justify-center rounded-full bg-muted text-sm font-semibold text-navy-800",
            featured ? "h-52 w-52" : "h-40 w-40",
          )}
        >
          Photo not yet available
        </div>
      )}
      <h3 className={cn("font-semibold tracking-tight text-navy-900", featured ? "mt-5 text-xl" : "mt-4 text-base")}>
        {official.name}
      </h3>
      <p className="mt-1 text-sm text-navy-800">{official.position}</p>
      {official.email ? (
        <a href={`mailto:${official.email.split(",")[0]!.trim()}`} className="mt-2 block text-sm text-muted-foreground">
          {official.email}
        </a>
      ) : null}
    </article>
  );
}
