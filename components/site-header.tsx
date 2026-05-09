import Link from "next/link";

import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";

import ThemeToggle from "@/components/theme-toggle";

export default async function SiteHeader() {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  const isAdmin = profile?.role === "admin";

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <nav className="flex items-center gap-4">
          <Link href="/" className="font-semibold">
            Cooper’s Notebook
          </Link>
          <Link href="/blog" className="text-muted hover:text-foreground">
            Blog
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="text-muted hover:text-foreground">
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <form action="/auth/signout" method="post">
              <button className="text-sm underline" type="submit">
                Sign out
              </button>
            </form>
          ) : (
            <Link className="text-sm underline" href="/admin">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
