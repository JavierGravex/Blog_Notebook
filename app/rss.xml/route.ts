import { NextResponse } from "next/server";

import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const supabase = await createSupabaseServerClientReadOnly();

  const { data } = await supabase
    .from("posts")
    .select("title, slug, excerpt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50);

  const items = (data ?? [])
    .map((row) => {
      const post = row as {
        title: string;
        slug: string;
        excerpt: string | null;
        published_at: string | null;
      };

      const link = `${baseUrl}/blog/${post.slug}`;
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString();
      const description = post.excerpt ? xmlEscape(post.excerpt) : "";

      return (
        `<item>` +
        `<title>${xmlEscape(post.title)}</title>` +
        `<link>${xmlEscape(link)}</link>` +
        `<guid>${xmlEscape(link)}</guid>` +
        `<pubDate>${xmlEscape(pubDate)}</pubDate>` +
        (description ? `<description>${description}</description>` : "") +
        `</item>`
      );
    })
    .join("");

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0"><channel>` +
    `<title>${xmlEscape("Cooper’s Notebook")}</title>` +
    `<link>${xmlEscape(`${baseUrl}/blog`)}</link>` +
    `<description>${xmlEscape("A personal blog in the voice of FBI Agent Dale Cooper.")}</description>` +
    items +
    `</channel></rss>`;

  return new NextResponse(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
