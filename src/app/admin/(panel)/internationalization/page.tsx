import { saveMembershipsTableAction, savePartnersTableAction } from "@/app/admin/data-actions";
import { AdminModuleIntro } from "@/components/admin/module-intro";
import { WorkbookEditor } from "@/components/admin/workbook-editor";
import { prisma } from "@/lib/db";

export default async function InternationalizationAdminPage() {
  const [rows, memberships] = await Promise.all([
    prisma.internationalPartner.findMany({
      where: { status: { in: ["PUBLISHED", "DRAFT"] } },
      orderBy: { institution: "asc" },
    }),
    prisma.internationalMembership.findMany({
      where: { status: { in: ["PUBLISHED", "DRAFT"] } },
      orderBy: { organization: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <AdminModuleIntro
        title="Internationalization"
        description="Edit partner institutions and memberships. Published records appear on the public Internationalization page."
      />
      <WorkbookEditor
        title="Partner institutions"
        description="One record per partner or agreement."
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
      <WorkbookEditor
        title="Memberships"
        description="Organizations ParSU belongs to, shown beside partners on the public page."
        saveAction={saveMembershipsTableAction}
        addLabel="Add membership"
        addRowDefaults={{ published: true }}
        columns={[
          { key: "organization", header: "Organization", type: "text", required: true, width: "16rem" },
          { key: "countryOrRegion", header: "Country / region", type: "text", width: "12rem" },
          { key: "membershipType", header: "Membership type", type: "text", width: "12rem" },
          { key: "startYear", header: "Start year", type: "number", min: 1900, width: "8rem" },
          { key: "validity", header: "Validity", type: "text", width: "10rem" },
          { key: "membershipStatus", header: "Status", type: "text", width: "9rem" },
          { key: "published", header: "Published", type: "checkbox", width: "7rem" },
        ]}
        rows={memberships.map((row) => ({
          id: row.id,
          organization: row.organization,
          countryOrRegion: row.countryOrRegion ?? "",
          membershipType: row.membershipType ?? "",
          startYear: row.startYear,
          validity: row.validity ?? "",
          membershipStatus: row.membershipStatus ?? "",
          published: row.status === "PUBLISHED",
        }))}
      />
    </div>
  );
}
