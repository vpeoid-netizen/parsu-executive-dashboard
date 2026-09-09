import facultySource from "../src/lib/import/faculty-members-source.json";
import { prisma } from "../src/lib/db";
import { persistFacultyDataset } from "../src/lib/import/persist";

type FacultyCounts = {
  appointment?: Record<string, number>;
  rank?: Record<string, number>;
  education?: Record<string, number>;
};

function countsEqual(left: FacultyCounts, right: FacultyCounts) {
  for (const group of ["appointment", "rank", "education"] as const) {
    const leftGroup = left[group] ?? {};
    const rightGroup = right[group] ?? {};
    const keys = new Set([...Object.keys(leftGroup), ...Object.keys(rightGroup)]);
    for (const key of keys) {
      if ((leftGroup[key] ?? 0) !== (rightGroup[key] ?? 0)) return false;
    }
  }
  return true;
}

async function publishedMatchesSource() {
  const rows = await prisma.facultySnapshot.findMany({
    where: { status: "PUBLISHED" },
    select: {
      total: true,
      countsJson: true,
      college: { select: { code: true } },
    },
  });
  if (rows.length !== facultySource.faculty.length) return false;
  const published = new Map(
    rows.map((row) => [
      row.college?.code ?? "",
      { total: row.total ?? 0, counts: JSON.parse(row.countsJson) as FacultyCounts },
    ]),
  );
  for (const row of facultySource.faculty) {
    const current = published.get(row.collegeCode ?? "");
    if (!current || current.total !== (row.total ?? 0)) return false;
    if (!countsEqual(current.counts, row.counts)) return false;
  }
  return true;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("Skipping faculty snapshot sync: DATABASE_URL is not set.");
    return;
  }
  const total = facultySource.faculty.reduce((sum, row) => sum + (row.total ?? 0), 0);
  if (!facultySource.faculty.length || total <= 0) {
    throw new Error("Faculty source snapshot is incomplete; refusing to publish.");
  }
  if (await publishedMatchesSource()) {
    console.log("Skipping faculty snapshot sync: published faculty already match the source worksheet.");
    return;
  }
  const result = await persistFacultyDataset(
    { faculty: facultySource.faculty },
    { sourceFile: facultySource.sourceFile, publish: true },
  );
  console.log(
    `Published faculty snapshot: ${result.count} colleges, ${total} faculty, version ${result.versionId}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
