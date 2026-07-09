"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Send, PenTool, Mic, Volume2, VolumeX } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import MermaidDiagram from "@/components/MermaidDiagram";

type Message = { role: "user" | "assistant"; content: string };
type Segment = { type: "text" | "mermaid"; content: string };

function ChalkSquiggle() {
  return (
    <div className="flex items-center gap-2 text-chalk-dim">
      <svg className="chalk-squiggle" width="60" height="16" viewBox="0 0 60 16" fill="none">
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

// Splits a message into plain-text and Mermaid-diagram segments, so each
// can be rendered appropriately. An incomplete (still-streaming) diagram
// block simply won't match yet and stays as plain text until it closes.
function parseSegments(content: string): Segment[] {
  const regex = /```mermaid\n([\s\S]*?)\n```/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "mermaid", content: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }
  return segments;
}

// Turns a response into something reasonable to actually speak aloud -
// code and diagrams get replaced with a short spoken pointer instead of
// being read character-by-character.
function stripForSpeech(text: string): string {
  return text
    .replace(/```mermaid[\s\S]*?```/g, "There's a diagram on screen for this.")
    .replace(/```[\s\S]*?```/g, "There's a code example on screen for this.")
    .replace(/[`*_#]/g, "")
    .trim();
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
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voiceModeRef = useRef(voiceMode);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    const hasSpeechRecognition =
      typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;
    setSpeechSupported(hasSpeechRecognition && hasSpeechSynthesis);
  }, []);

  async function sendMessage(e?: React.FormEvent, overrideText?: string) {
    e?.preventDefault();
    const text = overrideText ?? input;
    if (!text.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
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
        setMessages([...newMessages, { role: "assistant", content: assistantText }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Network error. Try again?" }]);
    } finally {
      setLoading(false);
    }
  }

  const startListening = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(undefined, transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
    utterance.onend = () => {
      if (voiceModeRef.current) startListening();
    };
    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  // Speak the assistant's response once streaming actually finishes, but
  // only in voice mode - and only once per completed message, not per chunk.
  useEffect(() => {
    if (prevLoadingRef.current && !loading && voiceMode) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && last.content) speak(last.content);
    }
    prevLoadingRef.current = loading;
  }, [loading, voiceMode, messages, speak]);

  function toggleVoiceMode() {
    if (voiceMode) {
      window.speechSynthesis?.cancel();
      stopListening();
    }
    setVoiceMode((v) => !v);
  }

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-chalk/10 px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="text-sm">Dashboard</span>
        </Link>
        <div className="doodle-underline">
          <span className="flex items-center gap-2 font-hand text-2xl font-bold text-chalk">
            <LogoMark size={26} /> Mentora AI
          </span>
          <svg viewBox="0 0 120 8" fill="none">
            <path d="M2 5 Q 30 1, 60 5 T 118 5" stroke="var(--mustard)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        {speechSupported ? (
          <button
            onClick={toggleVoiceMode}
            title={voiceMode ? "Turn off voice mode" : "Turn on voice mode"}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              voiceMode ? "bg-coral text-ink" : "border border-chalk/20 text-chalk-dim hover:text-chalk"
            }`}
          >
            {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        ) : (
          <div className="w-[88px]" />
        )}
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">
        {messages.map((m, i) => {
          const isStreamingEmpty =
            loading && i === messages.length - 1 && m.role === "assistant" && m.content === "";

          if (m.role === "assistant") {
            const segments = parseSegments(m.content);
            return (
              <div
                key={i}
                className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border-l-4 border-coral bg-panel px-4 py-3 text-sm leading-relaxed text-chalk shadow-sm -rotate-[0.3deg]"
              >
                {isStreamingEmpty ? (
                  <ChalkSquiggle />
                ) : (
                  segments.map((seg, si) =>
                    seg.type === "mermaid" ? (
                      <div key={si} className="my-2">
                        <MermaidDiagram definition={seg.content} />
                      </div>
                    ) : (
                      <span key={si} className="whitespace-pre-wrap">
                        {seg.content}
                      </span>
                    )
                  )
                )}
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

      {voiceMode && (
        <div className="mx-auto mb-2 flex w-full max-w-2xl items-center justify-center px-6">
          <button
            onClick={listening ? stopListening : startListening}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${
              listening ? "animate-pulse bg-coral text-ink" : "bg-panel text-chalk hover:bg-panel/80"
            }`}
          >
            <Mic size={18} />
            {listening ? "Listening... tap to stop" : "Tap to talk"}
          </button>
        </div>
      )}

      <form onSubmit={sendMessage} className="mx-auto flex w-full max-w-2xl items-center gap-2 px-6 pb-8">
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
