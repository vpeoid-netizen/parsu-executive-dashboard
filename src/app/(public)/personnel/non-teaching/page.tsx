import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState, KpiCard, ModuleHeader } from "@/components/ui/primitives";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import {
  ACADEMIC_DELIVERY_DEPARTMENT,
  GOA_CAMPUS_LABEL,
  appointmentMixNote,
  alignStaffTotalsToAppointments,
  groupStaffOffices,
  partitionAcademicDeliveryOffices,
  type StaffOfficeGroup,
  type StaffOfficeRow,
} from "@/lib/staff-offices";
import { cn } from "@/lib/utils";

export default async function StaffPage() {
  const [rows, campuses] = await Promise.all([
    prisma.staffSnapshot.findMany({ where: { status: "PUBLISHED" } }),
    prisma.campus.findMany(),
  ]);
  const campusName = Object.fromEntries(campuses.map((item) => [item.id, item.name]));
  const parsed: StaffOfficeRow[] = alignStaffTotalsToAppointments(
    rows.map((row) => ({
      department: row.department,
      office: row.office,
      unit: row.unit,
      campus: row.campusId ? campusName[row.campusId] ?? "Central / unspecified" : "Central / unspecified",
      total: row.total ?? 0,
      counts: JSON.parse(row.countsJson) as { appointment?: Record<string, number> },
    })),
  );
  const total = parsed.reduce((sum, row) => sum + (row.total ?? 0), 0);
  const sumBy = (key: string) => parsed.reduce((sum, row) => sum + (row.counts.appointment?.[key] ?? 0), 0);
  const grouped = groupStaffOffices(parsed);

  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ href: "/personnel", label: "Personnel" }, { label: "Non-Teaching Personnel" }]} />
      <ModuleHeader
        title="Non-Teaching Personnel"
        description="Personnel counts by office and division. Units appear as their own cards under the office they belong to. A count of 0 means the office or unit currently has no assigned personnel."
      />
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total personnel" value={total} />
        <KpiCard title="Permanent" value={sumBy("Permanent")} />
        <KpiCard title="Casual" value={sumBy("Casual")} />
        <KpiCard title="Job Order" value={sumBy("Job Order")} />
      </div>
      {parsed.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">
              Office of the Vice Presidents
            </h2>
            <CardGrid className="mt-4">
              {grouped.vicePresidents.map((group) => (
                <StaffCard
                  key={group.key}
                  title={group.title}
                  campus={group.campus}
                  total={group.total}
                  counts={group.counts}
                />
              ))}
            </CardGrid>
          </section>
          {grouped.departments.map((department) => {
            const leafOffices = department.offices.filter((office) => office.units.length === 0);
            const officesWithUnits = department.offices.filter((office) => office.units.length > 0);
            const isAcademicDelivery = department.title === ACADEMIC_DELIVERY_DEPARTMENT;
            const leafGroups = isAcademicDelivery ? partitionAcademicDeliveryOffices(leafOffices) : null;
            return (
              <section key={department.title}>
                <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">{department.title}</h2>
                {leafGroups ? (
                  <>
                    {leafGroups.goa.length ? (
                      <div className="mt-4">
                        <p className="section-kicker">{GOA_CAMPUS_LABEL}</p>
                        <CardGrid className="mt-3">
                          {leafGroups.goa.map((group) => (
                            <OfficeCard key={group.key} group={group} />
                          ))}
                        </CardGrid>
                      </div>
                    ) : null}
                    {leafGroups.other.length ? (
                      <CardGrid className={leafGroups.goa.length ? "mt-6" : "mt-4"}>
                        {leafGroups.other.map((group) => (
                          <OfficeCard key={group.key} group={group} />
                        ))}
                      </CardGrid>
                    ) : null}
                  </>
                ) : leafOffices.length ? (
                  <CardGrid className="mt-4">
                    {leafOffices.map((group) => (
                      <OfficeCard key={group.key} group={group} />
                    ))}
                  </CardGrid>
                ) : null}
                {officesWithUnits.map((group) => (
                  <div key={group.key} className={leafOffices.length ? "mt-6" : "mt-4"}>
                    <CardGrid>
                      <StaffCard
                        title={group.title}
                        kicker="Office / Division"
                        campus={group.campus}
                        total={group.total}
                        counts={group.counts}
                      />
                      {group.units.map((unit) => (
                        <StaffCard
                          key={unit.unit}
                          title={unit.unit ?? "Unit"}
                          kicker="Unit"
                          campus={unit.campus}
                          total={unit.total ?? 0}
                          counts={unit.counts}
                        />
                      ))}
                    </CardGrid>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

function OfficeCard({ group }: { group: StaffOfficeGroup }) {
  return <StaffCard title={group.title} campus={group.campus} total={group.total} counts={group.counts} />;
}

function StaffCard({
  title,
  kicker,
  campus,
  total,
  counts,
}: {
  title: string;
  kicker?: string;
  campus: string;
  total: number;
  counts: { appointment?: Record<string, number> };
}) {
  return (
    <article className="card flex h-full min-h-[13.5rem] flex-col p-5">
      <p className={cn("min-h-[1rem]", kicker && "section-kicker")} aria-hidden={!kicker}>
        {kicker ?? "\u00a0"}
      </p>
      <h3 className="mt-2 text-sm font-semibold leading-snug tracking-tight text-navy-900">
        <span className="line-clamp-3 min-h-[3.75rem]">{title}</span>
      </h3>
      <p className="mt-1 min-h-[1rem] text-xs text-muted-foreground">
        {campus !== "Central / unspecified" ? campus : "\u00a0"}
      </p>
      <p className="font-display mt-4 text-3xl font-bold tabular-nums tracking-tight text-navy-900">
        {formatNumber(total)}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{appointmentMixNote(counts)}</p>
    </article>
  );
}
