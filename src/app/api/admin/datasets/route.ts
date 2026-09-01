import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminFromToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { rebuildMetrics } from "@/lib/import/persist";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const admin = await getAdminFromToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const versions = await prisma.datasetVersion.findMany({
    include: { dataset: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ versions });
}

export async function PATCH(request: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const admin = await getAdminFromToken(token);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const id = String(body.id ?? "");
  const status = body.status as "DRAFT" | "VALIDATED" | "PUBLISHED" | "ARCHIVED";
  if (!id || !status) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const version = await prisma.datasetVersion.update({ where: { id }, data: { status, publishedAt: status === "PUBLISHED" ? new Date() : undefined } });
  if (status === "PUBLISHED") await rebuildMetrics("PUBLISHED");
  await writeAuditLog({
    userId: admin.id,
    action: status === "PUBLISHED" ? "PUBLISH" : "UPDATE",
    entityType: "DatasetVersion",
    entityId: id,
    summary: `Set dataset version status to ${status}`,
  });
  return NextResponse.json({ version });
}
