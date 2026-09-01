import ExcelJS from "exceljs";
import { cellNumber, cellText } from "../src/lib/import/excel-cells";
import { parseWorkbook } from "../src/lib/import/parse-workbook";

async function main() {
  const file = "Executive-Dashboard.xlsx";
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);

  const research = wb.getWorksheet("8 Research Completed")!;
  console.log("=== FY 2026 col A/B/C sample ===");
  for (let n = 306; n <= 400; n++) {
    const a = cellText(research, n, 1);
    const aNum = cellNumber(research, n, 1);
    const b = cellText(research, n, 2);
    const c = cellText(research, n, 3);
    if (!a && !b && !c) continue;
    console.log(
      String(n).padStart(3),
      "|A:",
      JSON.stringify(a)?.slice(0, 20),
      "|An:",
      aNum,
      "|B:",
      JSON.stringify(b)?.slice(0, 55),
      "|C:",
      JSON.stringify(c)?.slice(0, 30),
    );
  }

  const parsed = await parseWorkbook(file);
  const unique = new Map<string, number>();
  for (const row of parsed.researchCompleted.filter((item) => item.fiscalYear === 2026)) {
    const key = row.title.replace(/\s+/g, " ").trim().toLowerCase();
    unique.set(key, (unique.get(key) ?? 0) + 1);
  }
  console.log("\nunique FY2026 titles", unique.size);
  console.log("unique titles list:");
  [...unique.keys()].forEach((title, i) => console.log(String(i + 1).padStart(2), title.slice(0, 90)));

  const contents = wb.getWorksheet("1 Contents") ?? wb.worksheets[0];
  console.log("\n=== Contents sheet name", contents?.name);
  if (contents) {
    contents.eachRow((row, n) => {
      if (n > 80) return;
      const vals = [1, 2, 3, 4, 5].map((col) => cellText(contents, n, col)).filter(Boolean);
      if (vals.length) console.log(n, vals.join(" | "));
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
