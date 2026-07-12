import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getChapterBySlug } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Play } from "lucide-react";

// Splits code into top-level chunks by tracking curly-brace depth (not just
// blank lines - blank lines can appear naturally inside a class or method
// body too, which previously caused single classes to get torn apart).
// A chunk ends only when brace depth returns to 0 AND the line's actual
// code (ignoring any trailing "// comment") ends in ";" or "}".
function splitTopLevelChunks(code: string): string[] {
  const lines = code.split("\n");
  const chunks: string[] = [];
  let current: string[] = [];
  let depth = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (current.length === 0 && trimmed === "") continue;

    current.push(line);
    for (const ch of line) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }

    const codeOnly = trimmed.replace(/\/\/.*$/, "").trim();
    if (depth === 0 && (codeOnly.endsWith(";") || codeOnly.endsWith("}"))) {
      chunks.push(current.join("\n"));
      current = [];
    }
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks.map((c) => c.trim()).filter((c) => c !== "");
}

function isTypeDeclaration(chunk: string): boolean {
  return /^(abstract\s+)?(class|interface|struct|delegate)\s+\w/.test(chunk);
}

// Detects a loose method definition (e.g. "int Add(int a, int b) => a + b;")
// that isn't inside a class. This execution environment's C# compiler does
// NOT support local functions nested inside Main - such fragments must be
// hoisted into their own static method alongside Main instead.
function isMethodLike(chunk: string): boolean {
  const pattern =
    /^(?:(?:public|private|protected|internal|static|async)\s+)*[\w<>[\],\s]+?\s+\w+\s*\([^)]*\)\s*(=>|\{)/;
  return pattern.test(chunk);
}

function ensureStatic(chunk: string): string {
  return /^\s*static\b/.test(chunk) ? chunk : "static " + chunk;
}

function encodeForSandbox(code: string): string {
  if (code.includes("static void Main")) {
    // Already a complete, runnable program.
    return Buffer.from(encodeURIComponent(code)).toString("base64");
  }

  const chunks = splitTopLevelChunks(code);
  const typeChunks: string[] = [];
  const methodChunks: string[] = [];
  const statementChunks: string[] = [];

  for (const chunk of chunks) {
    if (isTypeDeclaration(chunk)) {
      typeChunks.push(chunk);
    } else if (isMethodLike(chunk)) {
      methodChunks.push(ensureStatic(chunk));
    } else {
      statementChunks.push(chunk);
    }
  }

  const parts: string[] = [
    "using System;",
    "using System.Collections.Generic;",
    "using System.Linq;",
    "using System.Threading.Tasks;",
    "using System.IO;",
    "",
  ];

  if (typeChunks.length > 0) {
    parts.push(typeChunks.join("\n\n"), "");
  }

  parts.push("class Program", "{", "    static void Main()", "    {");

  if (statementChunks.length > 0) {
    const statements = statementChunks.join("\n\n");
    parts.push(...statements.split("\n").map((line) => "        " + line));
  } else {
    parts.push(
      '        Console.WriteLine("Compiled successfully! Try creating an object and calling a method below.");'
    );
  }

  parts.push("    }");

  if (methodChunks.length > 0) {
    parts.push("");
    for (const m of methodChunks) {
      parts.push(...m.split("\n").map((line) => "    " + line));
      parts.push("");
    }
  }

  parts.push("}");

  return Buffer.from(encodeURIComponent(parts.join("\n"))).toString("base64");
}

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { slug } = await params;
  const chapter = await getChapterBySlug(slug);
  if (!chapter) notFound();

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/chapters" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">All chapters</span>
        </Link>
        <span className="font-hand text-xl font-bold text-chalk">
          Chapter {chapter.order_num}
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <h1 className="text-3xl font-bold text-chalk">{chapter.title}</h1>

        {chapter.sections.map((section, i) => (
          <div key={i} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-mustard">{section.heading}</h2>
            <p className="leading-relaxed text-chalk-dim">{section.body}</p>
            {section.code && (
              <>
                <pre className="overflow-x-auto rounded-xl border-l-4 border-coral bg-panel p-4 text-sm text-chalk font-mono">
                  <code>{section.code}</code>
                </pre>
                {section.runnable !== false && (
                  <Link
                    href={`/sandbox?code=${encodeForSandbox(section.code)}&from=${encodeURIComponent(`/chapters/${chapter.slug}`)}`}
                    className="flex w-fit items-center gap-1 text-xs text-chalk-dim underline hover:text-chalk"
                  >
                    <Play size={12} /> Try this code yourself
                  </Link>
                )}
              </>
            )}
          </div>
        ))}

        <div className="mt-4 flex gap-3">
          <Link
            href={`/chapters/${chapter.slug}/quiz`}
            className="flex w-fit items-center gap-2 rounded-full border border-chalk/20 px-6 py-3 text-sm font-medium text-chalk hover:bg-panel"
          >
            Take the quiz
          </Link>
          <Link
            href="/chat"
            className="flex w-fit items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            <MessageCircle size={16} />
            Discuss this chapter with Mentora
          </Link>
        </div>
      </main>
    </div>
  );
}
