import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getExamQuestionsWithAnswers,
  getExamCodingQuestions,
  completeExamAttempt,
  computeOverallPercentage,
  computeExamPass,
  getOrCreateCertificateCode,
} from "@/lib/db";

type McqSubmission = { questionId: number; selectedIndex: number };
type CodingSubmission = { codingQuestionId: number; code: string };

const JUDGE0_URL = "https://ce.judge0.com/submissions?base64_encoded=true&wait=true";
const CSHARP_LANGUAGE_ID = 51;

function toBase64(str: string) {
  return Buffer.from(str, "utf-8").toString("base64");
}
function fromBase64(str: string | null): string {
  if (!str) return "";
  return Buffer.from(str, "base64").toString("utf-8");
}

async function runCode(code: string): Promise<{ stdout: string; stderr: string; compileOutput: string }> {
  try {
    const res = await fetch(JUDGE0_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_code: toBase64(code), language_id: CSHARP_LANGUAGE_ID }),
    });
    if (!res.ok) return { stdout: "", stderr: "Execution service unavailable.", compileOutput: "" };
    const result = await res.json();
    return {
      stdout: fromBase64(result.stdout),
      stderr: fromBase64(result.stderr),
      compileOutput: fromBase64(result.compile_output),
    };
  } catch {
    return { stdout: "", stderr: "Execution service unavailable.", compileOutput: "" };
  }
}

async function gradeWithAI(prompt: string, code: string, execution: { stdout: string; stderr: string; compileOutput: string }): Promise<{ score: number; feedback: string }> {
  const systemPrompt = `You are a strict but fair C# instructor grading a student's exam answer.

Problem given to the student:
${prompt}

The student's submitted code:
${code}

What actually happened when the code was run:
STDOUT: ${execution.stdout || "(none)"}
STDERR: ${execution.stderr || "(none)"}
COMPILE OUTPUT: ${execution.compileOutput || "(none)"}

Grade this 0-100 based on correctness against the problem statement, and whether it actually compiles and runs correctly. A non-compiling submission should score very low. Reward correct logic even with minor style issues.

Respond with ONLY a JSON object, no markdown fences, no other text, in exactly this shape:
{"score": <integer 0-100>, "feedback": "<one sentence of feedback>"}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        }),
      }
    );
    if (!res.ok) return { score: 0, feedback: "Grading service unavailable." };
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    return { score, feedback: String(parsed.feedback ?? "") };
  } catch {
    return { score: 0, feedback: "Could not parse grading result." };
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await currentUser();
  const displayName = user?.firstName || user?.username || "Student";

  const {
    attemptId,
    mcqAnswers,
    codingAnswers,
    flagged,
  }: {
    attemptId: number;
    mcqAnswers: McqSubmission[];
    codingAnswers: CodingSubmission[];
    flagged: boolean;
  } = await req.json();

  if (!attemptId || !Array.isArray(mcqAnswers) || mcqAnswers.length === 0) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  // Grade MCQ section server-side
  const ids = mcqAnswers.map((a) => a.questionId);
  const questions = await getExamQuestionsWithAnswers(ids);
  let mcqScore = 0;
  for (const a of mcqAnswers) {
    const q = questions.find((q) => q.id === a.questionId);
    if (q && q.correct_index === a.selectedIndex) mcqScore += 1;
  }
  const mcqTotal = mcqAnswers.length;

  // Grade coding section: run each submission, then have the AI score it
  // against the original problem and what actually happened when it ran.
  const codingQuestions = await getExamCodingQuestions();
  let codingScoreTotal = 0;
  const codingResults = [];

  for (const submission of codingAnswers ?? []) {
    const question = codingQuestions.find((q) => q.id === submission.codingQuestionId);
    if (!question) continue;
    const execution = await runCode(submission.code);
    const graded = await gradeWithAI(question.prompt, submission.code, execution);
    codingScoreTotal += graded.score;
    codingResults.push({ codingQuestionId: question.id, ...graded });
  }

  const codingScore = codingResults.length > 0 ? codingScoreTotal / codingResults.length : 0;

  const overallPercentage = computeOverallPercentage(mcqScore, mcqTotal, codingScore);
  const passed = !flagged && computeExamPass(overallPercentage);

  // Finalize the attempt that was reserved when the exam started. This
  // fails if the attemptId doesn't belong to this user or was already
  // completed - preventing replay against someone else's reservation or
  // double-submitting the same one.
  const updated = await completeExamAttempt({
    attemptId,
    userId,
    mcqScore,
    mcqTotal,
    codingScore,
    overallPercentage,
    passed,
    flagged: !!flagged,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "This exam attempt could not be found or was already submitted." },
      { status: 409 }
    );
  }

  const verificationCode = passed
    ? await getOrCreateCertificateCode(userId, displayName)
    : null;

  return NextResponse.json({
    mcqScore,
    mcqTotal,
    codingScore,
    overallPercentage,
    passed,
    flagged: !!flagged,
    codingResults,
    verificationCode,
  });
}
