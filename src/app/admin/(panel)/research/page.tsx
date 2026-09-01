import { prisma } from "@/lib/db";

export default async function ResearchAdminPage() {
  const [completed, pubs, util, grants] = await Promise.all([
    prisma.researchCompletion.count({ where: { status: "PUBLISHED" } }),
    prisma.researchPublication.count({ where: { status: "PUBLISHED" } }),
    prisma.researchUtilization.count({ where: { status: "PUBLISHED" } }),
    prisma.researchGrant.count({ where: { status: "PUBLISHED" } }),
  ]);
  return (
    <div className="card max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Research datasets</h1>
      <ul className="mt-4 space-y-2 text-sm">
        <li>Completed: {completed}</li>
        <li>Publications: {pubs}</li>
        <li>Utilization: {util}</li>
        <li>Grants: {grants}</li>
      </ul>
    </div>
  );
}
