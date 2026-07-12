"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Send, RotateCcw, Mic, Volume2, VolumeX } from "lucide-react";
import LogoMark from "@/components/LogoMark";

type Message = { role: "user" | "assistant"; content: string };

const STARTER: Message[] = [
  { role: "user", content: "I'm ready to start the mock interview." },
];

function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "There's a code example on screen for this.")
    .replace(/[`*_#]/g, "")
    .trim();
}

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
      <span className="font-hand text-lg">thinking of a question...</span>
    </div>
  );
}

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voiceModeRef = useRef(voiceMode);
  const messagesRef = useRef<Message[]>(messages);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
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

  // apiMessages: full context sent to the model.
  // displayBase: what's already shown, before the new assistant reply streams in.
  // Kept separate so the synthetic "I'm ready to start" kickoff message can
  // prompt the AI's first question without ever appearing in the UI.
  async function runExchange(apiMessages: Message[], displayBase: Message[]) {
    setMessages([...displayBase, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok || !res.body) {
        setMessages([...displayBase, { role: "assistant", content: "Something went wrong. Try again?" }]);
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
        setMessages([...displayBase, { role: "assistant", content: assistantText }]);
      }
    } catch {
      setMessages([...displayBase, { role: "assistant", content: "Network error. Try again?" }]);
    } finally {
      setLoading(false);
    }
  }

  function startInterview() {
    setStarted(true);
    runExchange(STARTER, []);
  }

  function startNewInterview() {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setMessages([]);
    setStarted(false);
    setInput("");
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
      const newMessages = [...messagesRef.current, { role: "user" as const, content: transcript }];
      runExchange(newMessages, newMessages);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
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

  useEffect(() => {
    if (prevLoadingRef.current && !loading && voiceMode) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && last.content) speak(last.content);
    }
    prevLoadingRef.current = loading;
  }, [loading, voiceMode, messages, speak]);

  function toggleVoiceMode() {
    try {
      if (voiceMode) {
        window.speechSynthesis?.cancel();
        stopListening();
      }
    } catch {
      // ignore
    }
    setVoiceMode((v) => !v);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const newMessages = [...messages, { role: "user" as const, content: input }];
    setInput("");
    await runExchange(newMessages, newMessages);
  }

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-xl font-bold text-chalk sm:text-2xl">
          <LogoMark size={26} /> Interview Prep
        </span>
        <div className="flex items-center gap-2">
          {started && speechSupported && (
            <button
              type="button"
              onClick={toggleVoiceMode}
              title={voiceMode ? "Turn off voice mode" : "Turn on voice mode"}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                voiceMode ? "bg-coral text-ink" : "border border-chalk/20 text-chalk-dim hover:text-chalk"
              }`}
            >
              {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
          {started ? (
            <button
              type="button"
              onClick={startNewInterview}
              title="Start a new interview"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-chalk/20 text-chalk-dim hover:text-chalk"
            >
              <RotateCcw size={16} />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </header>

      {!started ? (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-hand text-3xl font-bold text-chalk">Ready for a mock interview?</h1>
          <p className="text-sm text-chalk-dim">
            Mentora will switch out of tutor mode and interview you like a real hiring manager
            would - one question at a time, honest feedback, and a real assessment at the end.
            No analogies, no hand-holding. Turn on voice mode once it starts if you'd rather
            speak your answers out loud, closer to a real interview.
          </p>
          <button
            type="button"
            onClick={startInterview}
            className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Start the interview
          </button>
        </main>
      ) : (
        <>
          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">
            {messages.map((m, i) => {
              const isStreamingEmpty =
                loading && i === messages.length - 1 && m.role === "assistant" && m.content === "";
              return (
                <div
                  key={i}
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "ml-auto rotate-[0.3deg] rounded-tr-sm bg-mustard text-ink"
                      : "mr-auto -rotate-[0.3deg] rounded-tl-sm border-l-4 border-coral bg-panel text-chalk"
                  }`}
                >
                  {isStreamingEmpty ? <ChalkSquiggle /> : m.content}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </main>

          {voiceMode && (
            <div className="mx-auto mb-2 flex w-full max-w-2xl items-center justify-center px-6">
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${
                  listening ? "animate-pulse bg-coral text-ink" : "bg-panel text-chalk hover:bg-panel/80"
                }`}
              >
                <Mic size={18} />
                {listening ? "Listening... tap to stop" : "Tap to answer"}
              </button>
            </div>
          )}

          <form onSubmit={sendMessage} className="mx-auto flex w-full max-w-2xl items-center gap-2 px-6 pb-8">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1 rounded-full border border-chalk/15 bg-panel px-4 py-3 text-sm text-chalk placeholder:text-chalk-dim focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-ink transition hover:brightness-110 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
