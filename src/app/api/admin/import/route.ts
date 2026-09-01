import { NextResponse } from "next/server";
import { getAdminFromToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { cookies } from "next/headers";

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const admin = await getAdminFromToken(token);
  if (!admin) return null;
  return admin;
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    message: "Use the administrator import form at /admin/import to upload, validate and publish datasets.",
  });
}
