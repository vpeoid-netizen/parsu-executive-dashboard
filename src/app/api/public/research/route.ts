import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [completed, publications, utilization] = await Promise.all([
    prisma.researchCompletion.count({ where: { status: "PUBLISHED" } }),
    prisma.researchPublication.count({ where: { status: "PUBLISHED" } }),
    prisma.researchUtilization.count({ where: { status: "PUBLISHED" } }),
  ]);
  return NextResponse.json({ completed, publications, utilization });
}
