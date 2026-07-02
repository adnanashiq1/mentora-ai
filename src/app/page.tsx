import { Show } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mentora AI
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          The AI programming mentor that gets to know you first.
        </p>

        <Show when="signed-out">
          <div className="flex gap-4">
            <Link
              href="/sign-up"
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black"
            >
              Get started
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              Sign in
            </Link>
          </div>
        </Show>

        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black"
          >
            Go to dashboard
          </Link>
        </Show>
      </main>
    </div>
  );
}
