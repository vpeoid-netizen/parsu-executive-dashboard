import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleHeader, NavCard } from "@/components/ui/primitives";

const cards = [
  { href: "/personnel/faculty", title: "Faculty Members", body: "Rank, appointment, and educational background by college." },
  { href: "/personnel/non-teaching", title: "Non-Teaching Personnel", body: "Office, unit and appointment distribution." },
];

export default function PersonnelPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Personnel" }]} />
      <ModuleHeader title="Personnel" description="Faculty and non-teaching personnel statistics." />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => (
          <NavCard
            key={card.href}
            href={card.href}
            title={card.title}
            description={card.body}
            accent={index % 2 === 0 ? "navy" : "gold"}
          />
        ))}
      </div>
    </div>
  );
}
