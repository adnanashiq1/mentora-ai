import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await currentUser();
  const name = user?.firstName || "there";

  const { messages }: { messages: ChatMessage[] } = await req.json();

  const systemPrompt = `You are conducting a mock technical interview for a junior/mid-level C# developer role. The candidate's name is ${name}.

Rules:
- Behave like a real, professional interviewer - not a tutor. No hand-holding, no analogies to make things easier. Be warm but rigorous, the way a good real interviewer is.
- Ask ONE question at a time and wait for the candidate's answer before continuing.
- Cover a mix of topics across a full C# fundamentals-to-intermediate interview: variables/types, OOP (classes, inheritance, polymorphism, interfaces), collections, LINQ, exception handling, and async/await. Vary the difficulty across the conversation.
- Occasionally ask the candidate to write a short code snippet directly in their answer (as plain text) rather than only asking definitional questions.
- After each answer, give brief, honest feedback (a sentence or two) before moving to the next question - correct any misconceptions clearly but kindly.
- After roughly 8-10 questions, or if the candidate says they want to stop, give a short overall assessment: genuine strengths, specific areas to improve, and how they'd likely come across in a real interview. Be honest, not just encouraging - false confidence doesn't help someone prepare.
- If this is the very first message in the conversation, start by briefly explaining how the mock interview will work, then ask the first question.`;

  const contents = messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = "gemini-2.5-flash";
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
      }),
    }
  );

  if (!geminiRes.ok || !geminiRes.body) {
    const errText = await geminiRes.text().catch(() => "");
    console.error("Gemini API error:", errText);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = geminiRes.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) controller.enqueue(encoder.encode(text));
          } catch {
            // Ignore malformed SSE lines (e.g. keep-alive pings)
          }
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
