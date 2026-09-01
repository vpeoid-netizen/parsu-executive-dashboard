import type { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function writeAuditLog(input: {
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
  previousJson?: unknown;
  nextJson?: unknown;
  ipAddress?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      previousJson: input.previousJson ? JSON.stringify(input.previousJson) : null,
      nextJson: input.nextJson ? JSON.stringify(input.nextJson) : null,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
