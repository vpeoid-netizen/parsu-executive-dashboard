import type { LucideIcon } from "lucide-react";
import { FileBarChart, FileText, Landmark, Scale, ScrollText, Shield, Stamp } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCUMENT_ICONS: Record<string, LucideIcon> = {
  "Administrative Orders": Stamp,
  "Strategic Plan": ScrollText,
  "Organizational Structure": Landmark,
  "Board Resolutions": Scale,
  Policies: Shield,
  Reports: FileBarChart,
  Other: FileText,
};

export function documentIcon(category: string | null | undefined): LucideIcon {
  return DOCUMENT_ICONS[category ?? ""] ?? FileText;
}

export function DocumentLink({
  title,
  category,
  href,
  meta,
  className,
}: {
  title: string;
  category?: string | null;
  href: string;
  meta?: string | null;
  className?: string;
}) {
  const Icon = documentIcon(category);
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-2xl text-navy-800 transition-colors hover:text-navy-950",
        className,
      )}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-navy-900 ring-1 ring-[rgba(247,185,24,0.4)]"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <span className="min-w-0">
        <span className="block font-medium leading-5 group-hover:underline">{title}</span>
        {meta ? <span className="mt-0.5 block text-sm text-muted-foreground">{meta}</span> : null}
      </span>
    </a>
  );
}
