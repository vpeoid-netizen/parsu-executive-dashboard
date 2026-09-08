import { savePartnersTableAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";

export default async function InternationalizationAdminPage() {
  const rows = await prisma.internationalPartner.findMany({
    where: { status: { in: ["PUBLISHED", "DRAFT"] } },
    orderBy: { institution: "asc" },
  });

  return (
    <div className="space-y-6">
      <AdminModuleIntro
        title="Internationalization"
        description="Edit partner institutions, countries, and agreement types. Published rows appear on the public Internationalization page."
      />
      <WorkbookEditor
        title="Partner institutions"
        description="One row per partner or agreement."
        saveAction={savePartnersTableAction}
        addLabel="Add partner"
        addRowDefaults={{ published: true }}
        columns={[
          { key: "institution", header: "Institution", type: "text", required: true, width: "16rem" },
          { key: "country", header: "Country", type: "text", width: "10rem" },
          { key: "agreementType", header: "Agreement type", type: "text", width: "12rem" },
          { key: "partnerStatus", header: "Status", type: "text", width: "9rem" },
          { key: "responsibleOffice", header: "Responsible office", type: "text", width: "12rem" },
          { key: "activities", header: "Activities", type: "textarea", width: "16rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={rows.map((row) => ({
          id: row.id,
          institution: row.institution,
          country: row.country ?? "",
          agreementType: row.agreementType ?? "",
          partnerStatus: row.partnerStatus ?? "",
          responsibleOffice: row.responsibleOffice ?? "",
          activities: row.activities ?? "",
          published: row.status === "PUBLISHED",
        }))}
      />
    </div>
  );
}
