import { describe, expect, it } from "vitest";
import { answerFromFacts, rankFacts, type ChatFact } from "../src/lib/chat/facts";
import { staffFactsFromGrouped } from "../src/lib/chat/staff-facts";
import { groupStaffOffices } from "../src/lib/staff-offices";

const facts: ChatFact[] = [
  {
    id: "campuses",
    title: "Campuses",
    body: "ParSU has 7 campuses: Goa Campus; Caramoan Campus; Lagonoy Campus.",
    href: "/about/campuses",
    keywords: "campus campuses goa",
  },
  {
    id: "licensure",
    title: "Licensure Examination Performance",
    body: "FY 2026 value: 66.43%. Note: FY 2026 first-time takers, year-to-date as of June 30, 2026.",
    href: "/students/licensure",
    keywords: "board exam passing rate first-time takers",
  },
  {
    id: "employability",
    title: "Employability",
    body: "FY 2026 value: 25.99%. University performance employability indicator, FY 2026 (partial, as of June 30, 2026).",
    href: "/performance",
    keywords: "employed graduates jobs 2 years prior",
  },
];

describe("dashboard chat facts", () => {
  it("ranks licensure questions above campus facts", () => {
    const ranked = rankFacts("what is the licensure passing rate?", facts);
    expect(ranked[0]?.fact.id).toBe("licensure");
  });

  it("explains matching published figures without inventing extras", () => {
    const reply = answerFromFacts("How many campuses does ParSU have?", facts);
    expect(reply).toContain("7 campuses");
    expect(reply).toContain("/about/campuses");
    expect(reply).not.toMatch(/\bPARSU\b/);
    expect(reply.toLowerCase()).toContain("sure");
  });

  it("says when a figure is not in the briefing", () => {
    const reply = answerFromFacts("What is the president's private mobile number?", facts);
    expect(reply.toLowerCase()).toContain("published figure");
  });
});

describe("staff chat facts", () => {
  it("totals Executive Operations offices including nested units", () => {
    const grouped = groupStaffOffices([
      {
        department: "Executive Operations",
        office: "Legal Services",
        unit: null,
        campus: "Goa Campus",
        total: 4,
        counts: { appointment: { Permanent: 4 } },
      },
      {
        department: "Executive Operations",
        office: "Information and Communications Technology",
        unit: null,
        campus: "Goa Campus",
        total: 5,
        counts: { appointment: { Permanent: 4, Casual: 1 } },
      },
      {
        department: "Executive Operations",
        office: "Information and Communications Technology",
        unit: "Systems Unit",
        campus: "Goa Campus",
        total: 2,
        counts: { appointment: { "Job Order": 2 } },
      },
      {
        department: "Commission on Audit",
        office: "Commission on Audit",
        unit: null,
        campus: "Goa Campus",
        total: 19,
        counts: { appointment: { Permanent: 19 } },
      },
    ]);
    const staffFacts = staffFactsFromGrouped(grouped);
    const executive = staffFacts.find((fact) => fact.id === "ntp-department-executive-operations");
    expect(executive?.body).toContain("total 11");
    expect(executive?.body).toContain("Legal Services 4");
    expect(executive?.body).toContain("Systems Unit 2");
    const reply = answerFromFacts("How many personnel are there under the executive operations offices?", staffFacts);
    expect(reply).toContain("11");
    expect(reply.toLowerCase()).toContain("executive operations");
    expect(reply).not.toContain("19");
  });
});
