import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfile, saveChatMessage } from "@/lib/db";

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

  // Persist the student's new message. It's always the last item, since the
  // client sends the full running conversation each turn.
  const newestUserMessage = messages[messages.length - 1];
  if (newestUserMessage?.role === "user") {
    await saveChatMessage(userId, "user", newestUserMessage.content);
  }

  const systemPrompt = `You are Mentora, a friendly, patient AI programming tutor teaching this student C#.

Student profile:
- Interests: ${profile.interests}
- Background: ${profile.background}
- Learning goal: ${profile.learning_goal}
- Primary analogy domain: ${profile.analogy_domain}

Rules:
- Keep answers short by default — a few sentences or a small code snippet is usually enough. Only go longer if the student explicitly asks for more detail, or if a concept genuinely needs a worked example to make sense.
- Explain every new concept using an analogy from their primary analogy domain (${profile.analogy_domain}) first, before giving the generic/textbook explanation — but keep even the analogy brief, one or two sentences.
- Keep explanations focused and conversational, not like a textbook wall of text.
- When showing code, use short, runnable C# snippets.
- When explaining class relationships, inheritance hierarchies, object interactions, or program flow, include a diagram using Mermaid syntax in a fenced code block starting with \`\`\`mermaid and ending with \`\`\` (e.g. classDiagram, sequenceDiagram, or flowchart). Only include one when it genuinely clarifies a structural or relational concept — don't add one for simple syntax questions or anything that's clearer as plain text.
- If they seem confused, re-explain more simply using an even more concrete example from the same domain, don't just repeat yourself.
- Never invent facts about their interests or background beyond what they told you — ask if you need more detail.`;

  // Cap how much history gets sent as context - keeps requests fast and
  // avoids unbounded growth over a long-running conversation.
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

  // Gemini streams back Server-Sent Events. We parse those and forward just
  // the plain text deltas to the client, so the browser doesn't need to know
  // anything about Gemini's response format.
  const stream = new ReadableStream({
    async start(controller) {
      const reader = geminiRes.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      let fullText = "";

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
            if (text) {
              fullText += text;
              controller.enqueue(encoder.encode(text));
            }
          } catch {
            // Ignore malformed SSE lines (e.g. keep-alive pings)
          }
        }
      }

      if (fullText) {
        await saveChatMessage(userId, "assistant", fullText);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
