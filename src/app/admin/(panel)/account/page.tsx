import Link from "next/link";
import { changeAdminPasswordAction, updateAdminProfileAction } from "@/app/admin/actions";
import { saveCampusesAction, saveCollegesAction } from "@/app/admin/data-actions";
import { AccountPasswordForm, AccountProfileForm } from "@/components/admin/account-forms";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { getCurrentAdmin } from "@/lib/auth";
import { withEmpty } from "@/lib/admin/options";
import { prisma } from "@/lib/db";
import { adminDataModules } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const admin = await getCurrentAdmin();
  const [campuses, colleges] = await Promise.all([
    prisma.campus.findMany({ orderBy: { name: "asc" } }),
    prisma.college.findMany({ orderBy: { name: "asc" } }),
  ]);
  const campusOptions = withEmpty(campuses.map((campus) => ({ value: campus.id, label: campus.name })));
  const lastLoginLabel = admin?.lastLoginAt
    ? admin.lastLoginAt.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })
    : "Not recorded yet";

  return (
    <div className="space-y-10">
      <AdminModuleIntro
        title="Administrator account"
        description="Update the signed-in account, then edit any dashboard dataset from the cards below. Cards show labeled fields; switch to spreadsheet view if you prefer a table."
      />
      <AccountProfileForm
        name={admin?.name ?? ""}
        email={admin?.email ?? ""}
        role={admin?.role ?? "ADMIN"}
        lastLoginLabel={lastLoginLabel}
        action={updateAdminProfileAction}
      />
      <AccountPasswordForm action={changeAdminPasswordAction} />

      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-semibold tracking-tight text-navy-900">Edit dashboard data</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Open a module, change the fields, and choose Save and publish. Homepage KPIs update from these source tables.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {adminDataModules.map((item) => (
            <Link key={item.href} href={item.href} className="card card-interactive p-4">
              <p className="font-semibold text-navy-900">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <WorkbookEditor
        title="Campuses"
        description="These names appear in admin dropdowns for programs, faculty, staff, and students. Uncheck Active to hide a campus from those lists without deleting it."
        saveAction={saveCampusesAction}
        addLabel="Add campus"
        addRowDefaults={{ active: true }}
        allowRemove={false}
        columns={[
          { key: "name", header: "Campus name", type: "text", required: true, width: "16rem" },
          { key: "code", header: "Code", type: "text", hint: "Short unique code, such as GOA", width: "8rem" },
          { key: "shortName", header: "Short name", type: "text", width: "12rem" },
          { key: "active", header: "Active", type: "checkbox", width: "7rem" },
        ]}
        rows={campuses.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          shortName: row.shortName ?? "",
          active: row.active,
        }))}
      />
      <WorkbookEditor
        title="Colleges"
        description="College lists feed program and faculty editors. Assign a campus when the college belongs to one location."
        saveAction={saveCollegesAction}
        addLabel="Add college"
        addRowDefaults={{ active: true }}
        allowRemove={false}
        columns={[
          { key: "name", header: "College name", type: "text", required: true, width: "16rem" },
          { key: "code", header: "Code", type: "text", hint: "Short unique code, such as CCMS", width: "8rem" },
          { key: "campusId", header: "Campus", type: "select", options: campusOptions, width: "14rem" },
          { key: "active", header: "Active", type: "checkbox", width: "7rem" },
        ]}
        rows={colleges.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          campusId: row.campusId ?? "",
          active: row.active,
        }))}
      />
    </div>
  );
}
