import { prisma } from "@/lib/db";

export default async function ExtensionAdminPage() {
  const programs = await prisma.extensionProgram.count({ where: { status: "PUBLISHED" } });
  return (
    <div className="card max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Extension</h1>
      <p className="mt-2 text-sm text-muted-foreground">{programs} published BOR-approved programs.</p>
    </div>
  );
}
