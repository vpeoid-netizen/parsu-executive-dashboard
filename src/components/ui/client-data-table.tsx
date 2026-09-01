"use client";

import { useMemo, useState } from "react";
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
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/70 text-navy-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn("px-4 py-3 font-medium", column.hideOnMobile && "hidden md:table-cell")}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
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
                <tr key={index} className="border-t border-border">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 py-3 align-top", column.hideOnMobile && "hidden md:table-cell")}
                    >
                      {row[column.key] ?? "—"}
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
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-ghost min-h-9 px-3 py-1 disabled:opacity-50"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </button>
          <span>
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-ghost min-h-9 px-3 py-1 disabled:opacity-50"
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
