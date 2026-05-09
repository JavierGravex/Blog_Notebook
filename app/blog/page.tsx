import Image from "next/image";
import Link from "next/link";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";
import type { Post } from "@/types";

export const dynamic = "force-dynamic";

type BlogIndexPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const { page } = await searchParams;
  const pageSize = 10;
  const pageNumber = Math.max(1, Number(page ?? "1") || 1);
  const from = (pageNumber - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createSupabaseServerClientReadOnly();
  const { data, error, count } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, published_at, cover_image_url", {
      count: "exact",
    })
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  const posts = (data ?? []) as Pick<
    Post,
    "id" | "title" | "slug" | "excerpt" | "published_at" | "cover_image_url"
  >[];

  const total = count ?? 0;
  const hasNext = from + posts.length < total;
  const hasPrev = pageNumber > 1;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
          <p className="text-muted">Published posts</p>
        </header>

        {error ? <p className="text-sm text-red-600">{error.message}</p> : null}

        <main className="flex flex-col gap-3">
          {posts.length === 0 ? (
            <p className="text-muted">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-md border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="font-medium">
                        <Link className="underline" href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>
                      {post.published_at ? (
                        <time className="text-xs text-muted">
                          {new Date(post.published_at).toLocaleDateString()}
                        </time>
                      ) : null}
                    </div>
                    {post.excerpt ? (
                      <p className="mt-2 text-muted">{post.excerpt}</p>
                    ) : null}
                  </div>

                  {post.cover_image_url ? (
                    <Image
                      src={post.cover_image_url}
                      alt=""
                      width={96}
                      height={96}
                      className="h-20 w-20 shrink-0 rounded-md border border-border object-cover"
                    />
                  ) : null}
                </div>
              </article>
            ))
          )}
        </main>

        <nav className="flex items-center justify-between">
          {hasPrev ? (
            <Link className="text-sm underline" href={`/blog?page=${pageNumber - 1}`}>
              Newer
            </Link>
          ) : (
            <span />
          )}

          {hasNext ? (
            <Link className="text-sm underline" href={`/blog?page=${pageNumber + 1}`}>
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
      <SiteFooter />
    </div>
  );
}
