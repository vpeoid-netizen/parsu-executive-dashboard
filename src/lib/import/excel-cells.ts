import ExcelJS from "exceljs";
import { compactText } from "@/lib/utils";

export function cellValue(cell: ExcelJS.Cell): unknown {
  const source = cell.master && cell.master !== cell ? cell.master : cell;
  const value = source.value;
  if (value && typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("result" in value) {
      return value.result;
    }
    if (value instanceof Date) return value;
  }
  return value;
}

export function cellText(ws: ExcelJS.Worksheet, row: number, col: number): string | null {
  return compactText(cellValue(ws.getCell(row, col)));
}

export function cellNumber(ws: ExcelJS.Worksheet, row: number, col: number): number | null {
  const value = cellValue(ws.getCell(row, col));
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const text = String(value).replace(/,/g, "").trim();
  if (!text || isNoneMarker(text)) return null;
  const numeric = Number(text);
  return Number.isNaN(numeric) ? null : numeric;
}

/** Excel "-" / blank counts mean none. Used for non-teaching personnel. */
export function cellCountZero(ws: ExcelJS.Worksheet, row: number, col: number): number {
  const value = cellNumber(ws, row, col);
  return value ?? 0;
}

export function isNoneMarker(value: string | null | undefined): boolean {
  if (!value) return false;
  const text = value.replace(/\s+/g, "").toLowerCase();
  return text === "-" || text === "–" || text === "—" || text === "n/a" || text === "none";
}

export function cellDate(ws: ExcelJS.Worksheet, row: number, col: number): Date | null {
  const value = cellValue(ws.getCell(row, col));
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = compactText(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function parseLooseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const text = raw.replace(/\u2013|\u2014/g, "-").trim();
  const direct = Date.parse(text);
  if (!Number.isNaN(direct)) return new Date(direct);
  const monthYear = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const parsed = Date.parse(`${monthYear[1]} 1, ${monthYear[2]}`);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }
  return null;
}

export function parseDateRange(raw: string | null): { start: Date | null; end: Date | null } {
  if (!raw) return { start: null, end: null };
  const normalized = raw.replace(/\u2013|\u2014/g, "-").replace(/\s+/g, " ").trim();
  const parts = normalized.split(/\s+to\s+|\s+-\s+|-/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const start = parseLooseDate(parts.slice(0, Math.ceil(parts.length / 2)).join(" "));
    const end = parseLooseDate(parts.slice(Math.ceil(parts.length / 2)).join(" "));
    if (start || end) return { start, end };
  }
  const simple = normalized.split(/\s+to\s+/i);
  if (simple.length === 2) {
    return { start: parseLooseDate(simple[0]), end: parseLooseDate(simple[1]) };
  }
  return { start: parseLooseDate(normalized), end: null };
}

export function isCampusHeader(value: string | null): boolean {
  if (!value) return false;
  return /campus$/i.test(value.trim());
}

export function isTotalRow(value: string | null): boolean {
  if (!value) return false;
  return /^(total|grand total)$/i.test(value.trim());
}
