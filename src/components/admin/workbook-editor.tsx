"use client";

import { useActionState, useMemo, useState, useSyncExternalStore } from "react";
import { LayoutGrid, LoaderCircle, Plus, Save, Search, Table2, Trash2 } from "lucide-react";
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
type EditorView = "cards" | "table";

const VIEW_STORAGE_KEY = "parsu-admin-editor-view";
const TITLE_KEYS = ["name", "title", "programName", "institution", "organization", "office", "programPap", "recipient"];
const viewListeners = new Set<() => void>();

function subscribeEditorView(onStoreChange: () => void) {
  viewListeners.add(onStoreChange);
  return () => {
    viewListeners.delete(onStoreChange);
  };
}

function getEditorView(): EditorView {
  const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
  return stored === "table" || stored === "cards" ? stored : "cards";
}

function setEditorView(next: EditorView) {
  window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  viewListeners.forEach((listener) => listener());
}

function omitLocalKey(row: LocalRow): WorkbookRow {
  const next: WorkbookRow = { ...row };
  delete (next as { _key?: string })._key;
  return next;
}

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

function groupedColumns(columns: EditorColumn[]) {
  const groups: { name: string; columns: EditorColumn[] }[] = [];
  for (const column of columns) {
    const name = column.group ?? "";
    const last = groups.at(-1);
    if (last && last.name === name) last.columns.push(column);
    else groups.push({ name, columns: [column] });
  }
  return groups;
}

function recordTitle(row: LocalRow, fallback: string) {
  for (const key of TITLE_KEYS) {
    const value = String(row[key] ?? "").trim();
    if (value) return value;
  }
  return fallback;
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
  allowRemove = true,
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
  allowRemove?: boolean;
}) {
  const [state, action, pending] = useActionState(saveAction, null);
  const [query, setQuery] = useState("");
  const [dirty, setDirty] = useState(false);
  const view = useSyncExternalStore(subscribeEditorView, getEditorView, () => "cards");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [localRows, setLocalRows] = useState<LocalRow[]>(() => rows.map(toLocal));
  const [sourceRows, setSourceRows] = useState(rows);

  if (rows !== sourceRows) {
    setSourceRows(rows);
    setLocalRows(rows.map(toLocal));
    setDeletedIds([]);
    setDirty(false);
  }

  const groups = useMemo(() => groupSpans(columns), [columns]);
  const fieldGroups = useMemo(() => groupedColumns(columns), [columns]);
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
    rows: localRows.map(omitLocalKey),
    deletedIds,
  });

  const statusMessage = pending ? (
    <span className="text-muted-foreground">Saving and publishing…</span>
  ) : state?.ok ? (
    <span className="text-navy-800">{state.message}</span>
  ) : state && !state.ok ? (
    <span className="text-danger">{state.error}</span>
  ) : dirty ? (
    <span className="text-muted-foreground">Unsaved changes will publish to the public dashboard.</span>
  ) : (
    <span className="text-muted-foreground">
      {localRows.length} record{localRows.length === 1 ? "" : "s"}
    </span>
  );

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
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="inline-flex w-fit rounded-xl border border-border bg-white p-1" role="group" aria-label="Editor layout">
            <button
              type="button"
              aria-pressed={view === "cards"}
              onClick={() => setEditorView("cards")}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold",
                view === "cards" ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-muted",
              )}
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
              Cards
            </button>
            <button
              type="button"
              aria-pressed={view === "table"}
              onClick={() => setEditorView("table")}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold",
                view === "table" ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-muted",
              )}
            >
              <Table2 className="size-4" aria-hidden="true" />
              Spreadsheet
            </button>
          </div>
          <label className="relative block min-w-0 flex-1 lg:w-64 lg:flex-none">
            <span className="sr-only">Search records</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field pl-9"
              placeholder="Search records"
            />
          </label>
        </div>
      </header>

      <form action={action} className={view === "table" ? "card" : "space-y-4"}>
        <input type="hidden" name="payload" value={payload} />
        {view === "cards" ? (
          <div className="space-y-4">
            {visible.length === 0 ? (
              <div className="card px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {localRows.length === 0 ? "No records yet. Add one to encode this dataset." : "No records match this search."}
                </p>
                {localRows.length === 0 ? (
                  <button type="button" onClick={addRow} className="btn btn-primary mx-auto mt-4">
                    <Plus className="size-4" aria-hidden="true" />
                    {addLabel}
                  </button>
                ) : null}
              </div>
            ) : (
              visible.map((row, index) => (
                <article key={row._key} className="card p-4 sm:p-5">
                  <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-navy-700">
                        Record {index + 1} of {visible.length}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-navy-900">
                        {recordTitle(row, "New record")}
                      </h3>
                    </div>
                    {allowRemove ? (
                      <button
                        type="button"
                        onClick={() => removeRow(row)}
                        className="btn btn-ghost text-muted-foreground hover:border-danger hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Remove
                      </button>
                    ) : null}
                  </header>
                  <div className="space-y-5">
                    {fieldGroups.map((group) => (
                      <div key={`${row._key}-${group.name || "fields"}`}>
                        {group.name ? (
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-700">
                            {group.name}
                          </h4>
                        ) : null}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {group.columns.map((column) => (
                            <EditorField
                              key={column.key}
                              id={`${row._key}-${column.key}`}
                              column={column}
                              row={row}
                              onChange={(value) => updateCell(row._key, column.key, value)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
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
                        {allowRemove ? (
                          <button
                            type="button"
                            onClick={() => removeRow(row)}
                            className="inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-danger"
                            aria-label={`Remove ${recordTitle(row, "row")}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
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
        )}

        <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={addRow} className="btn btn-ghost w-fit">
              <Plus className="size-4" aria-hidden="true" />
              {addLabel}
            </button>
            {Object.keys(footers).length ? (
              <p className="text-sm text-navy-800">
                Totals:{" "}
                {columns
                  .filter((column) => column.sumFooter)
                  .map((column) => `${column.header} ${footers[column.key].toLocaleString("en-PH")}`)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <p className="text-sm" role="status">
              {statusMessage}
            </p>
            <button disabled={pending} className="btn btn-primary disabled:opacity-60">
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              Save and publish
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function EditorField({
  id,
  column,
  row,
  onChange,
}: {
  id: string;
  column: EditorColumn;
  row: LocalRow;
  onChange: (value: string | number | boolean | null) => void;
}) {
  if (column.type === "checkbox") {
    return (
      <label htmlFor={id} className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-white px-3">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(row[column.key])}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4"
        />
        <span className="text-sm font-medium text-navy-900">
          {column.header}
          {column.required ? <span className="text-gold"> *</span> : null}
        </span>
      </label>
    );
  }

  return (
    <div className={cn("min-w-0", column.type === "textarea" && "sm:col-span-2 xl:col-span-3")}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-navy-900">
        {column.header}
        {column.required ? <span className="text-gold"> *</span> : null}
      </label>
      {column.hint ? <p className="mb-1 text-xs text-muted-foreground">{column.hint}</p> : null}
      <EditorCell id={id} column={column} row={row} onChange={onChange} variant="form" />
    </div>
  );
}

function EditorCell({
  id,
  column,
  row,
  onChange,
  variant = "table",
}: {
  id?: string;
  column: EditorColumn;
  row: LocalRow;
  onChange: (value: string | number | boolean | null) => void;
  variant?: "table" | "form";
}) {
  const value = row[column.key];
  const label = `${column.header}${column.group ? ` (${column.group})` : ""}`;
  const className = cn(
    variant === "form" ? "field" : "editor-cell",
    column.type === "textarea" && (variant === "form" ? "min-h-28" : "min-h-20 py-2"),
  );

  if (column.type === "readonly") {
    return (
      <span id={id} className="block min-h-11 rounded-xl bg-muted px-3 py-2 text-sm text-navy-900">
        {value === null || value === "" ? "—" : String(value)}
      </span>
    );
  }

  if (column.type === "checkbox") {
    return (
      <label className="flex min-h-11 items-center justify-center gap-2 px-2">
        <input
          id={id}
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
        id={id}
        aria-label={variant === "table" ? label : undefined}
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
        id={id}
        aria-label={variant === "table" ? label : undefined}
        className={className}
        rows={variant === "form" ? 4 : 2}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (column.type === "number") {
    return (
      <input
        id={id}
        aria-label={variant === "table" ? label : undefined}
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
      id={id}
      aria-label={variant === "table" ? label : undefined}
      className={className}
      type={column.type === "date" ? "date" : "text"}
      value={String(value ?? "")}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
