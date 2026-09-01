import ExcelJS from "exceljs";
import { cellText } from "../src/lib/import/excel-cells";
import { parseFiscalYear } from "../src/lib/periods";
import { parseWorkbook } from "../src/lib/import/parse-workbook";

async function main() {
  const file = "Executive-Dashboard.xlsx";
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);

  const research = wb.getWorksheet("8 Research Completed");
  if (!research) throw new Error("missing research sheet");
  const fyHeaders: { n: number; a: string | null; b: string | null }[] = [];
  research.eachRow((_row, n) => {
    const a = cellText(research, n, 1);
    const b = cellText(research, n, 2);
    const parsed = a ? parseFiscalYear(a) : null;
    if (parsed) fyHeaders.push({ n, a, b });
  });
  console.log("FY headers", fyHeaders);

  const parsed = await parseWorkbook(file);
  const counts: Record<number, number> = {};
  for (const row of parsed.researchCompleted) {
    counts[row.fiscalYear] = (counts[row.fiscalYear] ?? 0) + 1;
  }
  console.log("parsed research by year", counts);

  const fy2026 = parsed.researchCompleted.filter((row) => row.fiscalYear === 2026);
  console.log("FY2026 count", fy2026.length);
  console.log(
    "FY2026 numbered titles",
    fy2026.map((row) => `${row.sourceRow}|${row.title?.slice(0, 90)}`),
  );

  console.log("\n=== ACCREDITATION raw values ===");
  const accSet = new Map<string, number>();
  for (const program of parsed.programs) {
    const key = program.accreditationRaw ?? "(blank)";
    accSet.set(key, (accSet.get(key) ?? 0) + 1);
  }
  for (const [key, value] of accSet) {
    console.log(value, JSON.stringify(key).slice(0, 160));
  }
  console.log(
    "accreditable",
    parsed.programs.filter((item) => item.accreditable).length,
    "accredited",
    parsed.programs.filter((item) => item.accredited).length,
  );
  console.log("accreditable but not accredited:");
  for (const program of parsed.programs.filter((item) => item.accreditable && !item.accredited)) {
    console.log("-", program.name, "|", program.accreditationRaw);
  }
  console.log("not accreditable:");
  for (const program of parsed.programs.filter((item) => item.accreditable === false)) {
    console.log("-", program.name, "|", program.accreditationRaw);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
