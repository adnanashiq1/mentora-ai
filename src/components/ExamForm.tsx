"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldAlert, Play } from "lucide-react";
import type { ExamQuestion, ExamCodingQuestion } from "@/lib/db";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Phase = "mcq" | "coding" | "submitting" | "result";

type CodingResult = { codingQuestionId: number; score: number; feedback: string };
type ExamResult = {
  mcqScore: number;
  mcqTotal: number;
  codingScore: number;
  overallPercentage: number;
  passed: boolean;
  flagged: boolean;
  codingResults: CodingResult[];
};

export default function ExamForm({
  questions,
  codingQuestions,
}: {
  questions: ExamQuestion[];
  codingQuestions: ExamCodingQuestion[];
}) {
  const [phase, setPhase] = useState<Phase>("mcq");
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqSelected, setMcqSelected] = useState<Record<number, number>>({});
  const [codingIndex, setCodingIndex] = useState(0);
  const [code, setCode] = useState<Record<number, string>>(() =>
    Object.fromEntries(codingQuestions.map((q) => [q.id, q.starter_code]))
  );
  const [runOutput, setRunOutput] = useState<Record<number, string>>({});
  const [running, setRunning] = useState(false);
  const [violations, setViolations] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState("");

  // Keep the latest state in refs so the visibility/blur handlers (added
  // once on mount) always see current answers when they trigger a forced
  // submit, without needing to re-bind listeners on every keystroke.
  const stateRef = useRef({ mcqSelected, code, phase });
  useEffect(() => {
    stateRef.current = { mcqSelected, code, phase };
  }, [mcqSelected, code, phase]);

  const submitExam = useCallback(async (isFlagged: boolean) => {
    setPhase("submitting");
    const { mcqSelected: mcq, code: currentCode } = stateRef.current;

    const mcqAnswers = questions
      .filter((q) => mcq[q.id] !== undefined)
      .map((q) => ({ questionId: q.id, selectedIndex: mcq[q.id] }));

    const codingAnswers = codingQuestions.map((q) => ({
      codingQuestionId: q.id,
      code: currentCode[q.id] ?? "",
    }));

    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcqAnswers, codingAnswers, flagged: isFlagged }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setPhase("result");
      } else {
        setError(data.error ?? "Something went wrong.");
        setPhase("mcq");
      }
    } catch {
      setError("Network error submitting your exam.");
      setPhase("mcq");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Anti-cheat: detect leaving the tab/window during an active attempt.
  useEffect(() => {
    function handleViolation() {
      if (stateRef.current.phase === "result" || stateRef.current.phase === "submitting") return;
      setViolations((v) => {
        const next = v + 1;
        if (next >= 2) {
          setFlagged(true);
          submitExam(true);
        }
        return next;
      });
    }

    function onVisibilityChange() {
      if (document.hidden) handleViolation();
    }
    function onBlur() {
      handleViolation();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [submitExam]);

  function blockClipboard(e: React.ClipboardEvent | React.MouseEvent) {
    e.preventDefault();
  }

  async function runCurrentCode() {
    const q = codingQuestions[codingIndex];
    setRunning(true);
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code[q.id] }),
      });
      const data = await res.json();
      const output = res.ok
        ? [data.compileOutput, data.stdout, data.stderr].filter(Boolean).join("\n") || "No output."
        : data.error ?? "Something went wrong.";
      setRunOutput((prev) => ({ ...prev, [q.id]: output }));
    } catch {
      setRunOutput((prev) => ({ ...prev, [q.id]: "Network error." }));
    } finally {
      setRunning(false);
    }
  }

  // --- RESULT PHASE ---
  if (phase === "result" && result) {
    return (
      <div className="flex flex-col gap-6">
        {result.flagged && (
          <div className="flex items-center gap-2 rounded-xl border border-coral bg-coral/10 px-4 py-3 text-sm text-coral">
            <ShieldAlert size={18} />
            This attempt was flagged for leaving the exam tab/window and was automatically
            submitted and recorded as a used attempt.
          </div>
        )}
        <div
          className={`rounded-2xl border px-6 py-8 text-center ${
            result.passed ? "border-mustard bg-mustard/10" : "border-coral bg-coral/10"
          }`}
        >
          <p className="font-hand text-4xl font-bold text-chalk">
            {result.overallPercentage.toFixed(1)}%
          </p>
          <p className={`mt-2 text-lg ${result.passed ? "text-mustard" : "text-coral"}`}>
            {result.passed ? "You passed! 🎉" : "Not a pass this time."}
          </p>
          <div className="mt-4 flex justify-center gap-8 text-sm text-chalk-dim">
            <span>MCQ: {result.mcqScore}/{result.mcqTotal} (60% weight)</span>
            <span>Coding: {result.codingScore.toFixed(0)}/100 (40% weight)</span>
          </div>
        </div>

        {result.codingResults.length > 0 && (
          <div className="flex flex-col gap-2">
            {result.codingResults.map((r, i) => (
              <div key={i} className="rounded-lg border border-chalk/10 bg-panel px-4 py-3 text-sm">
                <p className="text-chalk">
                  {codingQuestions.find((q) => q.id === r.codingQuestionId)?.title}: {r.score}/100
                </p>
                <p className="text-chalk-dim">{r.feedback}</p>
              </div>
            ))}
          </div>
        )}

        {result.passed ? (
          <a
            href="/api/certificate"
            className="w-fit rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Download your certificate
          </a>
        ) : (
          <p className="text-chalk-dim">
            Review the chapters and try again once you're eligible.
          </p>
        )}

        <Link
          href="/dashboard"
          className="w-fit rounded-full border border-chalk/20 px-6 py-3 text-sm font-medium text-chalk hover:bg-panel"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (phase === "submitting") {
    return <p className="text-chalk-dim">Grading your exam - this can take a moment for the coding section...</p>;
  }

  // --- MCQ PHASE ---
  if (phase === "mcq") {
    const q = questions[mcqIndex];
    const isLast = mcqIndex === questions.length - 1;
    const allAnswered = questions.every((q) => mcqSelected[q.id] !== undefined);

    return (
      <div
        onCopy={blockClipboard}
        onCut={blockClipboard}
        onContextMenu={blockClipboard}
        className="flex select-none flex-col gap-6"
      >
        {violations > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-coral bg-coral/10 px-4 py-3 text-sm text-coral">
            <ShieldAlert size={18} />
            You left the exam tab/window. One more time and this attempt will be ended
            automatically.
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-chalk">Final Exam - Multiple Choice</h1>
          <span className="text-sm text-chalk-dim">
            Question {mcqIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-medium text-chalk">{q.question}</p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMcqSelected((prev) => ({ ...prev, [q.id]: i }))}
                className={`rounded-lg border px-4 py-2 text-left text-sm transition ${
                  mcqSelected[q.id] === i
                    ? "border-coral bg-coral/10 text-chalk"
                    : "border-chalk/15 text-chalk-dim hover:border-chalk/30"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMcqIndex((c) => Math.max(0, c - 1))}
            disabled={mcqIndex === 0}
            className="flex items-center gap-1 rounded-full border border-chalk/20 px-5 py-2 text-sm text-chalk disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={() => setPhase("coding")}
              disabled={!allAnswered}
              className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
            >
              Continue to coding section
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMcqIndex((c) => Math.min(questions.length - 1, c + 1))}
              disabled={mcqSelected[q.id] === undefined}
              className="flex items-center gap-1 rounded-full bg-coral px-5 py-2 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- CODING PHASE ---
  const cq = codingQuestions[codingIndex];
  const isLastCoding = codingIndex === codingQuestions.length - 1;

  return (
    <div
      onCopy={blockClipboard}
      onCut={blockClipboard}
      onContextMenu={blockClipboard}
      className="flex flex-col gap-4"
    >
      {violations > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-coral bg-coral/10 px-4 py-3 text-sm text-coral">
          <ShieldAlert size={18} />
          You left the exam tab/window. One more time and this attempt will be ended
          automatically.
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-chalk">
          Coding Challenge {codingIndex + 1} of {codingQuestions.length}
        </h1>
        <span className="rounded-full bg-panel px-3 py-1 text-xs text-chalk-dim capitalize">
          {cq.difficulty}
        </span>
      </div>

      <p className="text-chalk-dim">{cq.prompt}</p>

      <div className="overflow-hidden rounded-xl border border-chalk/10">
        <Editor
          height="35vh"
          defaultLanguage="csharp"
          theme="vs-dark"
          value={code[cq.id]}
          onChange={(v) => setCode((prev) => ({ ...prev, [cq.id]: v ?? "" }))}
          options={{ fontSize: 14, minimap: { enabled: false } }}
          onMount={(editor, monaco) => {
            editor.onKeyDown((e: { ctrlKey: boolean; metaKey: boolean; keyCode: number; preventDefault: () => void; stopPropagation: () => void }) => {
              const isPaste = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV;
              if (isPaste) {
                e.preventDefault();
                e.stopPropagation();
              }
            });
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={runCurrentCode}
          disabled={running}
          className="flex items-center gap-2 rounded-full border border-chalk/20 px-5 py-2 text-sm text-chalk disabled:opacity-50"
        >
          <Play size={14} /> {running ? "Running..." : "Test run (not graded)"}
        </button>
      </div>

      {runOutput[cq.id] && (
        <pre className="whitespace-pre-wrap rounded-lg border border-chalk/10 bg-panel p-3 font-mono text-xs text-chalk-dim">
          {runOutput[cq.id]}
        </pre>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            codingIndex === 0 ? setPhase("mcq") : setCodingIndex((c) => c - 1)
          }
          className="flex items-center gap-1 rounded-full border border-chalk/20 px-5 py-2 text-sm text-chalk"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {isLastCoding ? (
          <button
            type="button"
            onClick={() => submitExam(false)}
            className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Submit final exam
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCodingIndex((c) => c + 1)}
            className="flex items-center gap-1 rounded-full bg-coral px-5 py-2 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
