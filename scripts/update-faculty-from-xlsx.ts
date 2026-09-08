import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(file: string) {
  if (!existsSync(file)) {
    throw new Error(`Env file not found: ${file}`);
  }
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
}

async function main() {
  const envFile = process.env.ENV_FILE;
  if (envFile) loadEnvFile(envFile);
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Run with `vercel env run -e production`.");
  }
  if (/localhost|127\.0\.0\.1/.test(databaseUrl)) {
    throw new Error("DATABASE_URL points at localhost. Refusing to import faculty into the local database.");
  }
  const file = process.argv[2];
  if (!file) {
    throw new Error("Usage: ENV_FILE=<prod.env> tsx scripts/update-faculty-from-xlsx.ts <path-to-xlsx>");
  }
  await import("@prisma/client");
  process.env.DATABASE_URL = databaseUrl;
  const { parseWorkbook } = await import("../src/lib/import/parse-workbook");
  const { persistFacultyDataset } = await import("../src/lib/import/persist");
  const { prisma } = await import("../src/lib/db");
  process.env.DATABASE_URL = databaseUrl;
  const parsed = await parseWorkbook(file);
  const unmatched = parsed.faculty.filter((row) => !row.collegeCode);
  if (unmatched.length) {
    throw new Error(
      `Unmatched college rows: ${unmatched.map((row) => `row ${row.sourceRow}`).join(", ")}`,
    );
  }
  const total = parsed.faculty.reduce((sum, row) => sum + (row.total ?? 0), 0);
  const result = await persistFacultyDataset(parsed, {
    sourceFile: path.basename(file),
    publish: true,
  });
  console.log(
    JSON.stringify(
      {
        source: path.basename(file),
        colleges: parsed.faculty.length,
        totalFaculty: total,
        versionId: result.versionId,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
