"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
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
      <TextField
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password"
      />

      {submitState.status === "error" && (
        <p role="alert" className="text-sm font-medium text-dusty-red-dark">
          {submitState.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitState.status === "submitting"}>
        {submitState.status === "submitting" ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
