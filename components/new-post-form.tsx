"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import ImageUploader from "@/components/image-uploader";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewPostForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentMd, setContentMd] = useState("# New post\n\nWrite here…\n");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  async function createPost() {
    setShowValidation(true);
    setError(null);
    setIsSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setIsSaving(false);
      setError(userError.message);
      return;
    }

    if (!user) {
      setIsSaving(false);
      setError("You must be signed in.");
      return;
    }

    const nowIso = new Date().toISOString();
    const nextSlug = slug.trim() ? slugify(slug) : slugify(title);

    if (!title.trim()) {
      setIsSaving(false);
      setError("Title is required.");
      return;
    }

    if (!nextSlug) {
      setIsSaving(false);
      setError("Slug is required.");
      return;
    }

    const { error: insertError } = await supabase.from("posts").insert({
      author_id: user.id,
      title,
      slug: nextSlug,
      excerpt: excerpt.trim() ? excerpt : null,
      content_md: contentMd,
      cover_image_url: coverImageUrl,
      status,
      published_at: status === "published" ? nowIso : null,
    });

    setIsSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Link className="text-sm underline" href="/admin">
          Back to admin
        </Link>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input
          className="rounded-md border px-3 py-2"
          value={title}
          onChange={(e) => {
            const nextTitle = e.target.value;
            setTitle(nextTitle);
            if (!slug.trim()) {
              setSlug(slugify(nextTitle));
            }
          }}
          required
        />
        {showValidation && !title.trim() ? (
          <p className="text-sm text-red-600">Title is required.</p>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Slug</span>
        <input
          className="rounded-md border px-3 py-2"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        {showValidation && !slug.trim() ? (
          <p className="text-sm text-red-600">Slug is required.</p>
        ) : null}
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
            setStatus(e.target.value === "published" ? "published" : "draft")
          }
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={createPost}
        disabled={isSaving}
        className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {isSaving ? "Creating…" : "Create post"}
      </button>
    </div>
  );
}
