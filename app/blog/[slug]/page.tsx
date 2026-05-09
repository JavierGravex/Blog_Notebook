import SiteHeader from "@/components/site-header";
import CommentSection from "@/components/comment-section";
import Markdown from "@/components/markdown";
import PostViewTracker from "@/components/post-view-tracker";
import SiteFooter from "@/components/site-footer";
import Image from "next/image";
import type { Metadata } from "next";
import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";
import type { Comment, Post } from "@/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClientReadOnly();
  const { data } = await supabase
    .from("posts")
    .select("title, excerpt, cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    return { title: "Post not found" };
  }

  const title = data.title as string;
  const description = (data.excerpt as string | null) ?? undefined;
  const images = data.cover_image_url ? [data.cover_image_url as string] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClientReadOnly();

  const { data: postData } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, content_md, published_at, cover_image_url"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!postData) {
    notFound();
  }

  const post = postData as Pick<
    Post,
    | "id"
    | "title"
    | "slug"
    | "excerpt"
    | "content_md"
    | "published_at"
    | "cover_image_url"
  >;

  const { data: commentData } = await supabase
    .from("comments")
    .select(
      "id, post_id, user_id, parent_id, author_name, body, status, created_at"
    )
    .eq("post_id", post.id)
    .eq("status", "visible")
    .order("created_at", { ascending: false });

  const comments = (commentData ?? []) as Comment[];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  const isAdmin = profile?.role === "admin";


  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
          {post.excerpt ? <p className="text-muted">{post.excerpt}</p> : null}
          {post.published_at ? (
            <time className="text-sm text-muted">
              {new Date(post.published_at).toLocaleDateString()}
            </time>
          ) : null}
        </header>

        <main className="prose max-w-none">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt=""
              width={1200}
              height={630}
              className="mb-6 w-full rounded-md border border-border"
            />
          ) : null}
          <Markdown content={post.content_md} />
        </main>

        <PostViewTracker postId={post.id} />

        <CommentSection
          postId={post.id}
          initialComments={comments}
          isAdmin={isAdmin}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
