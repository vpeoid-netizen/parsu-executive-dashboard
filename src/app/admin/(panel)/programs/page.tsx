import { prisma } from "@/lib/db";
import { collegeFullName } from "@/lib/import/normalize";

async function TablePage({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  columns: { key: string; header: string }[];
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use Import to update large datasets. Destructive changes are performed through dataset versioning rather than silent overwrite.
      </p>
      <div className="card mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 text-left">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 100).map((row, index) => (
              <tr key={index} className="border-t">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2">
                    {String(row[column.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ProgramsAdminPage() {
  const rows = await prisma.academicProgram.findMany({
    where: { status: "PUBLISHED" },
    include: { campus: true, college: true },
    take: 100,
  });
  return (
    <TablePage
      title="Academic programs"
      columns={[
        { key: "college", header: "College" },
        { key: "name", header: "Program" },
        { key: "campus", header: "Campus" },
        { key: "copcNumber", header: "COPC" },
        { key: "status", header: "Status" },
      ]}
      rows={rows.map((row) => ({
        college: row.college?.code ? collegeFullName(row.college.code) : "Unspecified",
        name: row.name,
        campus: row.campus?.name,
        copcNumber: row.copcNumber,
        status: row.status,
      }))}
    />
  );
}
