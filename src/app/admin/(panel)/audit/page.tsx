import { prisma } from "@/lib/db";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: true },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Audit log</h1>
      <div className="card mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">Administrator</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-3 py-2">{log.createdAt.toLocaleString()}</td>
                <td className="px-3 py-2">{log.user?.email ?? "system"}</td>
                <td className="px-3 py-2">{log.action}</td>
                <td className="px-3 py-2">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
