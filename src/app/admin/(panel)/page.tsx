import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [versions, issues, jobs, logs] = await Promise.all([
    prisma.datasetVersion.findMany({
      include: { dataset: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.validationIssue.findMany({
      where: { resolved: false, severity: { in: ["WARNING", "ERROR", "CONFLICT"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Data overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Published versions, validation warnings and recent administrator activity.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/admin/import", "Upload dataset"],
          ["/admin/content", "Manage content"],
          ["/admin/documents", "Manage documents"],
          ["/admin/officials", "Manage officials"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="card card-interactive px-4 py-4 text-sm font-medium text-navy-900">
            {label}
          </Link>
        ))}
      </section>
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Published datasets</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Dataset</th>
                <th className="px-3 py-2 text-left">Version</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id} className="border-t">
                  <td className="px-3 py-2">{version.dataset.title}</td>
                  <td className="px-3 py-2">{version.versionNumber}</td>
                  <td className="px-3 py-2">{version.status}</td>
                  <td className="px-3 py-2">{version.publishedAt?.toLocaleString() ?? version.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Validation warnings</h2>
        <ul className="mt-3 space-y-2">
          {issues.length === 0 ? <li className="text-sm text-muted-foreground">No unresolved warnings.</li> : null}
          {issues.map((issue) => (
            <li key={issue.id} className="card border-warning bg-warning-soft p-4 text-sm">
              <strong>{issue.severity}:</strong> {issue.message}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
        <ul className="card mt-3 divide-y text-sm">
          {logs.map((log) => (
            <li key={log.id} className="px-4 py-3">
              {log.createdAt.toLocaleString()} — {log.user?.email ?? "system"} — {log.summary}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
