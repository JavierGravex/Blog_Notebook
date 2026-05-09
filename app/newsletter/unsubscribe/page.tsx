import Link from "next/link";

import SiteHeader from "@/components/site-header";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
          <p className="text-muted">Missing token.</p>
          <Link className="underline" href="/">
            Home
          </Link>
        </div>
      </div>
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: subscriber } = await supabase
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!subscriber) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
          <p className="text-muted">This unsubscribe link is not valid.</p>
          <Link className="underline" href="/">
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (subscriber.status !== "unsubscribed") {
    await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed" })
      .eq("id", subscriber.id);
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Unsubscribed</h1>
        <p className="text-muted">You won’t receive further emails.</p>
        <Link className="underline" href="/blog">
          Read the blog
        </Link>
      </div>
    </div>
  );
}

