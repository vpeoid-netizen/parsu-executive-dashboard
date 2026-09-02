import { NextResponse } from "next/server";
import { z } from "zod";
import { completeDashboardChat, MAX_USER_CHARS } from "@/lib/chat/complete";
import { allowChatRequest } from "@/lib/chat/rate-limit";
import { requestIp } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ChatRequest = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1)
    .max(16),
});

export async function POST(request: Request) {
  const ip = await requestIp();
  if (!allowChatRequest(ip)) {
    return NextResponse.json({ error: "Too many questions. Please wait a moment and try again." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a question to ask about dashboard data." }, { status: 400 });
  }

  const parsed = ChatRequest.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Send a question to ask about dashboard data." }, { status: 400 });
  }

  const messages = parsed.data.messages
    .map((message) => ({
      role: message.role,
      content: message.content.replace(/\s+/g, " ").trim(),
    }))
    .filter((message) => message.content.length > 0);

  const last = messages.at(-1);
  if (!last || last.role !== "user") {
    return NextResponse.json({ error: "Send a question to ask about dashboard data." }, { status: 400 });
  }
  if (last.content.length > MAX_USER_CHARS) {
    return NextResponse.json(
      { error: `Keep questions under ${MAX_USER_CHARS} characters.` },
      { status: 400 },
    );
  }

  try {
    const { reply } = await completeDashboardChat(messages);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Dashboard data is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
}
