import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DocumentLink } from "@/components/ui/document-link";
import { EmptyState, ModuleHeader } from "@/components/ui/primitives";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function DocumentsPage() {
  const documents = await prisma.documentRecord.findMany({
    where: { published: true, visibility: "PUBLIC" },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Documents" }]} />
      <ModuleHeader
        title="Institutional Documents"
        description="Strategic plans, administrative orders, and other public records."
      />
      <div className="card mb-8 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-navy-900">Administrative Orders</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Issued presidential and administrative orders for 2025 and 2026. Each listing opens the signed PDF.
        </p>
        <DocumentLink
          title="Browse Administrative Orders"
          category="Administrative Orders"
          href="/documents/administrative-orders"
          meta="PDFAO issuances by year"
          className="mt-4"
        />
      </div>
      {documents.length === 0 ? (
        <EmptyState description="Institutional documents are not yet available." />
      ) : (
        <div className="space-y-8">
          {DOCUMENT_CATEGORIES.filter((category) => documents.some((doc) => doc.category === category)).map((category) => (
            <section key={category}>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">{category}</h2>
              <ul className="card divide-y overflow-hidden">
                {documents
                  .filter((doc) => doc.category === category)
                  .map((doc) => (
                    <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <DocumentLink
                        title={doc.title}
                        category={doc.category}
                        href={doc.externalUrl ?? doc.filePath ?? "/documents"}
                        meta={`${doc.version ? `Version ${doc.version} · ` : ""}${formatDate(doc.publishedAt)}`}
                        className="min-w-0 flex-1"
                      />
                      {doc.filePath && doc.externalUrl ? (
                        <a href={doc.filePath} className="text-sm font-semibold text-navy-800" download>
                          Download
                        </a>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
