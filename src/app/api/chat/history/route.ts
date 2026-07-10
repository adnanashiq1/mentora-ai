import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getChatHistory } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const messages = await getChatHistory(userId);
  return NextResponse.json({ messages });
}
