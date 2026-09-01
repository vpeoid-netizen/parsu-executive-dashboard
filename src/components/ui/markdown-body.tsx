"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownBody({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-muted-foreground">Data not yet available</p>;
  }
  return (
    <div className="max-w-3xl space-y-3 text-sm leading-7 text-foreground [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:text-muted-foreground [&_img]:mt-4 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-2xl">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
