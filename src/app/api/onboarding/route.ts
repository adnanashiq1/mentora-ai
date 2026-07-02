import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveProfile } from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { interests, background, learning_goal, analogy_domain } = body;

  if (!interests || !background || !learning_goal || !analogy_domain) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  await saveProfile(userId, {
    interests,
    background,
    learning_goal,
    analogy_domain,
  });

  return NextResponse.json({ success: true });
}
