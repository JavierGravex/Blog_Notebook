"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Comment } from "@/types";

export default function CommentSection({
  postId,
  initialComments,
  isAdmin,
}: {
  postId: string;
  initialComments: Comment[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setIsSubmitting(true);

    const trimmedName = name.trim();
    const trimmedBody = body.trim();

    if (!trimmedName) {
      setIsSubmitting(false);
      setError("Name is required.");
      return;
    }

    if (!trimmedBody) {
      setIsSubmitting(false);
      setError("Comment is required.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user?.id ?? null,
      author_name: trimmedName,
      body: trimmedBody,
    });

    setIsSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName("");
    setBody("");
    router.refresh();
  }

  async function deleteComment(commentId: string) {
    const ok = confirm("Delete this comment?");
    if (!ok) return;

    setError(null);
    setDeletingId(commentId);

    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        <Link className="text-sm underline" href="/admin">
          Sign in
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <input
          className="rounded-md border border-border bg-background px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <textarea
          className="min-h-24 rounded-md border border-border bg-background p-3"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting}
          className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {isSubmitting ? "Posting…" : "Post comment"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {initialComments.length === 0 ? (
          <p className="text-zinc-600">No comments yet.</p>
        ) : (
          initialComments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-md border border-border p-3"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs text-muted">{comment.author_name}</p>
                {isAdmin ? (
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => deleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                  >
                    {deletingId === comment.id ? "Deleting…" : "Delete"}
                  </button>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap">{comment.body}</p>
              <p className="mt-2 text-xs text-muted">
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
