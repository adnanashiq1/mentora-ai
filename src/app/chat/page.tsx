"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, PenTool } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

function ChalkSquiggle() {
  return (
    <div className="flex items-center gap-2 text-chalk-dim">
      <svg
        className="chalk-squiggle"
        width="60"
        height="16"
        viewBox="0 0 60 16"
        fill="none"
      >
        <path
          d="M2 8 Q 10 2, 18 8 T 34 8 T 50 8 T 58 8"
          stroke="var(--coral)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-hand text-lg">sketching a thought...</span>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm Mentora. Ask me anything to get started with C#, or just say \"let's begin\" and I'll walk you through the basics.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Something went wrong. Try again?" },
        ]);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantText += decoder.decode(value, { stream: true });
        setMessages([
          ...newMessages,
          { role: "assistant", content: assistantText },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Network error. Try again?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-chalk/10 px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="text-sm">Dashboard</span>
        </Link>
        <div className="doodle-underline">
          <span className="font-hand text-2xl font-bold text-chalk">Mentora AI</span>
          <svg viewBox="0 0 120 8" fill="none">
            <path
              d="M2 5 Q 30 1, 60 5 T 118 5"
              stroke="var(--mustard)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">
        {messages.map((m, i) => {
          const isStreamingEmpty =
            loading && i === messages.length - 1 && m.role === "assistant" && m.content === "";

          if (m.role === "assistant") {
            return (
              <div
                key={i}
                className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border-l-4 border-coral bg-panel px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-chalk shadow-sm -rotate-[0.3deg]"
              >
                {isStreamingEmpty ? <ChalkSquiggle /> : m.content}
              </div>
            );
          }

          return (
            <div
              key={i}
              className="ml-auto max-w-[80%] rotate-[0.3deg] rounded-2xl rounded-tr-sm bg-mustard px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-ink shadow-sm"
            >
              {m.content}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <form
        onSubmit={sendMessage}
        className="mx-auto flex w-full max-w-2xl items-center gap-2 px-6 pb-8"
      >
        <div className="flex flex-1 items-center gap-2 rounded-full border border-chalk/15 bg-panel px-4 py-1">
          <PenTool size={16} className="shrink-0 text-chalk-dim" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Mentora anything about C#..."
            className="flex-1 bg-transparent py-2 text-sm text-chalk placeholder:text-chalk-dim focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
