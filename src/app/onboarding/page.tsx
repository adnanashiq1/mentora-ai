"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [interests, setInterests] = useState("");
  const [background, setBackground] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [analogyDomain, setAnalogyDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests,
        background,
        learning_goal: learningGoal,
        analogy_domain: analogyDomain,
      }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="notebook-bg flex min-h-screen items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-lg flex-col gap-6"
      >
        <div className="text-center">
          <h1 className="font-hand text-3xl font-bold text-chalk">
            Let&apos;s get to know you
          </h1>
          <p className="mt-2 text-sm text-chalk-dim">
            This shapes every example Mentora uses to teach you — answer
            honestly, not aspirationally.
          </p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-chalk">
            What are you into? (hobbies, interests, things you follow)
          </span>
          <input
            required
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. cricket, cooking, mobile gaming"
            className="rounded-lg border border-chalk/15 bg-panel px-4 py-2 text-chalk placeholder:text-chalk-dim focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-chalk">
            What do you currently do? (job, studies, daily routine)
          </span>
          <input
            required
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="e.g. university student studying business"
            className="rounded-lg border border-chalk/15 bg-panel px-4 py-2 text-chalk placeholder:text-chalk-dim focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-chalk">
            Why are you learning C#?
          </span>
          <input
            required
            value={learningGoal}
            onChange={(e) => setLearningGoal(e.target.value)}
            placeholder="e.g. want to build games, need it for a job"
            className="rounded-lg border border-chalk/15 bg-panel px-4 py-2 text-chalk placeholder:text-chalk-dim focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-chalk">
            Pick ONE thing you understand really well — Mentora will use this
            as the main source for analogies
          </span>
          <input
            required
            value={analogyDomain}
            onChange={(e) => setAnalogyDomain(e.target.value)}
            placeholder="e.g. cricket, retail work, cooking"
            className="rounded-lg border border-chalk/15 bg-panel px-4 py-2 text-chalk placeholder:text-chalk-dim focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Start learning"}
        </button>
      </form>
    </div>
  );
}
