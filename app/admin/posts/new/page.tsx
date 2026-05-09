import SiteHeader from "@/components/site-header";
import NewPostForm from "@/components/new-post-form";

export default function NewPostPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
          <p className="text-zinc-600">Creates a row in the Supabase posts table.</p>
        </header>
        <NewPostForm />
      </div>
    </div>
  );
}

