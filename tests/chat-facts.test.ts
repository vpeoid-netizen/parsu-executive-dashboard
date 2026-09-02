import { describe, expect, it } from "vitest";
import { answerFromFacts, rankFacts, type ChatFact } from "../src/lib/chat/facts";

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
  });

  it("says when a figure is not in the briefing", () => {
    const reply = answerFromFacts("What is the president's private mobile number?", facts);
    expect(reply.toLowerCase()).toContain("do not have a published figure");
  });
});
