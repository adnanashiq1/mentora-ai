import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getExamStatus, startExamAttempt } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const status = await getExamStatus(userId);
  if (status.state !== "can_attempt") {
    return NextResponse.json(
      { error: "You are not currently eligible to start the exam." },
      { status: 403 }
    );
  }

  const user = await currentUser();
  const displayName = user?.firstName || user?.username || "Student";

  const attemptId = await startExamAttempt(userId, displayName);

  return NextResponse.json({ attemptId });
}
