"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import ImageUploader from "@/components/image-uploader";

type EditablePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  cover_image_url: string | null;
};

export default function EditPostForm({ post }: { post: EditablePost }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [contentMd, setContentMd] = useState(post.content_md);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    post.cover_image_url
  );
  const [status, setStatus] = useState(post.status);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSavedMessage(null);
    setIsSaving(true);

    const nowIso = new Date().toISOString();
    const publishedAt =
      status === "published" ? (post.published_at ?? nowIso) : null;

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        title,
        slug,
        excerpt: excerpt.trim() ? excerpt : null,
        content_md: contentMd,
        cover_image_url: coverImageUrl,
        status,
        published_at: publishedAt,
      })
      .eq("id", post.id);

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSavedMessage("Saved.");
    setTimeout(() => setSavedMessage(null), 2500);

    router.refresh();
  }

  async function deletePost() {
    const ok = confirm("Delete this post? This cannot be undone.");
    if (!ok) return;

    setError(null);
    setIsDeleting(true);

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id);

    setIsDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Link className="text-sm underline" href="/admin">
          Back to admin
        </Link>
        <Link className="text-sm underline" href={`/blog/${post.slug}`}>
          View
        </Link>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input
          className="rounded-md border px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Slug</span>
        <input
          className="rounded-md border px-3 py-2"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Excerpt</span>
        <textarea
          className="min-h-20 rounded-md border p-3"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Content (Markdown)</span>
        <textarea
          className="min-h-72 rounded-md border p-3 font-mono text-sm"
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Images</p>
        <ImageUploader
          label="Set cover image"
          onUploaded={(url) => setCoverImageUrl(url)}
        />
        <ImageUploader
          label="Insert image in content"
          onUploaded={(url) => setContentMd((prev) => `${prev}\n\n![](${url})\n`)}
        />
        {coverImageUrl ? (
          <p className="text-sm text-muted">Cover image set.</p>
        ) : null}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Status</span>
        <select
          className="rounded-md border px-3 py-2"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value === "published"
                ? "published"
                : e.target.value === "archived"
                  ? "archived"
                  : "draft"
            )
          }
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {savedMessage ? <p className="text-sm">{savedMessage}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>

        <button
          type="button"
          onClick={deletePost}
          disabled={isDeleting}
          className="w-fit rounded-md border px-4 py-2 disabled:opacity-60"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
