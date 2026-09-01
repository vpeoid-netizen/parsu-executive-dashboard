import { prisma } from "@/lib/db";

export default async function FacultyAdminPage() {
  const count = await prisma.facultySnapshot.count({ where: { status: "PUBLISHED" } });
  return (
    <div className="card max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Faculty snapshots</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{count} published college snapshots. Use Import to replace this dataset after review.</p>
    </div>
  );
}
