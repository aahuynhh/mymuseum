"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { AuthTransition } from "@/components/auth/AuthTransition";
import { signIn } from "@/app/auth/actions";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitState({ status: "submitting" });

    const result = await signIn(email, password);
    // On success `signIn` redirects server-side and never resolves here --
    // the transition below stays on screen for that entire window, right
    // up until the browser navigates to /create.
    if (result?.error) {
      setSubmitState({ status: "error", message: result.error });
    }
  }

  return (
    <AnimatePresence mode="wait">
      {submitState.status === "submitting" ? (
        <AuthTransition key="submitting" title="Welcome to MyMuseum" subtitle="Preparing your space…" />
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-surface p-6 sm:p-8"
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

          <Button type="submit" size="lg">
            Sign in
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
