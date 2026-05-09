import { NextResponse } from "next/server";

import { createResendClient, getResendFromEmail } from "@/lib/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as {
    email?: string;
  };

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Enter a valid email." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing?.status === "active") {
    return NextResponse.json({ ok: true, message: "You’re already subscribed." });
  }

  const subscriberId = existing?.id;
  const { data: subscriberUpsert, error: upsertError } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      {
        id: subscriberId,
        email: normalizedEmail,
        status: "pending",
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (upsertError) {
    return NextResponse.json(
      { ok: false, message: upsertError.message },
      { status: 500 }
    );
  }

  const subscriberIdFinal = subscriberUpsert.id as string;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  const { data: confirmation, error: confirmationError } = await supabase
    .from("newsletter_confirmations")
    .insert({ subscriber_id: subscriberIdFinal, expires_at: expiresAt })
    .select("token")
    .single();

  if (confirmationError) {
    return NextResponse.json(
      { ok: false, message: confirmationError.message },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const origin = request.headers.get("origin") ?? url.origin;
  const confirmUrl = new URL("/newsletter/confirm", origin);
  confirmUrl.searchParams.set("token", String(confirmation.token));

  const { data: subscriberRow } = await supabase
    .from("newsletter_subscribers")
    .select("unsubscribe_token")
    .eq("id", subscriberIdFinal)
    .maybeSingle();

  const unsubscribeUrl = new URL("/newsletter/unsubscribe", origin);
  if (subscriberRow?.unsubscribe_token) {
    unsubscribeUrl.searchParams.set(
      "token",
      String(subscriberRow.unsubscribe_token)
    );
  }

  const resend = createResendClient();
  const fromEmail = getResendFromEmail();

  await resend.emails.send({
    from: fromEmail,
    to: normalizedEmail,
    subject: "Confirm your subscription",
    text: `Confirm your subscription: ${confirmUrl.toString()}\n\nUnsubscribe: ${unsubscribeUrl.toString()}`,
  });

  return NextResponse.json({ ok: true, message: "Check your email to confirm." });
}
