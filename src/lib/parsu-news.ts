export type ParsuNewsItem = {
  title: string;
  href: string;
  publishedLabel: string | null;
  image: string | null;
  excerpt: string | null;
};

const SITE = "https://parsu.edu.ph";
export const NEWS_URLS = [
  `${SITE}/component/content/category/news`,
  `${SITE}/component/content/category/news?Itemid=0&start=10`,
  `${SITE}/component/content/category/news?Itemid=0&start=20`,
];

const NEWS_IMAGE_OVERRIDES: { match: string; image: string }[] = [
  {
    match: "parsu brings global expertise, local knowledge together",
    image: `${SITE}/images/2026/iccr/ICCR%208.jpg`,
  },
  {
    match: "parsu receives dual sikap recognition",
    image: `${SITE}/images/2026/September/sikap%202.jpg`,
  },
  {
    match: "parsu engages in ched-dap elite-phe",
    image: `${SITE}/images/2026/September/elite%201.jpg`,
  },
  {
    match: "parsu advances innovation protection through ip and patent",
    image: `${SITE}/images/2026/August/Aug5-7_Patent%201.jpg`,
  },
  {
    match: "parsu joins 3rd sucs executive forum",
    image: `${SITE}/images/2026/September/3rd%20SUCs%20Executive%20Forum/e6df656e-52b1-4758-b551-086564eee6e8.jpg`,
  },
  {
    match: "parsu elevate 2026 strengthens faculty capacity",
    image: `${SITE}/images/2026/July/elevate/elevate%2010.jpg`,
  },
];

function newsImageFor(title: string, fallback: string | null) {
  const key = title.normalize("NFKC").toLowerCase();
  const override = NEWS_IMAGE_OVERRIDES.find((row) => key.includes(row.match));
  return override?.image ?? fallback;
}

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
      image: newsImageFor(title, image ? absoluteUrl(image[1] ?? "") : null),
      excerpt,
    });
  }
  return items;
}

function newsKey(item: ParsuNewsItem) {
  try {
    return new URL(item.href).pathname;
  } catch {
    return item.href;
  }
}

export function mergeParsuNews(pages: ParsuNewsItem[][]) {
  const seen = new Set<string>();
  const items: ParsuNewsItem[] = [];
  for (const page of pages) {
    for (const item of page) {
      const key = newsKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  return items;
}

async function fetchNewsPage(url: string): Promise<ParsuNewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": "ParSU-Executive-Dashboard/1.0" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return [];
    return parseParsuNews(await response.text());
  } catch {
    return [];
  }
}

export async function fetchParsuNews(): Promise<ParsuNewsItem[]> {
  const pages = await Promise.all(NEWS_URLS.map(fetchNewsPage));
  return mergeParsuNews(pages);
}

export function newsImageProxyPath(imageUrl: string) {
  return `/api/public/parsu-news/image?u=${encodeURIComponent(imageUrl)}`;
}
