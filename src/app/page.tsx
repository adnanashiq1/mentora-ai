import { Show } from "@clerk/nextjs";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { MessageCircle, BookOpen, Trophy, Terminal, Award } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Learns you first",
    body: "A quick onboarding chat learns your interests, then every explanation uses examples from your world - not generic apples and baskets.",
  },
  {
    icon: BookOpen,
    title: "A real curriculum",
    body: "26 chapters, Introduction through Reflection - not just an open-ended chatbot with no structure.",
  },
  {
    icon: Trophy,
    title: "Quizzes that stick",
    body: "Every chapter ends in a shuffled, gamified quiz - points, hints, and a leaderboard to keep you honest with yourself.",
  },
  {
    icon: Terminal,
    title: "A real code sandbox",
    body: "Write and actually run C# in your browser - no installs, and every chapter's examples are one click from being editable.",
  },
  {
    icon: Award,
    title: "A credential that means something",
    body: "A gated final exam - MCQs plus AI-graded coding challenges - with a verifiable certificate at the end, not just a participation badge.",
  },
];

export default function Home() {
  return (
    <div className="notebook-bg flex min-h-screen flex-col items-center">
      <main className="flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center">
        <LogoMark size={56} />
        <div className="doodle-underline">
          <h1 className="font-hand text-5xl font-bold text-chalk sm:text-6xl">Mentora AI</h1>
          <svg viewBox="0 0 220 8" fill="none">
            <path
              d="M2 5 Q 55 1, 110 5 T 218 5"
              stroke="var(--mustard)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="max-w-md text-lg text-chalk-dim">
          The AI programming mentor that gets to know you first.
        </p>

        <Show when="signed-out">
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
            >
              Get started
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-chalk/20 px-6 py-3 text-sm font-medium text-chalk hover:bg-panel"
            >
              Sign in
            </Link>
          </div>
        </Show>

        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="mt-2 rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Go to dashboard
          </Link>
        </Show>

        <div className="mt-14 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-2 rounded-xl border border-chalk/15 bg-panel p-5"
            >
              <Icon size={22} className="text-mustard" />
              <h3 className="font-semibold text-chalk">{title}</h3>
              <p className="text-sm text-chalk-dim">{body}</p>
            </div>
          ))}
        </div>

        <footer className="mt-10 flex gap-4 text-xs text-chalk-dim">
          <Link href="/terms" className="hover:text-chalk">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-chalk">
            Privacy Policy
          </Link>
        </footer>
      </main>
    </div>
  );
}
