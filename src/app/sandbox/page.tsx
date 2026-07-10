"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import LogoMark from "@/components/LogoMark";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DEFAULT_CODE = `using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello, world!");
    }
}`;

function decodeStarterCode(param: string | null): string {
  if (!param) return DEFAULT_CODE;
  try {
    return decodeURIComponent(atob(param));
  } catch {
    return DEFAULT_CODE;
  }
}

// Scans for a WriteLine/Write prompt on the line right before a ReadLine
// call, so we can show the student what order to type their inputs in.
function detectPrompts(code: string): string[] {
  const lines = code.split("\n");
  const prompts: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("ReadLine()")) {
      const prevLine = lines[i - 1] ?? "";
      const match = prevLine.match(/Console\.Write(?:Line)?\(\s*"([^"]*)"/);
      prompts.push(match ? match[1] : `Input #${prompts.length + 1}`);
    }
  }
  return prompts;
}

function SandboxInner() {
  const searchParams = useSearchParams();
  const starter = decodeStarterCode(searchParams.get("code"));
  const backHref = searchParams.get("from") || "/dashboard";

  const [code, setCode] = useState(starter);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState<{
    stdout: string;
    stderr: string;
    compileOutput: string;
    status: string;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const detectedPrompts = useMemo(() => detectPrompts(code), [code]);

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
      if (res.ok) {
        setOutput(data);
      } else {
        setOutput({
          stdout: "",
          stderr: data.error ?? "Something went wrong.",
          compileOutput: "",
          status: "Error",
        });
      }
    } catch {
      setOutput({
        stdout: "",
        stderr: "Network error. Try again.",
        compileOutput: "",
        status: "Error",
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-chalk/10 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-chalk-dim hover:text-chalk"
          >
            <ArrowLeft size={18} />
            <span className="hidden text-sm sm:inline">Back</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-chalk-dim hover:text-chalk">
            Dashboard
          </Link>
        </div>
        <span className="flex items-center gap-2 font-hand text-2xl font-bold text-chalk">
          <LogoMark size={26} /> Code Sandbox
        </span>
        <button
          onClick={runCode}
          disabled={running}
          className="flex items-center gap-2 rounded-full bg-coral px-5 py-2 text-sm font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          <Play size={16} />
          {running ? "Running..." : "Run"}
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex-1 overflow-hidden rounded-xl border border-chalk/10">
            <Editor
              height="50vh"
              defaultLanguage="csharp"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-chalk-dim">
              Standard input (used by Console.ReadLine() — one value per line, in order)
            </label>
            {detectedPrompts.length > 0 && (
              <div className="rounded-lg border border-mustard/30 bg-mustard/10 p-2 text-xs text-mustard">
                This code asks for {detectedPrompts.length} input
                {detectedPrompts.length > 1 ? "s" : ""}, in this order:
                <ol className="ml-4 mt-1 list-decimal">
                  {detectedPrompts.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>
            )}
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={3}
              placeholder={"5\n10"}
              className="rounded-lg border border-chalk/15 bg-panel p-2 font-mono text-sm text-chalk placeholder:text-chalk-dim/60 focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-chalk/10 bg-panel p-4 font-mono text-sm">
          {!output && !running && (
            <p className="text-chalk-dim">Output will appear here after you run your code.</p>
          )}
          {running && <p className="text-chalk-dim">Compiling and running...</p>}
          {output && (
            <>
              <p className="mb-2 text-xs text-chalk-dim">{output.status}</p>
              {output.compileOutput && (
                <pre className="whitespace-pre-wrap text-coral">{output.compileOutput}</pre>
              )}
              {output.stdout && (
                <pre className="whitespace-pre-wrap text-chalk">{output.stdout}</pre>
              )}
              {output.stderr && (
                <pre className="whitespace-pre-wrap text-coral">{output.stderr}</pre>
              )}
              {!output.stdout && !output.stderr && !output.compileOutput && (
                <p className="text-chalk-dim">No output produced.</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense fallback={<p className="p-6 text-chalk-dim">Loading sandbox...</p>}>
      <SandboxInner />
    </Suspense>
  );
}
