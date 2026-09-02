import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { collegeFullName } from "@/lib/import/normalize";

export const dynamic = "force-dynamic";

export async function GET() {
  const programs = await prisma.academicProgram.findMany({
    where: { status: "PUBLISHED" },
    include: { campus: true, college: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    count: programs.length,
    programs: programs.map((program) => ({
      name: program.name,
      campus: program.campus?.name ?? null,
      college: program.college?.code ? collegeFullName(program.college.code) : null,
      type: program.programType,
      copcNumber: program.copcNumber,
      accreditationLevel: program.accreditationLevel,
      validityRaw: program.validityRaw,
      accreditable: program.accreditable,
      accredited: program.accredited,
    })),
  });
}
