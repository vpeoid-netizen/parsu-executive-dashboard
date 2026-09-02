import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { administrativeOrderLabel, administrativeOrderUrl, searchAdministrativeOrders } from "@/lib/administrative-orders";
import { prisma } from "@/lib/db";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query
    ? await Promise.all([
        prisma.academicProgram.findMany({
          where: { status: "PUBLISHED", name: { contains: query } },
          take: 8,
        }),
        prisma.researchCompletion.findMany({
          where: { status: "PUBLISHED", title: { contains: query } },
          take: 8,
        }),
        prisma.studentAward.findMany({
          where: {
            status: "PUBLISHED",
            OR: [{ recipient: { contains: query } }, { eventName: { contains: query } }],
          },
          take: 8,
        }),
        prisma.documentRecord.findMany({
          where: { published: true, title: { contains: query } },
          take: 8,
        }),
      ])
    : [[], [], [], []];

  const [programs, research, awards, documents] = results;
  const administrativeOrders = query ? searchAdministrativeOrders(query) : [];
  const empty = query && ![...programs, ...research, ...awards, ...documents, ...administrativeOrders].length;

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Search" }]} />
      <ModuleHeader title="Search" description="Search programs, research, awards and documents." />
      <form className="card mb-8 p-5">
        <label className="block text-sm font-medium" htmlFor="q">
          Query
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="q"
            name="q"
            defaultValue={query}
            className="field max-w-xl"
            placeholder="Program, research title, award or document"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </div>
      </form>
      {!query ? (
        <EmptyState title="Enter a search term" description="Search programs, research, awards and documents." />
      ) : empty ? (
        <EmptyState title="No matches" description="Try a different program, campus or document title." />
      ) : (
        <div className="space-y-6">
          <ResultGroup title="Programs" href="/academics/programs" items={programs.map((item) => ({ href: "/academics/programs", label: item.name }))} />
          <ResultGroup title="Research" href="/research/completed" items={research.map((item) => ({ href: "/research/completed", label: item.title }))} />
          <ResultGroup title="Awards" href="/students/awards" items={awards.map((item) => ({ href: "/students/awards", label: `${item.recipient} — ${item.awardRank}` }))} />
          <ResultGroup
            title="Documents"
            href="/documents"
            items={[
              ...administrativeOrders.map((item) => ({
                href: administrativeOrderUrl(item.fileId),
                label: `${administrativeOrderLabel(item)} — ${item.title}`,
              })),
              ...documents.map((item) => ({ href: item.externalUrl ?? "/documents", label: item.title })),
            ]}
          />
        </div>
      )}
    </div>
  );
}

function ResultGroup({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: { href: string; label: string }[];
}) {
  if (!items.length) return null;
  return (
    <section className="card p-5">
      <h2 className="text-lg font-semibold tracking-tight">
        <Link href={href}>{title}</Link>
      </h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="text-sm text-navy-800">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
