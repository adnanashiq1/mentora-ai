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
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Stage 0 complete — this is your working starting point. Onboarding, chat,
          and chapters get built in Stages 1 onward.
        </p>
      </main>
    </div>
  );
}
