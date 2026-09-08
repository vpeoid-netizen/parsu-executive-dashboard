"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { LoaderCircle, Plus, Save, Search, Trash2 } from "lucide-react";
import type { SaveResult } from "@/lib/admin/editor";
import { cn } from "@/lib/utils";

export type EditorColumn = {
  key: string;
  header: string;
  group?: string;
  type?: "text" | "number" | "select" | "checkbox" | "textarea" | "date" | "readonly";
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  min?: number;
  step?: string;
  width?: string;
  sumFooter?: boolean;
};

export type WorkbookRow = Record<string, string | number | boolean | null>;

type LocalRow = WorkbookRow & { _key: string };

function toLocal(row: WorkbookRow, index: number): LocalRow {
  return {
    ...row,
    _key: String(row.id ?? `tmp-${index}-${row.programName ?? row.name ?? row.title ?? "row"}`),
  };
}

function groupSpans(columns: EditorColumn[]) {
  if (!columns.some((column) => column.group)) return null;
  const spans: { name: string; span: number }[] = [];
  for (const column of columns) {
    const name = column.group ?? "";
    const last = spans.at(-1);
    if (last && last.name === name) last.span += 1;
    else spans.push({ name, span: 1 });
  }
  return spans;
}

export function WorkbookEditor({
  title,
  description,
  excelSheet,
  columns,
  rows,
  saveAction,
  addLabel = "Add row",
  addRowDefaults,
  totalFrom,
}: {
  title: string;
  description: string;
  excelSheet?: string;
  columns: EditorColumn[];
  rows: WorkbookRow[];
  saveAction: (prev: SaveResult | null, formData: FormData) => Promise<SaveResult>;
  addLabel?: string;
  addRowDefaults?: WorkbookRow;
  totalFrom?: string[];
}) {
  const [state, action, pending] = useActionState(saveAction, null);
  const [query, setQuery] = useState("");
  const [dirty, setDirty] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [localRows, setLocalRows] = useState<LocalRow[]>(() => rows.map(toLocal));

  useEffect(() => {
    setLocalRows(rows.map(toLocal));
    setDeletedIds([]);
    setDirty(false);
  }, [rows]);

  const groups = useMemo(() => groupSpans(columns), [columns]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return localRows;
    return localRows.filter((row) =>
      columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(needle)),
    );
  }, [columns, localRows, query]);

  const footers = useMemo(() => {
    const sums: Record<string, number> = {};
    for (const column of columns) {
      if (!column.sumFooter) continue;
      sums[column.key] = localRows.reduce((total, row) => total + (Number(row[column.key]) || 0), 0);
    }
    return sums;
  }, [columns, localRows]);

  function applyRow(row: LocalRow, patch: Partial<WorkbookRow>): LocalRow {
    const next: LocalRow = { ...row, ...(patch as WorkbookRow) };
    if (totalFrom?.length) {
      next.total = totalFrom.reduce((sum, key) => sum + (Number(next[key]) || 0), 0);
    }
    return next;
  }

  function updateCell(key: string, columnKey: string, value: string | number | boolean | null) {
    setDirty(true);
    setLocalRows((current) =>
      current.map((row) => (row._key === key ? applyRow(row, { [columnKey]: value }) : row)),
    );
  }

  function addRow() {
    setDirty(true);
    const blank: LocalRow = {
      id: `tmp-${crypto.randomUUID()}`,
      _key: `tmp-${crypto.randomUUID()}`,
      ...(addRowDefaults ?? {}),
    };
    setLocalRows((current) => [...current, applyRow(blank, {})]);
  }

  function removeRow(row: LocalRow) {
    setDirty(true);
    const id = String(row.id ?? "");
    if (id && !id.startsWith("tmp-")) setDeletedIds((current) => [...current, id]);
    setLocalRows((current) => current.filter((item) => item._key !== row._key));
  }

  const payload = JSON.stringify({
    rows: localRows.map(({ _key, ...row }) => row),
    deletedIds,
  });

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-navy-900">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          {excelSheet ? (
            <p className="mt-1 text-xs text-muted-foreground">Matches workbook sheet: {excelSheet}</p>
          ) : null}
        </div>
        <label className="relative block w-full max-w-xs">
          <span className="sr-only">Search rows</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field pl-9"
            placeholder="Search this table"
          />
        </label>
      </header>

      <form action={action} className="card overflow-hidden">
        <input type="hidden" name="payload" value={payload} />
        <div className="overflow-x-auto">
          <table className="editor-table">
            <thead>
              {groups ? (
                <tr>
                  {groups.map((group, index) => (
                    <th
                      key={`${group.name}-${index}`}
                      colSpan={group.span}
                      className={group.name ? "editor-group" : "editor-group-empty"}
                    >
                      {group.name || "\u00a0"}
                    </th>
                  ))}
                  <th className="editor-group-empty w-14" aria-hidden="true" />
                </tr>
              ) : null}
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={column.width ? { minWidth: column.width } : undefined}>
                    <span>
                      {column.header}
                      {column.required ? <span className="text-gold"> *</span> : null}
                    </span>
                    {column.hint ? <span className="mt-0.5 block text-[11px] font-normal text-white/70">{column.hint}</span> : null}
                  </th>
                ))}
                <th className="w-14">
                  <span className="sr-only">Remove row</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {localRows.length === 0 ? "No rows yet. Add a row to encode this dataset." : "No rows match this search."}
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row._key}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        <EditorCell
                          column={column}
                          row={row}
                          onChange={(value) => updateCell(row._key, column.key, value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        onClick={() => removeRow(row)}
                        className="inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        aria-label={`Remove ${String(row.name ?? row.title ?? row.programName ?? "row")}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {Object.keys(footers).length ? (
              <tfoot>
                <tr>
                  {columns.map((column, index) => (
                    <td key={column.key} className="font-semibold text-navy-900">
                      {column.sumFooter ? footers[column.key].toLocaleString("en-PH") : index === 0 ? "Total" : ""}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={addRow} className="btn btn-ghost w-fit">
            <Plus className="size-4" />
            {addLabel}
          </button>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <p className="text-sm" role="status">
              {pending ? (
                <span className="text-muted-foreground">Saving and publishing…</span>
              ) : state?.ok ? (
                <span className="text-navy-800">{state.message}</span>
              ) : state && !state.ok ? (
                <span className="text-danger">{state.error}</span>
              ) : dirty ? (
                <span className="text-muted-foreground">Unsaved changes will publish to the public dashboard.</span>
              ) : (
                <span className="text-muted-foreground">{localRows.length} row{localRows.length === 1 ? "" : "s"}</span>
              )}
            </p>
            <button disabled={pending} className="btn btn-primary disabled:opacity-60">
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save and publish
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function EditorCell({
  column,
  row,
  onChange,
}: {
  column: EditorColumn;
  row: LocalRow;
  onChange: (value: string | number | boolean | null) => void;
}) {
  const value = row[column.key];
  const label = `${column.header}${column.group ? ` (${column.group})` : ""}`;
  const className = cn("editor-cell", column.type === "textarea" && "min-h-20 py-2");

  if (column.type === "readonly") {
    return <span className="block min-h-11 px-2 py-2 text-sm text-navy-900">{value === null || value === "" ? "—" : String(value)}</span>;
  }

  if (column.type === "checkbox") {
    return (
      <label className="flex min-h-11 items-center justify-center gap-2 px-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4"
          aria-label={label}
        />
      </label>
    );
  }

  if (column.type === "select") {
    return (
      <select
        aria-label={label}
        className={className}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      >
        {(column.options ?? []).map((option) => (
          <option key={`${column.key}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === "textarea") {
    return (
      <textarea
        aria-label={label}
        className={className}
        rows={2}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (column.type === "number") {
    return (
      <input
        aria-label={label}
        className={className}
        type="number"
        inputMode="decimal"
        min={column.min}
        step={column.step ?? "1"}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
      />
    );
  }

  return (
    <input
      aria-label={label}
      className={className}
      type={column.type === "date" ? "date" : "text"}
      value={String(value ?? "")}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
