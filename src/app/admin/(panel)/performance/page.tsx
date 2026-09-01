import { prisma } from "@/lib/db";

export default async function PerformanceAdminPage() {
  const count = await prisma.performanceObservation.count({ where: { status: "PUBLISHED" } });
  return (
    <div className="card max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">University performance</h1>
      <p className="mt-2 text-sm text-muted-foreground">{count} published observations. FY 2026 remains partial unless a later full-year file is published.</p>
    </div>
  );
}
