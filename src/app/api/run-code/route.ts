import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/db";

// C# (Mono 6.6.0.161) on Judge0 CE's public instance.
const CSHARP_LANGUAGE_ID = 51;
const JUDGE0_URL = "https://ce.judge0.com/submissions?base64_encoded=true&wait=true";

function toBase64(str: string) {
  return Buffer.from(str, "utf-8").toString("base64");
}

function fromBase64(str: string | null): string {
  if (!str) return "";
  return Buffer.from(str, "base64").toString("utf-8");
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const allowed = await checkRateLimit(userId, "run-code", 20, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "You're running code a bit fast - please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const { code, stdin }: { code: string; stdin?: string } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const body: Record<string, unknown> = {
    source_code: toBase64(code),
    language_id: CSHARP_LANGUAGE_ID,
  };
  if (stdin) {
    body.stdin = toBase64(stdin);
  }

  const judgeRes = await fetch(JUDGE0_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!judgeRes.ok) {
    const text = await judgeRes.text().catch(() => "");
    console.error("Judge0 error:", text);
    return NextResponse.json(
      { error: "Code execution service is unavailable right now. Try again shortly." },
      { status: 502 }
    );
  }

  const result = await judgeRes.json();

  return NextResponse.json({
    stdout: fromBase64(result.stdout),
    stderr: fromBase64(result.stderr),
    compileOutput: fromBase64(result.compile_output),
    status: result.status?.description ?? "Unknown",
  });
}
