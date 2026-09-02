import { answerFromFacts, CHAT_SYSTEM_PROMPT, type ChatTurn } from "@/lib/chat/facts";
import { getChatCorpus } from "@/lib/chat/briefing";
import { normalizeParSuSpelling } from "@/lib/utils";

const MAX_USER_CHARS = 500;
const MAX_HISTORY = 8;
const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

type ChatMessage = { role: string; content: string };

type OpenAiProvider = {
  kind: "openai";
  url: string;
  key: string;
  model: string;
};

type GeminiProvider = {
  kind: "gemini";
  key: string;
  model: string;
};

type Provider = OpenAiProvider | GeminiProvider;

export type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

function geminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || "";
}

function geminiModel() {
  const explicit = process.env.GEMINI_MODEL?.trim();
  if (explicit) return explicit;
  const chat = process.env.CHAT_MODEL?.trim();
  if (chat && /gemini/i.test(chat)) return chat;
  return DEFAULT_GEMINI_MODEL;
}

function resolveProvider(): Provider | null {
  const geminiKey = geminiApiKey();
  if (geminiKey) {
    return { kind: "gemini", key: geminiKey, model: geminiModel() };
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return {
      kind: "openai",
      url: `${(process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`,
      key: openaiKey,
      model: process.env.CHAT_MODEL?.trim() || "gpt-4o-mini",
    };
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    return {
      kind: "openai",
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
      kind: "openai",
      url: "https://ai-gateway.vercel.sh/v1/chat/completions",
      key: gatewayKey,
      model: process.env.CHAT_MODEL?.trim() || "openai/gpt-4o-mini",
    };
  }

  return null;
}

export function toGeminiContents(history: ChatMessage[]): GeminiContent[] {
  const contents: GeminiContent[] = [];
  for (const turn of history) {
    const role = turn.role === "assistant" ? "model" : "user";
    const last = contents.at(-1);
    if (last && last.role === role) {
      last.parts[0].text += `\n\n${turn.content}`;
      continue;
    }
    contents.push({ role, parts: [{ text: turn.content }] });
  }
  if (contents[0]?.role === "model") {
    contents.unshift({ role: "user", parts: [{ text: "(conversation start)" }] });
  }
  return contents;
}

export function extractGeminiText(payload: unknown) {
  const data = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join("")
    .trim();
  if (!text) throw new Error("Empty Gemini completion");
  return text;
}

async function generateWithGemini(provider: GeminiProvider, history: ChatMessage[], systemInstruction: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(provider.model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": provider.key,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: toGeminiContents(history),
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 700,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Chat provider ${response.status}`);
  }
  return extractGeminiText(await response.json());
}

async function generateWithOpenAi(provider: OpenAiProvider, messages: ChatMessage[]) {
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

  const history = turns.slice(-MAX_HISTORY).map((turn) => ({
    role: turn.role,
    content: turn.role === "user" ? turn.content.slice(0, MAX_USER_CHARS) : turn.content.slice(0, 4000),
  }));
  const systemInstruction = `${CHAT_SYSTEM_PROMPT}\n\nDASHBOARD BRIEFING:\n${corpus.briefing}`;

  try {
    const text =
      provider.kind === "gemini"
        ? await generateWithGemini(provider, history, systemInstruction)
        : await generateWithOpenAi(provider, [{ role: "system", content: systemInstruction }, ...history]);
    return { reply: normalizeParSuSpelling(text), source: "ai" as const };
  } catch {
    return { reply: fallback, source: "briefing" as const };
  }
}

export { MAX_USER_CHARS };
