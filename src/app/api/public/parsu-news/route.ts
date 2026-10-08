import { NextResponse } from "next/server";
import { fetchParsuNews, newsImageProxyPath } from "@/lib/parsu-news";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const items = (await fetchParsuNews()).map((item) => ({
      ...item,
      image: item.image ? newsImageProxyPath(item.image) : null,
    }));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
