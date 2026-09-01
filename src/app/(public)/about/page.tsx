import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleHeader } from "@/components/ui/primitives";
import { HISTORY_IMAGE, VMGO_TITLE } from "@/lib/about/content";
import { prisma } from "@/lib/db";

export default async function AboutPage() {
  const [history, vmgo, officials] = await Promise.all([
    prisma.institutionalPage.findUnique({ where: { slug: "history" } }),
    prisma.institutionalPage.findUnique({ where: { slug: "vision-mission-core-values" } }),
    prisma.official.findMany({ where: { published: true }, orderBy: { displayOrder: "asc" }, take: 5 }),
  ]);
  const excerpt = history?.body
    ?.split(/\n\n+/)
    .filter(Boolean)
    .slice(0, 2)
    .join("\n\n");

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "About ParSU" }]} />
      <ModuleHeader title="About Partido State University" />
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="card overflow-hidden lg:col-span-2">
          <Image
            src={HISTORY_IMAGE.src}
            alt={HISTORY_IMAGE.alt}
            width={1200}
            height={520}
            className="h-56 w-full object-cover sm:h-64"
          />
          <div className="p-6">
            <h2 className="text-lg font-semibold tracking-tight">History</h2>
            {excerpt ? (
              <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                {excerpt.split("\n\n").map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Data not yet available</p>
            )}
            <Link href="/about/history" className="mt-4 inline-block text-sm font-semibold text-navy-800">
              Read the full history
            </Link>
          </div>
        </article>
        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-lg font-semibold tracking-tight">{VMGO_TITLE}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {vmgo?.published ? "Vision, mission, and core values." : "Data not yet available"}
            </p>
            <Link href="/about/vision-mission-core-values" className="mt-3 inline-block text-sm font-semibold text-navy-800">
              View vision, mission and core values
            </Link>
          </div>
          <div className="card p-5">
            <h2 className="text-lg font-semibold tracking-tight">Campuses</h2>
            <p className="mt-2 text-sm text-muted-foreground">Seven campuses across the Partido district.</p>
            <Link href="/about/campuses" className="mt-3 inline-block text-sm font-semibold text-navy-800">
              View campuses
            </Link>
          </div>
          <div className="card p-5">
            <h2 className="text-lg font-semibold tracking-tight">Colleges</h2>
            <p className="mt-2 text-sm text-muted-foreground">Eleven colleges across the university system.</p>
            <Link href="/about/colleges" className="mt-3 inline-block text-sm font-semibold text-navy-800">
              View colleges
            </Link>
          </div>
          <div className="card p-5">
            <h2 className="text-lg font-semibold tracking-tight">University Officials</h2>
            {officials[0]?.photoPath ? (
              <Image
                src={officials[0].photoPath}
                alt={officials[0].name}
                width={160}
                height={160}
                className="mt-3 h-20 w-20 rounded-full object-cover"
              />
            ) : null}
            <p className="mt-2 text-sm text-muted-foreground">
              {officials.length ? `${officials[0]?.name}, ${officials[0]?.position}` : "Data not yet available"}
            </p>
            <Link href="/about/officials" className="mt-3 inline-block text-sm font-semibold text-navy-800">
              View university officials
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
