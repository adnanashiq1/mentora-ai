import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfile } from "@/lib/db";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const profile = await getProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "No profile found" }, { status: 400 });
  }

  const { messages }: { messages: ChatMessage[] } = await req.json();

  const systemPrompt = `You are Mentora, a friendly, patient AI programming tutor teaching this student C#.

Student profile:
- Interests: ${profile.interests}
- Background: ${profile.background}
- Learning goal: ${profile.learning_goal}
- Primary analogy domain: ${profile.analogy_domain}

Rules:
- Explain every new concept using an analogy from their primary analogy domain (${profile.analogy_domain}) first, before giving the generic/textbook explanation.
- Keep explanations focused and conversational, not like a textbook wall of text.
- When showing code, use short, runnable C# snippets.
- If they seem confused, re-explain more simply using an even more concrete example from the same domain, don't just repeat yourself.
- Never invent facts about their interests or background beyond what they told you — ask if you need more detail.`;

  // Gemini uses "model" instead of "assistant", and wraps text in a "parts" array.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", errText);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }

  const data = await response.json();
  const reply =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Sorry, I couldn't generate a response.";

  return NextResponse.json({ reply });
}
