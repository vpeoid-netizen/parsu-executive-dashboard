import { describe, expect, it } from "vitest";
import { extractGeminiText, toGeminiContents } from "../src/lib/chat/complete";

describe("Gemini chat payload", () => {
  it("maps assistant turns to Gemini model roles and merges consecutive speakers", () => {
    expect(
      toGeminiContents([
        { role: "user", content: "How many campuses?" },
        { role: "assistant", content: "Seven." },
        { role: "user", content: "Name them." },
      ]),
    ).toEqual([
      { role: "user", parts: [{ text: "How many campuses?" }] },
      { role: "model", parts: [{ text: "Seven." }] },
      { role: "user", parts: [{ text: "Name them." }] },
    ]);
  });

  it("starts with a user turn when history begins with the assistant", () => {
    const contents = toGeminiContents([{ role: "assistant", content: "Hello." }]);
    expect(contents[0]?.role).toBe("user");
    expect(contents[1]).toEqual({ role: "model", parts: [{ text: "Hello." }] });
  });

  it("reads Gemini text parts and skips thought parts", () => {
    expect(
      extractGeminiText({
        candidates: [
          {
            content: {
              parts: [{ thought: true, text: "reasoning" }, { text: "ParSU has 7 campuses." }],
            },
          },
        ],
      }),
    ).toBe("ParSU has 7 campuses.");
  });
});
