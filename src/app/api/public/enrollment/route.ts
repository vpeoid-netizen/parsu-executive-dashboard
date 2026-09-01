import { NextResponse } from "next/server";
import { getEnrollmentSeries } from "@/lib/queries";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ay = url.searchParams.get("ay");
  const semester = url.searchParams.get("semester");
  const series = await getEnrollmentSeries();
  const rows = await prisma.enrollmentObservation.findMany({
    where: {
      status: "PUBLISHED",
      ...(ay || semester
        ? {
            period: {
              ...(ay ? { academicYearStart: Number(ay) } : {}),
              ...(semester ? { semester: Number(semester) } : {}),
            },
          }
        : {}),
    },
    include: { period: true },
  });
  return NextResponse.json({ series, rows });
}
