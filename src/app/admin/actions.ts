"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { writeAuditLog } from "@/lib/audit";
import {
  createSession,
  destroySession,
  getCurrentAdmin,
  recordLoginAttempt,
  sessionCookieOptions,
  tooManyLoginAttempts,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseWorkbook } from "@/lib/import/parse-workbook";
import { persistWorkbook } from "@/lib/import/persist";
import { requestIp } from "@/lib/queries";
import { SESSION_COOKIE } from "@/lib/constants";
import { revalidatePath, revalidateTag } from "next/cache";

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await requestIp();
  if (await tooManyLoginAttempts(email, ip)) {
    return { error: "Too many failed sign-in attempts. Try again in 15 minutes." };
  }
  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  await recordLoginAttempt(email, ip, Boolean(valid && user?.active));
  if (!user?.active || !valid) {
    await writeAuditLog({
      action: "LOGIN_FAILED",
      entityType: "AdminUser",
      summary: `Failed login for ${email}`,
      ipAddress: ip,
    });
    return { error: "Invalid email or password." };
  }
  const session = await createSession(user.id, ip, (await headers()).get("user-agent") ?? undefined);
  const store = await cookies();
  const options = sessionCookieOptions(session.expiresAt);
  store.set(options.name, session.token, options);
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAuditLog({
    userId: user.id,
    action: "LOGIN",
    entityType: "AdminUser",
    entityId: user.id,
    summary: "Administrator signed in",
    ipAddress: ip,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const admin = await getCurrentAdmin();
  await destroySession(token);
  store.delete(SESSION_COOKIE);
  if (admin) {
    await writeAuditLog({
      userId: admin.id,
      action: "LOGOUT",
      entityType: "AdminUser",
      entityId: admin.id,
      summary: "Administrator signed out",
    });
  }
  redirect("/admin/login");
}

export async function importWorkbookAction(
  _prev: unknown,
  formData: FormData,
) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an Excel or CSV file." };
  }
  const allowed = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/vnd.ms-excel",
  ];
  if (file.type && !allowed.includes(file.type) && !file.name.match(/\.(xlsx|csv)$/i)) {
    return { error: "Unsupported file type. Upload .xlsx or .csv." };
  }
  const publish = formData.get("publish") === "on";
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "uploads", "imports");
  await mkdir(dir, { recursive: true });
  const stored = path.join(dir, `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
  await writeFile(stored, buffer);
  const parsed = await parseWorkbook(stored);
  const result = await persistWorkbook(parsed, {
    sourceFile: file.name,
    publish,
    adminId: admin.id,
  });
  await prisma.importJob.create({
    data: {
      adminId: admin.id,
      fileName: file.name,
      filePath: stored,
      mimeType: file.type,
      status: publish ? "PUBLISHED" : "VALIDATED",
      summaryJson: JSON.stringify({
        programs: parsed.programs.length,
        faculty: parsed.faculty.length,
        enrollment: parsed.enrollment.length,
        issues: parsed.issues,
      }),
    },
  });
  await writeAuditLog({
    userId: admin.id,
    action: publish ? "PUBLISH" : "IMPORT",
    entityType: "ImportJob",
    summary: `${publish ? "Published" : "Imported"} ${file.name} with ${parsed.issues.length} validation notes`,
    nextJson: { issues: parsed.issues.length, publish },
  });
  revalidatePath("/");
  revalidatePath("/admin");
  return {
    ok: true,
    publish,
    counts: {
      programs: parsed.programs.length,
      faculty: parsed.faculty.length,
      staff: parsed.staff.length,
      enrollment: parsed.enrollment.length,
      licensure: parsed.licensure.length,
      awards: parsed.awards.length,
      research: parsed.researchCompleted.length,
    },
    issues: parsed.issues,
  };
}

export async function savePageAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const slug = String(formData.get("slug"));
  const title = String(formData.get("title"));
  const body = String(formData.get("body"));
  const published = formData.get("published") === "on";
  const previous = await prisma.institutionalPage.findUnique({ where: { slug } });
  const page = await prisma.institutionalPage.upsert({
    where: { slug },
    update: { title, body, published },
    create: { slug, title, body, published },
  });
  await writeAuditLog({
    userId: admin.id,
    action: "UPDATE",
    entityType: "InstitutionalPage",
    entityId: page.id,
    summary: `Updated ${title}`,
    previousJson: previous,
    nextJson: page,
  });
  revalidateTag("public-data", "max");
  revalidatePath("/about");
  redirect("/admin/content");
}

