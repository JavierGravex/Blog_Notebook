import SiteHeader from "@/components/site-header";
import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";
import EditPostForm from "@/components/edit-post-form";
import { notFound } from "next/navigation";

type AdminEditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditPostPage({
  params,
}: AdminEditPostPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClientReadOnly();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, content_md, status, published_at, cover_image_url"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Edit post</h1>
        </header>
        <EditPostForm post={data} />
      </div>
    </div>
  );
}
