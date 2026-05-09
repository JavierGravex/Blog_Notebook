"use client";

import { useEffect, useMemo } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function PostViewTracker({ postId }: { postId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    const referrer = document.referrer || null;
    supabase.from("post_views").insert({ post_id: postId, referrer });
  }, [postId, supabase]);

  return null;
}

