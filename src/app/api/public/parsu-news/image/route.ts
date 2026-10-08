import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("u");
  if (!url) return new NextResponse("Missing image", { status: 400 });
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid image", { status: 400 });
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "parsu.edu.ph") {
    return new NextResponse("Invalid host", { status: 400 });
  }
  if (!parsed.pathname.startsWith("/images/")) {
    return new NextResponse("Invalid path", { status: 400 });
  }
  const upstream = await fetch(parsed, {
    headers: { "User-Agent": "ParSU-Executive-Dashboard/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Image not available", { status: 502 });
  }
  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
