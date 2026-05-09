import Link from "next/link";

import SiteHeader from "@/components/site-header";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ConfirmPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function NewsletterConfirmPage({
  searchParams,
}: ConfirmPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
          <p className="text-zinc-600">Missing token.</p>
          <Link className="underline" href="/">
            Home
          </Link>
        </div>
      </div>
    );
  }

  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: confirmation } = await supabase
    .from("newsletter_confirmations")
    .select("id, subscriber_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  const now = new Date();

  const isValid =
    !!confirmation &&
    !confirmation.used_at &&
    new Date(confirmation.expires_at).getTime() > now.getTime();

  if (!isValid) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
          <p className="text-zinc-600">Try subscribing again.</p>
          <Link className="underline" href="/">
            Home
          </Link>
        </div>
      </div>
    );
  }

  await supabase
    .from("newsletter_confirmations")
    .update({ used_at: nowIso })
    .eq("id", confirmation.id);

  await supabase
    .from("newsletter_subscribers")
    .update({ status: "active", confirmed_at: nowIso })
    .eq("id", confirmation.subscriber_id);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">You’re subscribed</h1>
        <p className="text-zinc-600">Thanks for confirming your email.</p>
        <Link className="underline" href="/blog">
          Read the blog
        </Link>
      </div>
    </div>
  );
}
