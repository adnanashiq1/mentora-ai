import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProjectBySlug, saveProjectSubmission, checkRateLimit } from "@/lib/db";

async function runCode(code: string): Promise<{ stdout: string; stderr: string; compileOutput: string }> {
  const res = await fetch(
    "https://ce.judge0.com/submissions?base64_encoded=true&wait=true",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: Buffer.from(code, "utf-8").toString("base64"),
        language_id: 51, // C# (Mono)
      }),
    }
  );

  if (!res.ok) {
    return { stdout: "", stderr: "Execution service unavailable.", compileOutput: "" };
  }

  const result = await res.json();
  const decode = (s: string | null) => (s ? Buffer.from(s, "base64").toString("utf-8") : "");

  return {
    stdout: decode(result.stdout),
    stderr: decode(result.stderr),
    compileOutput: decode(result.compile_output),
  };
}

async function reviewWithAI(
  description: string,
  requirements: string[],
  code: string,
  execution: { stdout: string; stderr: string; compileOutput: string }
): Promise<{ meetsRequirements: boolean; feedback: string }> {
  const prompt = `You are reviewing a student's C# project submission. Be encouraging but honest - this is coaching feedback, not a pass/fail exam.

Project: ${description}

Requirements:
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Student's code:
\`\`\`csharp
${code}
\`\`\`

What happened when it was compiled and run:
Compile output: ${execution.compileOutput || "(none)"}
Stdout: ${execution.stdout || "(none)"}
Stderr: ${execution.stderr || "(none)"}

Respond with ONLY valid JSON, no other text, in this exact shape:
{"meetsRequirements": true or false, "feedback": "2-4 sentences of specific, constructive feedback - what's working, what's missing or could be improved, referencing the actual requirements above"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    }
  );

  if (!res.ok) {
    return { meetsRequirements: false, feedback: "Couldn't get feedback right now - try submitting again." };
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      meetsRequirements: !!parsed.meetsRequirements,
      feedback: parsed.feedback ?? "No feedback generated.",
    };
  } catch {
    return { meetsRequirements: false, feedback: "Couldn't parse feedback - try submitting again." };
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const allowed = await checkRateLimit(userId, "project-submit", 10, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "You're submitting a bit fast - please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const { projectSlug, code }: { projectSlug: string; code: string } = await req.json();
  if (!projectSlug || !code) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const project = await getProjectBySlug(projectSlug);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const execution = await runCode(code);
  const { meetsRequirements, feedback } = await reviewWithAI(
    project.description,
    project.requirements,
    code,
    execution
  );

  await saveProjectSubmission({
    userId,
    projectSlug,
    code,
    meetsRequirements,
    feedback,
  });

  return NextResponse.json({ meetsRequirements, feedback, execution });
}
