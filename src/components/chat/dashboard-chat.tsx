"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Send, X } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const ASSISTANT_IMAGE = "/chatbot-assistant.png";

const SUGGESTIONS = [
  "How many campuses does ParSU have?",
  "What is the licensure passing rate?",
  "Explain graduate employability",
  "How many academic programs are there?",
];

const WELCOME =
  "Hi! I can walk you through the published figures on this ParSU Executive Dashboard—campuses, programs, enrollment, licensure, personnel, and more. FY 2026 is year-to-date as of June 30, 2026. What would you like to know?";

function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-sm leading-6 [&_a]:font-semibold [&_a]:text-navy-800 [&_a]:underline [&_p]:text-inherit [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("/")) {
              return <Link href={href}>{children}</Link>;
            }
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

function AssistantPortrait({
  className,
  sizes,
}: {
  className?: string;
  sizes: string;
}) {
  return (
    <span className={cn("relative block overflow-hidden bg-navy-950", className)}>
      <Image src={ASSISTANT_IMAGE} alt="" fill sizes={sizes} className="object-contain" />
    </span>
  );
}

export function DashboardChat() {
  const titleId = useId();
  const errorId = useId();
  const inputId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending, open]);

  async function send(text: string) {
    const content = text.replace(/\s+/g, " ").trim();
    if (!content || pending) return;
    setError(null);
    setDraft("");
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.id !== "welcome")
            .map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "I could not answer just now. Please try again.");
      }
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: payload.reply! }]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "I could not answer just now. Please try again.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-40 flex flex-col items-end gap-3">
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="animate-fade-up pointer-events-auto flex w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_10px_28px_rgba(7,31,70,0.18)]"
          style={{ maxHeight: "min(32rem, calc(100dvh - 8rem))" }}
        >
          <header className="flex items-start gap-3 bg-navy-950 px-4 py-3 text-white">
            <AssistantPortrait className="mt-0.5 h-11 w-11 shrink-0 rounded-2xl ring-1 ring-gold" sizes="44px" />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-display text-base font-semibold tracking-tight">
                Ask ParSU
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-white/70">Happy to explain published dashboard figures</p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/10"
              aria-label="Close chat"
              onClick={() => {
                setOpen(false);
                toggleRef.current?.focus();
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background px-3 py-3" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-end gap-2", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" ? (
                  <AssistantPortrait className="h-9 w-9 shrink-0 rounded-2xl ring-1 ring-border" sizes="36px" />
                ) : null}
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-3 py-2",
                    message.role === "user" ? "bg-navy-900 text-white" : "bg-white text-foreground ring-1 ring-border",
                  )}
                >
                  {message.role === "assistant" ? (
                    <ChatMarkdown content={message.content} />
                  ) : (
                    <p className="text-sm leading-6">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {pending ? (
              <div className="flex items-end gap-2">
                <AssistantPortrait className="h-9 w-9 shrink-0 rounded-2xl ring-1 ring-border" sizes="36px" />
                <p className="text-sm text-muted-foreground">One moment—checking the published figures…</p>
              </div>
            ) : null}
          </div>

          {messages.length === 1 ? (
            <div className="flex flex-wrap gap-2 border-t border-border bg-white px-3 py-3">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-full bg-muted px-3 py-2 text-left text-xs font-semibold text-navy-800 hover:bg-gold-soft"
                  onClick={() => void send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="border-t border-border bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              Question about dashboard data
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id={inputId}
                ref={inputRef}
                rows={2}
                maxLength={500}
                value={draft}
                disabled={pending}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={error ? true : undefined}
                placeholder="Ask me about a dashboard figure"
                className="field min-h-11 flex-1 resize-none py-2.5"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(draft);
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-gold h-11 w-11 shrink-0 px-0"
                disabled={pending || !draft.trim()}
                aria-label="Send question"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {error ? (
              <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            ) : (
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                I’ll stick to published dashboard figures. FY 2026 is as of June 30, 2026.
              </p>
            )}
          </form>
        </section>
      ) : null}

      <button
        ref={toggleRef}
        type="button"
        className="pointer-events-auto relative h-24 w-24 overflow-hidden rounded-[1.75rem] bg-navy-950 shadow-[0_8px_20px_rgba(7,31,70,0.28)] ring-2 ring-gold hover:ring-gold-dark sm:h-28 sm:w-28"
        aria-label={open ? "Close dashboard chat" : "Ask about dashboard data"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <AssistantPortrait className="h-full w-full" sizes="112px" />
        {open ? (
          <span className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 text-white ring-1 ring-gold">
            <X className="h-4 w-4" />
          </span>
        ) : null}
      </button>
    </div>
  );
}
