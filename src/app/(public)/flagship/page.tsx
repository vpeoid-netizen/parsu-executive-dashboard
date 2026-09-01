import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";

export default async function FlagshipPage() {
  const programs = await prisma.flagshipProgram.findMany({
    where: { published: true },
    orderBy: { displayOrder: "asc" },
  });
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Flagship Programs" }]} />
      <ModuleHeader
        title="Flagship Programs"
        description="CMS-managed institutional flagship programs, including optional banners, KPI highlights and documents."
      />
      {programs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {programs.map((program) => (
            <article key={program.id} className="card overflow-hidden">
              {program.bannerPath ? (
                <Image src={program.bannerPath} alt="" width={1200} height={320} className="h-48 w-full object-cover" />
              ) : null}
              <div className="p-5">
                <h2 className="text-lg font-semibold tracking-tight">{program.title}</h2>
                <p className="mt-2 text-muted-foreground">{program.shortDescription ?? program.fullDescription}</p>
                <p className="mt-3 text-sm">{program.office} {program.programLead ? `· ${program.programLead}` : ""}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
