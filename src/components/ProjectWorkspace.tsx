"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Play, Send, CheckCircle2, XCircle } from "lucide-react";
import type { Project, ProjectSubmission } from "@/lib/db";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function ProjectWorkspace({
  project,
  initialSubmissions,
}: {
  project: Project;
  initialSubmissions: ProjectSubmission[];
}) {
  const [code, setCode] = useState(project.starter_code);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ meetsRequirements: boolean; feedback: string } | null>(
    null
  );
  const [submissions, setSubmissions] = useState(initialSubmissions);

  async function runCode() {
    setRunning(true);
    setOutput(null);
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, stdin }),
      });
      const data = await res.json();
      const text = res.ok
        ? [data.compileOutput, data.stdout, data.stderr].filter(Boolean).join("\n") || "No output."
        : data.error ?? "Something went wrong.";
      setOutput(text);
    } catch {
      setOutput("Network error.");
    } finally {
      setRunning(false);
    }
  }

  async function submitForFeedback() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug: project.slug, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setSubmissions((prev) => [
          {
            id: Date.now(),
            user_id: "",
            project_slug: project.slug,
            code,
            meets_requirements: data.meetsRequirements,
            feedback: data.feedback,
            submitted_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setResult({ meetsRequirements: false, feedback: data.error ?? "Something went wrong." });
      }
    } catch {
      setResult({ meetsRequirements: false, feedback: "Network error submitting your project." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-chalk">{project.title}</h1>
          <span className="rounded-full border border-chalk/20 px-2 py-0.5 text-xs text-chalk-dim">
            {project.difficulty}
          </span>
        </div>
        <p className="mt-1 text-sm text-chalk-dim">{project.description}</p>
      </div>

      <div className="rounded-xl border border-chalk/10 bg-panel p-4">
        <p className="mb-2 text-sm font-semibold text-chalk">Requirements</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-chalk-dim">
          {project.requirements.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-chalk/10">
          <Editor
            height="40vh"
            defaultLanguage="csharp"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{ fontSize: 14, minimap: { enabled: false } }}
          />
        </div>

        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={2}
          placeholder="Standard input, if your program reads any (one value per line)"
          className="rounded-lg border border-chalk/15 bg-panel p-2 font-mono text-sm text-chalk placeholder:text-chalk-dim/60 focus:outline-none focus:ring-2 focus:ring-coral"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={runCode}
            disabled={running}
            className="flex items-center gap-2 rounded-full border border-chalk/20 px-5 py-2 text-sm text-chalk disabled:opacity-50"
          >
            <Play size={16} /> {running ? "Running..." : "Run"}
          </button>
          <button
            type="button"
            onClick={submitForFeedback}
            disabled={submitting}
            className="flex items-center gap-2 rounded-full bg-coral px-5 py-2 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            <Send size={16} /> {submitting ? "Reviewing..." : "Submit for feedback"}
          </button>
        </div>

        {output && (
          <pre className="whitespace-pre-wrap rounded-lg border border-chalk/10 bg-panel p-3 font-mono text-xs text-chalk">
            {output}
          </pre>
        )}

        {result && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              result.meetsRequirements ? "border-mustard bg-mustard/10" : "border-coral bg-coral/10"
            }`}
          >
            {result.meetsRequirements ? (
              <CheckCircle2 className="mt-0.5 shrink-0 text-mustard" size={20} />
            ) : (
              <XCircle className="mt-0.5 shrink-0 text-coral" size={20} />
            )}
            <div>
              <p className="text-sm font-semibold text-chalk">
                {result.meetsRequirements ? "Looks like it meets the requirements!" : "Not quite there yet"}
              </p>
              <p className="mt-1 text-sm text-chalk-dim">{result.feedback}</p>
            </div>
          </div>
        )}
      </div>

      {submissions.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-chalk">Past submissions</p>
          <div className="flex flex-col gap-2">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-chalk/10 bg-panel px-4 py-2 text-sm"
              >
                <span className="text-chalk-dim">
                  {new Date(s.submitted_at).toLocaleString()}
                </span>
                {s.meets_requirements ? (
                  <span className="flex items-center gap-1 text-mustard">
                    <CheckCircle2 size={14} /> Met requirements
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-chalk-dim">
                    <XCircle size={14} /> Needs work
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
