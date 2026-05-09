import Link from "next/link";

import LoginForm from "@/components/login-form";
import SiteHeader from "@/components/site-header";
import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";
import type { Post } from "@/types";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-muted">Admin access is required to manage posts.</p>
          </header>
          <LoginForm redirectTo="/admin" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const { data: postsData } = await supabase
    .from("posts")
    .select("id, title, slug, status, created_at")
    .order("created_at", { ascending: false });

  const posts = (postsData ?? []) as Pick<
    Post,
    "id" | "title" | "slug" | "status" | "created_at"
  >[];

  const { data: viewsData } = await supabase
    .from("post_views")
    .select("post_id")
    .gte("created_at", sinceIso)
    .limit(5000);

  const viewCounts = new Map<string, number>();
  for (const view of viewsData ?? []) {
    const postId = (view as { post_id: string }).post_id;
    viewCounts.set(postId, (viewCounts.get(postId) ?? 0) + 1);
  }

  const ranked = posts
    .map((p) => ({ ...p, views: viewCounts.get(p.id) ?? 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            <p className="text-muted">Posts + analytics</p>
          </div>
          <Link className="rounded-md bg-black px-4 py-2 text-white" href="/admin/posts/new">
            New post
          </Link>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Top posts (30 days)</h2>
          {ranked.length === 0 ? (
            <p className="text-muted">No analytics yet.</p>
          ) : (
            ranked.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-md border border-border p-4"
              >
                <div className="flex flex-col">
                  <p className="font-medium">{row.title}</p>
                  <p className="text-sm text-muted">/{row.slug}</p>
                </div>
                <p className="text-sm">{row.views} views</p>
              </div>
            ))
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">All posts</h2>
          {posts.length === 0 ? (
            <p className="text-muted">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-md border border-border p-4"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted">/{post.slug}</p>
                    <div className="flex items-center gap-3">
                      <Link className="text-sm underline" href={`/admin/posts/${post.id}`}>
                        Edit
                      </Link>
                      <Link className="text-sm underline" href={`/blog/${post.slug}`}>
                        View
                      </Link>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{post.status}</p>
                    <p className="text-xs text-muted">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
