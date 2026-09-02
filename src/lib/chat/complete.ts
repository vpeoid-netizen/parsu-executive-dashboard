import { answerFromFacts, CHAT_SYSTEM_PROMPT, type ChatTurn } from "@/lib/chat/facts";
import { getChatCorpus } from "@/lib/chat/briefing";
import { normalizeParSuSpelling } from "@/lib/utils";

const MAX_USER_CHARS = 500;
const MAX_HISTORY = 8;

type Provider = {
  url: string;
  key: string;
  model: string;
};

function resolveProvider(): Provider | null {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      url: `${(process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`,
      key: openaiKey,
      model: process.env.CHAT_MODEL?.trim() || "gpt-4o-mini",
    };
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: groqKey,
      model: process.env.CHAT_MODEL?.trim() || "llama-3.1-8b-instant",
    };
  }

  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    (process.env.VERCEL ? process.env.VERCEL_OIDC_TOKEN?.trim() : undefined);
  if (gatewayKey) {
    return {
      url: "https://ai-gateway.vercel.sh/v1/chat/completions",
      key: gatewayKey,
      model: process.env.CHAT_MODEL?.trim() || "openai/gpt-4o-mini",
    };
  }

  return null;
}

async function generateWithProvider(provider: Provider, messages: { role: string; content: string }[]) {
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      max_tokens: 700,
      messages,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Chat provider ${response.status}`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty chat completion");
  return text;
}

export async function completeDashboardChat(turns: ChatTurn[]) {
  const question = turns.at(-1)?.content?.trim() ?? "";
  const corpus = await getChatCorpus();
  const fallback = answerFromFacts(question, corpus.facts);

  const provider = resolveProvider();
  if (!provider || !question) {
    return { reply: fallback, source: "briefing" as const };
  }

  const history = turns
    .slice(-MAX_HISTORY)
    .map((turn) => ({
      role: turn.role,
      content: turn.role === "user" ? turn.content.slice(0, MAX_USER_CHARS) : turn.content.slice(0, 4000),
    }));

  try {
    const text = await generateWithProvider(provider, [
      { role: "system", content: `${CHAT_SYSTEM_PROMPT}\n\nDASHBOARD BRIEFING:\n${corpus.briefing}` },
      ...history,
    ]);
    return { reply: normalizeParSuSpelling(text), source: "ai" as const };
  } catch {
    return { reply: fallback, source: "briefing" as const };
  }
}

export { MAX_USER_CHARS };
