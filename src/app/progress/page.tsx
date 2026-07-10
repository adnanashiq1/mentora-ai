import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserProgress } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import LogoMark from "@/components/LogoMark";

export default async function ProgressPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const chapters = await getUserProgress(user.id);
  const attempted = chapters.filter((c) => c.best_score !== null);
  const nextChapter = chapters.find((c) => c.best_score === null);
  const percent = Math.round((attempted.length / chapters.length) * 100) || 0;

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-chalk/10 px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-2xl font-bold text-chalk">
          <LogoMark size={26} /> Your Progress
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="rounded-2xl border border-chalk/10 bg-panel px-6 py-5">
          <div className="flex items-center justify-between text-sm text-chalk-dim">
            <span>
              {attempted.length} of {chapters.length} chapters started
            </span>
            <span>{percent}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink">
            <div
              className="h-full rounded-full bg-mustard transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          {nextChapter ? (
            <Link
              href={`/chapters/${nextChapter.slug}`}
              className="mt-4 inline-block rounded-full bg-coral px-5 py-2 text-sm font-medium text-ink transition hover:brightness-110"
            >
              Continue: {nextChapter.title}
            </Link>
          ) : (
            <p className="mt-4 text-mustard">You've started every chapter!</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {chapters.map((ch) => {
            const done = ch.best_score !== null;
            return (
              <Link
                key={ch.slug}
                href={`/chapters/${ch.slug}`}
                className="flex items-center justify-between rounded-lg border border-chalk/10 bg-panel px-4 py-3 hover:border-chalk/25"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      done ? "bg-mustard text-ink" : "border border-chalk/20 text-transparent"
                    }`}
                  >
                    <Check size={14} />
                  </span>
                  <span className="text-sm text-chalk">
                    {ch.order_num}. {ch.title}
                  </span>
                </div>
                {done && (
                  <span className="text-xs text-chalk-dim">
                    Best: {ch.best_score}/{ch.best_total} · {ch.best_points} pts
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
