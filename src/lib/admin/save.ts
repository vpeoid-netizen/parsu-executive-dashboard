import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";
import { rebuildMetrics } from "@/lib/import/persist";
import { parseEditorPayload, realId, type EditorPayload, type EditorRow, type SaveResult } from "@/lib/admin/editor";

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function revalidatePublic(paths: string[]) {
  revalidateTag("public-data", "max");
  revalidatePath("/", "layout");
  for (const path of paths) {
    revalidatePath(path);
  }
}

export function requirePayload(formData: FormData): EditorPayload | SaveResult {
  const payload = parseEditorPayload(formData);
  if (!payload) return { ok: false, error: "The editor could not read the submitted rows. Try again." };
  return payload;
}

export async function applyDeletedIds(
  deletedIds: string[],
  archive: (id: string) => Promise<unknown>,
) {
  for (const id of deletedIds) {
    const recordId = realId(id);
    if (!recordId) continue;
    await archive(recordId);
  }
}

export async function forSavedRows(
  rows: EditorRow[],
  skip: (row: EditorRow) => boolean,
  save: (row: EditorRow, id: string | null) => Promise<void>,
) {
  for (const row of rows) {
    if (skip(row)) continue;
    await save(row, realId(row.id));
  }
}

export async function finishDatasetSave(input: {
  adminId: string;
  entityType: string;
  summary: string;
  paths: string[];
  rebuildKpis?: boolean;
}): Promise<SaveResult> {
  if (input.rebuildKpis) {
    await rebuildMetrics("PUBLISHED");
  }
  await writeAuditLog({
    userId: input.adminId,
    action: "UPDATE",
    entityType: input.entityType,
    summary: input.summary,
  });
  await revalidatePublic(input.paths);
  return { ok: true, message: input.summary };
}
