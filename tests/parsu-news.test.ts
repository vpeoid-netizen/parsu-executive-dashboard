import { describe, expect, it } from "vitest";
import { mergeParsuNews, parseParsuNews } from "../src/lib/parsu-news";

const SAMPLE = `
<div class="article-header">
  <h2>
    <a href="/component/content/article/sample-news?catid=11">
      𝐏𝐚𝐫𝐒𝐔 𝐁𝐫𝐢𝐧𝐠𝐬 𝐆𝐥𝐨𝐛𝐚𝐥 𝐄𝐱𝐩𝐞𝐫𝐭𝐢𝐬𝐞
    </a>
  </h2>
  <span class="published">
    <time datetime="2026-10-03T05:38:39+00:00">03 October 2026</time>
  </span>
    <div class="article-introtext">
    <img src="/images/2026/iccr/ICCR%2010.jpg" />
    <p>Partido State University concluded the International Conference on Building Climate-Change Resilient Futures.</p>
  </div>
</div>
<div class="article-header">
  <h2>
    <a href="/component/content/article/second-story">Second Story Title Here For Excerpt</a>
  </h2>
  <time>29 September 2026</time>
  <div class="article-introtext">
    <div><img src="/images/2026/September/sikap%201.jpg" /></div>
    <p>Partido State University received two institutional recognitions at the SIKAP Recognition Rites held in Legazpi City.</p>
  </div>
</div>
`;

describe("ParSU news parser", () => {
  it("reads titles, dates, images, and article links from the category listing", () => {
    const items = parseParsuNews(SAMPLE);
    expect(items).toHaveLength(2);
    expect(items[0]?.title).toBe("ParSU Brings Global Expertise");
    expect(items[0]?.href).toContain("parsu.edu.ph/component/content/article/sample-news");
    expect(items[0]?.publishedLabel).toBe("03 October 2026");
    expect(items[0]?.image).toContain("/images/2026/iccr/ICCR%2010.jpg");
    expect(items[0]?.excerpt).toMatch(/International Conference/);
    expect(items[1]?.title).toBe("Second Story Title Here For Excerpt");
    expect(items[1]?.excerpt).toMatch(/SIKAP Recognition Rites/);
  });

  it("keeps unique articles when listing pages overlap", () => {
    const item = (title: string, slug: string, query = "") => ({
      title,
      href: `https://parsu.edu.ph/component/content/article/${slug}${query}`,
      publishedLabel: null,
      image: null,
      excerpt: null,
    });
    const merged = mergeParsuNews([
      [item("A", "a"), item("B", "b")],
      [item("B duplicate", "b", "?Itemid=0"), item("C", "c")],
    ]);
    expect(merged.map((entry) => entry.title)).toEqual(["A", "B", "C"]);
  });

  it("uses the selected background photo for named news stories", () => {
    const html = `
      <div class="article-header">
        <h2><a href="/component/content/article/climate">𝐏𝐚𝐫𝐒𝐔 𝐁𝐫𝐢𝐧𝐠𝐬 𝐆𝐥𝐨𝐛𝐚𝐥 𝐄𝐱𝐩𝐞𝐫𝐭𝐢𝐬𝐞, 𝐋𝐨𝐜𝐚𝐥 𝐊𝐧𝐨𝐰𝐥𝐞𝐝𝐠𝐞 𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫 𝐟𝐨𝐫 𝐂𝐥𝐢𝐦𝐚𝐭𝐞-𝐑𝐞𝐬𝐢𝐥𝐢𝐞𝐧𝐭 𝐅𝐮𝐭𝐮𝐫𝐞𝐬</a></h2>
        <img src="/images/2026/iccr/ICCR%2010.jpg" />
      </div>
      <div class="article-header">
        <h2><a href="/component/content/article/sikap">ParSU Receives Dual SIKAP Recognition, Scholar Delivers Doctorate-Level Testimonial</a></h2>
        <img src="/images/2026/September/sikap%201.jpg" />
      </div>
    `;
    const items = parseParsuNews(html);
    expect(items[0]?.image).toBe("https://parsu.edu.ph/images/2026/iccr/ICCR%208.jpg");
    expect(items[1]?.image).toBe("https://parsu.edu.ph/images/2026/September/sikap%202.jpg");
  });
});
