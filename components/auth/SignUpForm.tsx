"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { signUp } from "@/app/auth/actions";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "success" };

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitState({ status: "submitting" });

    const result = await signUp(email, password);
    if (result?.error) {
      setSubmitState({ status: "error", message: result.error });
      return;
    }
    setSubmitState({ status: "success" });
  }

  if (submitState.status === "success") {
    return (
      <div className="rounded-[1.75rem] border border-border/70 bg-surface p-8 text-center shadow-warm-sm sm:p-12">
        <p className="font-display text-sm italic text-terracotta-dark">Almost there</p>
        <h2 className="mt-2 font-display text-2xl text-ink">Check your email</h2>
        <p className="mx-auto mt-3 max-w-sm text-ink-muted">
          We sent a confirmation link to <span className="text-ink">{email}</span>. Click it to
          finish creating your account, then come back and sign in.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-[1.75rem] border border-border/70 bg-surface p-6 shadow-warm-sm sm:p-8"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-canvas px-3 py-2.5 text-ink outline-none focus-visible:border-terracotta"
          placeholder="you@example.com"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Password</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-canvas px-3 py-2.5 text-ink outline-none focus-visible:border-terracotta"
          placeholder="At least 6 characters"
        />
      </label>

      {submitState.status === "error" && (
        <p role="alert" className="text-sm font-medium text-terracotta-dark">
          {submitState.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitState.status === "submitting"}>
        {submitState.status === "submitting" ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
