"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { AuthTransition } from "@/components/auth/AuthTransition";
import { signUp } from "@/app/auth/actions";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "success" };

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const;
const panelMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: EASE_OUT_SOFT },
};

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

  return (
    <AnimatePresence mode="wait">
      {submitState.status === "submitting" ? (
        <AuthTransition key="submitting" title="Creating your account" subtitle="Just a moment…" />
      ) : submitState.status === "success" ? (
        <motion.div key="success" {...panelMotion} className="rounded-2xl border border-border/70 bg-surface p-8 text-center">
          <p className="font-display text-sm italic text-terracotta-dark">Almost there</p>
          <h2 className="mt-2 font-heading text-2xl text-ink">Check your email</h2>
          <p className="mx-auto mt-3 max-w-sm text-ink-muted">
            We sent a confirmation link to <span className="text-ink">{email}</span>. Click it to
            finish creating your account, then come back and sign in.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          {...panelMotion}
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
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />

          {submitState.status === "error" && (
            <p role="alert" className="text-sm font-medium text-dusty-red-dark">
              {submitState.message}
            </p>
          )}

          <Button type="submit" size="lg">
            Create account
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
