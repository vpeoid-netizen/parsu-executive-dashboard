import { ClientDataTable, type ClientColumn } from "@/components/ui/client-data-table";

export type Column<T> = {
  key: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  hideOnMobile?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  searchPlaceholder = "Search",
  exportName = "parsu-data",
}: {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder?: string;
  exportName?: string;
}) {
  const serialized = rows.map((row) =>
    Object.fromEntries(
      columns.map((column) => {
        const value = column.accessor(row);
        return [column.key, value === undefined ? null : value];
      }),
    ),
  ) as Record<string, string | number | null>[];
  const clientColumns: ClientColumn[] = columns.map(({ key, header, hideOnMobile }) => ({
    key,
    header,
    hideOnMobile,
  }));
  return (
    <ClientDataTable
      columns={clientColumns}
      rows={serialized}
      searchPlaceholder={searchPlaceholder}
      exportName={exportName}
    />
  );
}
