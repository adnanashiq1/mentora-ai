import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/db";

type ChatMessage = { role: "user" | "assistant"; content: string };

const OPENING_TOPICS = [
  "variables and data types",
  "object-oriented programming - classes and inheritance",
  "collections like List<T> and Dictionary<TKey,TValue>",
  "LINQ",
  "exception handling",
  "async/await and asynchronous programming",
  "interfaces and polymorphism",
  "arrays and strings",
  "encapsulation and access modifiers",
  "delegates and events",
];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const allowed = await checkRateLimit(userId, "interview", 30, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "You're sending messages a bit fast - please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const user = await currentUser();
  const name = user?.firstName || "there";

  const { messages }: { messages: ChatMessage[] } = await req.json();

  // Only the very first request of a session has just the synthetic
  // kickoff message - that's the moment to force a random opening topic,
  // since otherwise the model has no reason to vary its first question
  // and reliably converges on the same "default" one every time.
  const isSessionStart = messages.length <= 1;
  const openingTopic = OPENING_TOPICS[Math.floor(Math.random() * OPENING_TOPICS.length)];

  const systemPrompt = `You are conducting a mock technical interview for a junior/mid-level C# developer role. The candidate's name is ${name}.

Rules:
- Behave like a real, professional interviewer - not a tutor. No hand-holding, no analogies to make things easier. Be warm but rigorous, the way a good real interviewer is.
- Ask ONE question at a time and wait for the candidate's answer before continuing.
- Cover a mix of topics across a full C# fundamentals-to-intermediate interview: variables/types, OOP (classes, inheritance, polymorphism, interfaces), collections, LINQ, exception handling, and async/await. Vary the difficulty across the conversation, and vary which topics you pick and in what order - don't follow the same fixed sequence every interview.
- Occasionally ask the candidate to write a short code snippet directly in their answer (as plain text) rather than only asking definitional questions.
- After each answer, give brief, honest feedback (a sentence or two) before moving to the next question - correct any misconceptions clearly but kindly.
- After roughly 8-10 questions, or if the candidate says they want to stop, give a short overall assessment: genuine strengths, specific areas to improve, and how they'd likely come across in a real interview. Be honest, not just encouraging - false confidence doesn't help someone prepare.
${
  isSessionStart
    ? `- This is the start of a new session: briefly explain how the mock interview will work, then ask your first question specifically about ${openingTopic}. Phrase the actual question freshly - don't reuse a generic textbook definition question if you can help it, ask something that requires them to actually reason or give an example.`
    : "- Continue naturally from the conversation so far."
}`;

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
        generationConfig: { temperature: 1.0 },
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
