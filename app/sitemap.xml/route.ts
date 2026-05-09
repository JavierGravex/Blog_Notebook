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
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: `${baseUrl}/` },
    { loc: `${baseUrl}/blog` },
  ];

  for (const row of data ?? []) {
    const slug = (row as { slug: string }).slug;
    const updatedAt = (row as { updated_at: string }).updated_at;
    urls.push({ loc: `${baseUrl}/blog/${slug}`, lastmod: updatedAt });
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls
      .map((u) => {
        const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
        return `<url><loc>${xmlEscape(u.loc)}</loc>${lastmod}</url>`;
      })
      .join("") +
    `</urlset>`;

  return new NextResponse(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
