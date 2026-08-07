"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { signIn } from "@/app/auth/actions";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitState({ status: "submitting" });

    const result = await signIn(email, password);
    // On success `signIn` redirects server-side and never resolves here.
    if (result?.error) {
      setSubmitState({ status: "error", message: result.error });
    }
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-canvas px-3 py-2.5 text-ink outline-none focus-visible:border-terracotta"
          placeholder="Your password"
        />
      </label>

      {submitState.status === "error" && (
        <p role="alert" className="text-sm font-medium text-terracotta-dark">
          {submitState.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitState.status === "submitting"}>
        {submitState.status === "submitting" ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
