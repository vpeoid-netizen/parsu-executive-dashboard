"use client";

import { useMemo, useState } from "react";
import { formatCellValue } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ClientColumn = {
  key: string;
  header: string;
  hideOnMobile?: boolean;
};

export function ClientDataTable({
  columns,
  rows,
  searchPlaceholder = "Search",
  exportName = "parsu-data",
}: {
  columns: ClientColumn[];
  rows: Record<string, string | number | null>[];
  searchPlaceholder?: string;
  exportName?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const searched = needle
      ? rows.filter((row) =>
          columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(needle)),
        )
      : rows;
    if (!sortKey) return searched;
    return [...searched].sort((a, b) => {
      const result = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "en", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? result : -result;
    });
  }, [columns, query, rows, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice(page * pageSize, page * pageSize + pageSize);

  function exportCsv() {
    const header = columns.map((column) => column.header).join(",");
    const body = filtered
      .map((row) =>
        columns
          .map((column) => `"${String(row[column.key] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center">
        <label className="flex-1 text-sm">
          <span className="sr-only">{searchPlaceholder}</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="field"
          />
        </label>
        <button type="button" onClick={exportCsv} className="btn btn-ghost">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-full text-left text-[13px] sm:text-sm">
          <thead className="bg-navy-950 text-white">
            <tr>
              {columns.map((column, columnIndex) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-3 py-3 text-xs font-semibold uppercase tracking-[0.04em] sm:px-4",
                    column.hideOnMobile && "hidden md:table-cell",
                    columnIndex === 0 && "sticky left-0 z-10 bg-navy-950",
                  )}
                >
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-1 text-white"
                    onClick={() => {
                      if (sortKey === column.key) {
                        setSortDir((value) => (value === "asc" ? "desc" : "asc"));
                      } else {
                        setSortKey(column.key);
                        setSortDir("asc");
                      }
                    }}
                  >
                    {column.header}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-muted-foreground" colSpan={columns.length}>
                  Data not yet available
                </td>
              </tr>
            ) : (
              current.map((row, index) => (
                <tr key={index} className="group border-t border-border even:bg-muted/35 hover:bg-gold-soft/40">
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-3 align-top sm:px-4",
                        column.hideOnMobile && "hidden md:table-cell",
                        columnIndex === 0 &&
                          "sticky left-0 z-[1] bg-white group-even:bg-[color-mix(in_srgb,var(--muted)_35%,white)] group-hover:bg-gold-soft/40",
                      )}
                    >
                      {formatCellValue(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {filtered.length} record{filtered.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost min-h-11 px-4 disabled:opacity-50"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <span className="tabular-nums">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-ghost min-h-11 px-4 disabled:opacity-50"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
