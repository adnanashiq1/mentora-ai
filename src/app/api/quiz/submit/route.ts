import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getQuizQuestionsWithAnswers, saveQuizResult } from "@/lib/db";

type Submission = { questionId: number; selectedIndex: number; usedHint: boolean };

const POINTS_FULL = 10;
const POINTS_WITH_HINT = 5;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await currentUser();
  const displayName = user?.firstName || user?.username || "Student";

  const { chapterSlug, answers }: { chapterSlug: string; answers: Submission[] } =
    await req.json();

  if (!chapterSlug || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  // Always re-fetch correct answers server-side — never trust the client
  // to tell us what's correct or how many points it's worth.
  const ids = answers.map((a) => a.questionId);
  const questions = await getQuizQuestionsWithAnswers(ids);

  let score = 0;
  let pointsEarned = 0;
  const totalPossible = answers.length * POINTS_FULL;

  const feedback = answers.map((a) => {
    const q = questions.find((q) => q.id === a.questionId);
    const correct = q ? q.correct_index === a.selectedIndex : false;

    if (correct) {
      score += 1;
      pointsEarned += a.usedHint ? POINTS_WITH_HINT : POINTS_FULL;
    }

    return {
      questionId: a.questionId,
      correct,
      correctIndex: q?.correct_index ?? null,
      pointsAwarded: correct ? (a.usedHint ? POINTS_WITH_HINT : POINTS_FULL) : 0,
    };
  });

  const total = answers.length;
  await saveQuizResult(userId, chapterSlug, score, total, pointsEarned, totalPossible, displayName);

  return NextResponse.json({ score, total, pointsEarned, totalPossible, feedback });
}
