import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseWorkbook } from "../src/lib/import/parse-workbook";
import { ensureAdminUser, persistWorkbook } from "../src/lib/import/persist";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
}

async function main() {
  loadEnv();
  const source = path.resolve(
    process.cwd(),
    process.env.EXCEL_SOURCE_PATH || "Executive-Dashboard.xlsx",
  );
  if (!existsSync(source)) {
    throw new Error(`Workbook not found at ${source}`);
  }
  console.log(`Parsing ${source}`);
  const parsed = await parseWorkbook(source);
  console.log(`Programs ${parsed.programs.length}, faculty rows ${parsed.faculty.length}, enrollment ${parsed.enrollment.length}, issues ${parsed.issues.length}`);
  const admin = await ensureAdminUser();
  await persistWorkbook(parsed, {
    sourceFile: path.basename(source),
    publish: true,
    adminId: admin?.id,
  });
  console.log("Published initial workbook import.");
  if (admin) console.log(`Administrator ready: ${admin.email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
