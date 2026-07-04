"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import type { QuizQuestion } from "@/lib/db";

type Feedback = {
  questionId: number;
  correct: boolean;
  correctIndex: number;
  pointsAwarded: number;
};

type DisplayOption = { text: string; originalIndex: number };
type PreparedQuestion = QuizQuestion & { displayOptions: DisplayOption[] };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function QuizForm({
  chapterSlug,
  chapterTitle,
  questions,
}: {
  chapterSlug: string;
  chapterTitle: string;
  questions: QuizQuestion[];
}) {
  const [prepared, setPrepared] = useState<PreparedQuestion[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [hintsUsed, setHintsUsed] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    pointsEarned: number;
    totalPossible: number;
    feedback: Feedback[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const shuffledQuestions = shuffle(questions).map((q) => ({
      ...q,
      displayOptions: shuffle(
        q.options.map((text, originalIndex) => ({ text, originalIndex }))
      ),
    }));
    setPrepared(shuffledQuestions);
  }, [questions]);

  const allAnswered = useMemo(
    () => prepared?.every((q) => selected[q.id] !== undefined) ?? false,
    [prepared, selected]
  );

  if (!prepared) {
    return <p className="text-chalk-dim">Shuffling your quiz...</p>;
  }

  const q = prepared[current];
  const isLast = current === prepared.length - 1;

  async function handleSubmit() {
    setSubmitting(true);
    const answers = prepared!.map((q) => ({
      questionId: q.id,
      selectedIndex: selected[q.id],
      usedHint: !!hintsUsed[q.id],
    }));

    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterSlug, answers }),
    });

    const data = await res.json();
    if (res.ok) setResult(data);
    setSubmitting(false);
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-chalk/10 bg-panel px-6 py-8 text-center">
          <p className="font-hand text-4xl font-bold text-mustard">
            {result.score} / {result.total} correct
          </p>
          <p className="mt-1 text-lg text-coral">
            {result.pointsEarned} / {result.totalPossible} points
          </p>
          <p className="mt-2 text-chalk-dim">
            {result.score === result.total
              ? "Perfect score!"
              : "Good effort — review what you missed below."}
          </p>
        </div>

        {prepared.map((q) => {
          const fb = result.feedback.find((f) => f.questionId === q.id);
          return (
            <div key={q.id} className="flex flex-col gap-2">
              <p className="font-medium text-chalk">{q.question}</p>
              {q.displayOptions.map((opt, i) => {
                const isSelected = selected[q.id] === opt.originalIndex;
                const isCorrect = fb?.correctIndex === opt.originalIndex;
                let style = "border-chalk/10 text-chalk-dim";
                if (isCorrect) style = "border-mustard bg-mustard/10 text-chalk";
                else if (isSelected && !isCorrect) style = "border-coral bg-coral/10 text-chalk";
                return (
                  <div key={i} className={`rounded-lg border px-4 py-2 text-sm ${style}`}>
                    {opt.text}
                  </div>
                );
              })}
              <p className="text-xs text-chalk-dim">
                {fb?.pointsAwarded ?? 0} points{hintsUsed[q.id] ? " (hint used)" : ""}
              </p>
            </div>
          );
        })}

        <div className="flex gap-3">
          <Link
            href={`/chapters/${chapterSlug}`}
            className="w-fit rounded-full border border-chalk/20 px-6 py-3 text-sm font-medium text-chalk hover:bg-panel"
          >
            Back to chapter
          </Link>
          <Link
            href="/leaderboard"
            className="w-fit rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            View leaderboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-chalk">Quiz: {chapterTitle}</h1>
        <span className="text-sm text-chalk-dim">
          Question {current + 1} of {prepared.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-medium text-chalk">{q.question}</p>
        <div className="flex flex-col gap-2">
          {q.displayOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                setSelected((prev) => ({ ...prev, [q.id]: opt.originalIndex }))
              }
              className={`rounded-lg border px-4 py-2 text-left text-sm transition ${
                selected[q.id] === opt.originalIndex
                  ? "border-coral bg-coral/10 text-chalk"
                  : "border-chalk/15 text-chalk-dim hover:border-chalk/30"
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>

        {hintsUsed[q.id] ? (
          <p className="flex items-center gap-2 text-sm text-mustard">
            <Lightbulb size={14} /> {q.hint}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setHintsUsed((prev) => ({ ...prev, [q.id]: true }))}
            className="flex w-fit items-center gap-1 text-sm text-chalk-dim underline hover:text-chalk"
          >
            <Lightbulb size={14} /> Use a hint (costs half the points for this question)
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 rounded-full border border-chalk/20 px-5 py-2 text-sm text-chalk disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "Grading..." : "Submit quiz"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(prepared.length - 1, c + 1))}
            disabled={selected[q.id] === undefined}
            className="flex items-center gap-1 rounded-full bg-coral px-5 py-2 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
