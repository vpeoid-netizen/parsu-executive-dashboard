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
import { revalidatePath } from "next/cache";

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
  revalidatePath("/about");
  redirect("/admin/content");
}

export async function saveOfficialAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const data = {
    name: String(formData.get("name") ?? ""),
    position: String(formData.get("position") ?? ""),
    office: String(formData.get("office") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    section: String(formData.get("section") ?? "") || null,
    displayOrder: Number(formData.get("displayOrder") ?? 0),
    published: formData.get("published") === "on",
  };
  const record = id
    ? await prisma.official.update({ where: { id }, data })
    : await prisma.official.create({ data });
  await writeAuditLog({
    userId: admin.id,
    action: id ? "UPDATE" : "CREATE",
    entityType: "Official",
    entityId: record.id,
    summary: `${id ? "Updated" : "Added"} official ${record.name}`,
  });
  revalidatePath("/about/officials");
  redirect("/admin/officials");
}

export async function saveDocumentAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const data = {
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? "Other"),
    description: String(formData.get("description") ?? "") || null,
    externalUrl: String(formData.get("externalUrl") ?? "") || null,
    version: String(formData.get("version") ?? "") || null,
    visibility: "PUBLIC",
    published: formData.get("published") === "on",
    publishedAt: new Date(),
  };
  const record = await prisma.documentRecord.create({ data });
  await writeAuditLog({
    userId: admin.id,
    action: "CREATE",
    entityType: "DocumentRecord",
    entityId: record.id,
    summary: `Added document ${record.title}`,
  });
  revalidatePath("/documents");
  redirect("/admin/documents");
}

export async function saveFlagshipAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const record = await prisma.flagshipProgram.create({
    data: {
      title: String(formData.get("title") ?? ""),
      shortDescription: String(formData.get("shortDescription") ?? "") || null,
      fullDescription: String(formData.get("fullDescription") ?? "") || null,
      office: String(formData.get("office") ?? "") || null,
      programLead: String(formData.get("programLead") ?? "") || null,
      programStatus: String(formData.get("programStatus") ?? "") || null,
      showOnHomepage: formData.get("showOnHomepage") === "on",
      published: formData.get("published") === "on",
    },
  });
  await writeAuditLog({
    userId: admin.id,
    action: "CREATE",
    entityType: "FlagshipProgram",
    entityId: record.id,
    summary: `Added flagship program ${record.title}`,
  });
  revalidatePath("/flagship");
  redirect("/admin/content");
}

export async function saveAssetAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const kind = String(formData.get("kind"));
  const status = formData.get("published") === "on" ? "PUBLISHED" : "DRAFT";
  if (kind === "building") {
    await prisma.buildingAsset.create({
      data: {
        datasetVersionId: "manual",
        status,
        name: String(formData.get("name") ?? ""),
        buildingType: String(formData.get("type") ?? "") || null,
        buildingStatus: String(formData.get("status") ?? "") || null,
      },
    });
  } else if (kind === "vehicle") {
    await prisma.vehicleAsset.create({
      data: {
        datasetVersionId: "manual",
        status,
        name: String(formData.get("name") ?? ""),
        plateOrPropertyNo: String(formData.get("plate") ?? "") || null,
        operationalStatus: String(formData.get("status") ?? "") || null,
      },
    });
  } else if (kind === "land") {
    await prisma.landAsset.create({
      data: {
        datasetVersionId: "manual",
        status,
        location: String(formData.get("name") ?? ""),
        landArea: String(formData.get("type") ?? "") || null,
        remarks: String(formData.get("status") ?? "") || null,
      },
    });
  }
  await writeAuditLog({
    userId: admin.id,
    action: "CREATE",
    entityType: "Asset",
    summary: `Added ${kind} record`,
  });
  revalidatePath("/assets");
  redirect("/admin/assets");
}

export async function saveInfrastructureAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  await prisma.infrastructureProject.create({
    data: {
      datasetVersionId: "manual",
      status: formData.get("published") === "on" ? "PUBLISHED" : "DRAFT",
      classification: String(formData.get("classification") ?? "ONGOING"),
      name: String(formData.get("name") ?? ""),
      contractor: String(formData.get("contractor") ?? "") || null,
      projectStatus: String(formData.get("projectStatus") ?? "") || null,
      delayNotes: String(formData.get("notes") ?? "") || null,
    },
  });
  revalidatePath("/infrastructure");
  redirect("/admin/infrastructure");
}

export async function saveBudgetAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  await prisma.budgetRecord.create({
    data: {
      datasetVersionId: "manual",
      status: formData.get("published") === "on" ? "PUBLISHED" : "DRAFT",
      fiscalYear: Number(formData.get("fiscalYear") ?? new Date().getFullYear()),
      fundingSource: String(formData.get("fundingSource") ?? "") || null,
      programPap: String(formData.get("programPap") ?? "") || null,
      budget: formData.get("budget") ? Number(formData.get("budget")) : null,
      obligation: formData.get("obligation") ? Number(formData.get("obligation")) : null,
      disbursement: formData.get("disbursement") ? Number(formData.get("disbursement")) : null,
      publiclyPublishable: formData.get("public") === "on",
    },
  });
  revalidatePath("/budget");
  redirect("/admin/budget");
}

export async function savePartnerAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  await prisma.internationalPartner.create({
    data: {
      datasetVersionId: "manual",
      status: formData.get("published") === "on" ? "PUBLISHED" : "DRAFT",
      institution: String(formData.get("institution") ?? ""),
      country: String(formData.get("country") ?? "") || null,
      agreementType: String(formData.get("agreementType") ?? "") || null,
      partnerStatus: String(formData.get("partnerStatus") ?? "") || null,
    },
  });
  revalidatePath("/internationalization");
  redirect("/admin/internationalization");
}
