"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const body = (await response.json().catch(() => null)) as
      | { ok: boolean; message?: string }
      | null;

    if (!response.ok || !body?.ok) {
      setStatus("error");
      setMessage(body?.message ?? "Subscription failed.");
      return;
    }

    setStatus("success");
    setMessage(body.message ?? "Check your email to confirm.");
    setEmail("");
  }

  return (
    <section className="rounded-md border border-border p-4">
      <h2 className="text-lg font-semibold">Newsletter</h2>
      <p className="mt-1 text-sm text-muted">
        Get new notebook entries by email. Double opt-in.
      </p>
      <form className="mt-3 flex flex-col gap-2" onSubmit={submit}>
        <input
          className="rounded-md border border-border bg-background px-3 py-2"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button
          className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          type="submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Submitting…" : "Subscribe"}
        </button>
        {message ? (
          <p className={status === "error" ? "text-sm text-red-600" : "text-sm"}>
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
