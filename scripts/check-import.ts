import { prisma } from "../src/lib/db";

async function main() {
  const rows = await prisma.enrollmentObservation.findMany({
    where: { status: "PUBLISHED" },
    include: { period: true },
  });
  const by: Record<string, number> = {};
  for (const row of rows) {
    const key = row.period?.label ?? "?";
    by[key] = (by[key] || 0) + (row.headcount || 0);
  }
  const programs = await prisma.academicProgram.count({ where: { status: "PUBLISHED" } });
  const kpis = await prisma.metricObservation.findMany({
    where: { status: "PUBLISHED" },
    include: { metric: true },
  });
  console.log(
    JSON.stringify(
      {
        programs,
        enrollment: by,
        kpis: Object.fromEntries(kpis.map((item) => [item.metric.code, item.value])),
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main();
