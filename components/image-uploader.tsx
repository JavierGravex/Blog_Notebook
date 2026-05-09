"use client";

import { useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ImageUploader({
  onUploaded,
  label,
}: {
  onUploaded: (url: string) => void;
  label: string;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setIsUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsUploading(false);
      setError("Sign in required.");
      return;
    }

    const bucket = "post-images";
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setIsUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setIsUploading(false);
    onUploaded(data.publicUrl);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-md border border-border px-4 py-2 text-sm">
        <input
          type="file"
          accept="image/*"
          disabled={isUploading}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setLastFileName(file.name);
            void upload(file);
          }}
        />
        {isUploading ? "Uploading…" : label}
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {lastFileName ? <p className="text-sm text-muted">{lastFileName}</p> : null}
    </div>
  );
}
