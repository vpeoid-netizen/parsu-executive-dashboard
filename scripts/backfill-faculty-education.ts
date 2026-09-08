import facultySource from "../src/lib/import/faculty-members-source.json";
import { prisma } from "../src/lib/db";
import { persistFacultyDataset } from "../src/lib/import/persist";

type FacultyCounts = { education?: Record<string, number> };

async function publishedFacultyHasEducation() {
  const rows = await prisma.facultySnapshot.findMany({
    where: { status: "PUBLISHED" },
    select: { countsJson: true },
  });
  return rows.some((row) => {
    const counts = JSON.parse(row.countsJson) as FacultyCounts;
    return Object.values(counts.education ?? {}).some((value) => value > 0);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("Skipping faculty education backfill: DATABASE_URL is not set.");
    return;
  }
  if (await publishedFacultyHasEducation()) {
    console.log("Skipping faculty education backfill: published faculty already include educational attainment.");
    return;
  }
  const total = facultySource.faculty.reduce((sum, row) => sum + (row.total ?? 0), 0);
  if (facultySource.faculty.length !== 11 || total !== 262) {
    throw new Error("Faculty source snapshot is incomplete; refusing to backfill.");
  }
  const result = await persistFacultyDataset(
    { faculty: facultySource.faculty },
    { sourceFile: facultySource.sourceFile, publish: true },
  );
  console.log(
    `Published faculty education backfill: ${result.count} colleges, version ${result.versionId}.`,
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
