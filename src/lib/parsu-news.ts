export type ParsuNewsItem = {
  title: string;
  href: string;
  publishedLabel: string | null;
  image: string | null;
  excerpt: string | null;
};

const NEWS_URL = "https://parsu.edu.ph/component/content/category/news";
const SITE = "https://parsu.edu.ph";

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ldquo;/gi, "“")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ).normalize("NFKC");
}

function absoluteUrl(href: string) {
  return new URL(href.replace(/&amp;/g, "&"), SITE).toString();
}

export function parseParsuNews(html: string): ParsuNewsItem[] {
  const blocks = html.split(/<div class="article-header">/i).slice(1);
  const items: ParsuNewsItem[] = [];
  for (const block of blocks) {
    const link = block.match(/<a href="([^"]+)"[^>]*>\s*([^<]+)/i);
    if (!link) continue;
    const title = stripTags(link[2] ?? "");
    if (!title) continue;
    const timeLabel = block.match(/<time[^>]*>\s*([^<]+)/i);
    const image = block.match(/<img[^>]+src="([^"]+)"/i);
    const excerptRaw =
      [...block.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((match) => stripTags(match[1] ?? ""))
        .find((text) => text.length > 40) ?? "";
    const excerpt = excerptRaw.length > 40 ? excerptRaw.slice(0, 280).replace(/\s+\S*$/, "") : null;
    items.push({
      title,
      href: absoluteUrl(link[1] ?? "/"),
      publishedLabel: timeLabel ? stripTags(timeLabel[1] ?? "") : null,
      image: image ? absoluteUrl(image[1] ?? "") : null,
      excerpt,
    });
  }
  return items;
}

export async function fetchParsuNews(): Promise<ParsuNewsItem[]> {
  const response = await fetch(NEWS_URL, {
    headers: { Accept: "text/html", "User-Agent": "ParSU-Executive-Dashboard/1.0" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) return [];
  const html = await response.text();
  return parseParsuNews(html);
}

export function newsImageProxyPath(imageUrl: string) {
  return `/api/public/parsu-news/image?u=${encodeURIComponent(imageUrl)}`;
}
