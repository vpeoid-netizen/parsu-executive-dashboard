import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleHeader, NavCard } from "@/components/ui/primitives";

const cards = [
  { href: "/students/enrollment", title: "Enrollment", body: "Semestral headcount by college and program." },
  { href: "/students/licensure", title: "Licensure examinations", body: "First-time taker performance by program and year." },
  { href: "/students/awards", title: "Awards", body: "Student and team recognitions." },
];

export default function StudentsPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Students" }]} />
      <ModuleHeader title="Student Analytics" description="Enrollment, licensure examinations and awards." />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => (
          <NavCard
            key={card.href}
            href={card.href}
            title={card.title}
            description={card.body}
            accent={index % 2 === 0 ? "gold" : "navy"}
          />
        ))}
      </div>
    </div>
  );
}
