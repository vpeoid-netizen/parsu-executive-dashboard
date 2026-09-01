import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MarkdownBody } from "@/components/ui/markdown-body";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { HISTORY_IMAGE, HISTORY_SOURCE_URL } from "@/lib/about/content";
import { prisma } from "@/lib/db";

export default async function HistoryPage() {
  const page = await prisma.institutionalPage.findUnique({ where: { slug: "history" } });
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/about", label: "About ParSU" }, { label: "History" }]} />
      <ModuleHeader title="History" />
      {page?.published && page.body.trim() ? (
        <article className="card overflow-hidden p-6 md:p-8">
          <figure className="mb-6">
            <Image
              src={HISTORY_IMAGE.src}
              alt={HISTORY_IMAGE.alt}
              width={1200}
              height={675}
              className="h-auto w-full rounded-2xl object-cover"
              priority
            />
            <figcaption className="mt-2 text-sm text-muted-foreground">{HISTORY_IMAGE.caption}</figcaption>
          </figure>
          <MarkdownBody content={page.body} />
          <p className="mt-6 text-xs text-muted-foreground">
            Source:{" "}
            <a href={HISTORY_SOURCE_URL} className="font-semibold text-navy-800">
              parsu.edu.ph/about/history
            </a>
          </p>
        </article>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
