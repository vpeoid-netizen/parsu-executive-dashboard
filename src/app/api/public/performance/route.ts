import { NextResponse } from "next/server";
import { classifyAchievement } from "@/lib/metrics";
import { getPerformanceByIndicator, getPerformanceByYear } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const year = new URL(request.url).searchParams.get("year");
  if (year) {
    const rows = await getPerformanceByYear(Number(year));
    return NextResponse.json({
      observations: rows.map((row) => ({
        fiscalYear: row.fiscalYear,
        programMfo: row.indicator.programMfo,
        title: row.indicator.title,
        targetRaw: row.targetRaw,
        accomplishmentRaw: row.accomplishmentRaw,
        isPartial: row.isPartial,
        status: classifyAchievement({
          accomplishment: row.accomplishmentValue,
          target: row.targetValue,
          isPartial: row.isPartial,
        }),
      })),
    });
  }

  const indicators = await getPerformanceByIndicator();
  return NextResponse.json({
    indicators: indicators.map((indicator) => ({
      id: indicator.id,
      programMfo: indicator.programMfo,
      indicatorType: indicator.indicatorType,
      title: indicator.title,
      observations: indicator.observations.map((row) => ({
        fiscalYear: row.fiscalYear,
        targetRaw: row.targetRaw,
        accomplishmentRaw: row.accomplishmentRaw,
        isPartial: row.isPartial,
        status: classifyAchievement({
          accomplishment: row.accomplishmentValue,
          target: row.targetValue,
          isPartial: row.isPartial,
        }),
      })),
    })),
  });
}
