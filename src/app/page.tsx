import { Show } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="notebook-bg flex flex-col flex-1 items-center justify-center min-h-screen">
      <main className="flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
        <div className="doodle-underline">
          <h1 className="font-hand text-6xl font-bold text-chalk">Mentora AI</h1>
          <svg viewBox="0 0 220 8" fill="none">
            <path
              d="M2 5 Q 55 1, 110 5 T 218 5"
              stroke="var(--mustard)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="text-lg text-chalk-dim">
          The AI programming mentor that gets to know you first.
        </p>

        <Show when="signed-out">
          <div className="mt-2 flex gap-4">
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
      </main>
    </div>
  );
}
