import { prisma } from "@/lib/db";

export default async function StaffAdminPage() {
  const count = await prisma.staffSnapshot.count({ where: { status: "PUBLISHED" } });
  return (
    <div className="card max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Non-teaching personnel</h1>
      <p className="mt-2 text-sm text-muted-foreground">{count} published office snapshots. Upload a revised worksheet to create a new dataset version.</p>
    </div>
  );
}
