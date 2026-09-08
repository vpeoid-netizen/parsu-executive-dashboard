export const MANUAL_DATASET_VERSION = "manual";

export type EditorValue = string | number | boolean | null;
export type EditorRow = Record<string, EditorValue>;

export type SaveResult = { ok: true; message: string } | { ok: false; error: string };

export type EditorPayload = {
  rows: EditorRow[];
  deletedIds: string[];
};

export function parseEditorPayload(formData: FormData): EditorPayload | null {
  const raw = String(formData.get("payload") ?? "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EditorPayload;
    if (!Array.isArray(parsed.rows) || !Array.isArray(parsed.deletedIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function realId(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text || text.startsWith("tmp-")) return null;
  return text;
}

export function blankToNull(value: unknown): string | null {
  if (value === null || value === undefined || value === false) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

export function toInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function toFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

export function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

export function toDate(value: unknown): Date | null {
  const text = blankToNull(value);
  if (!text) return null;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateToInput(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}
