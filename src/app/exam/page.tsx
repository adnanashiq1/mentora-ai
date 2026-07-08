import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getExamStatus, getExamQuestions, getExamCodingQuestions } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import ExamForm from "@/components/ExamForm";

export default async function ExamPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const status = await getExamStatus(user.id);

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-chalk/10 px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="text-sm">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-2xl font-bold text-chalk">
          <LogoMark size={26} /> Final Exam
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        {status.state === "passed_final" && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-mustard bg-mustard/10 px-6 py-10 text-center">
            <p className="font-hand text-3xl font-bold text-chalk">You've passed! 🎉</p>
            <p className="text-chalk-dim">
              Best score: {status.bestPassedAttempt.overall_percentage.toFixed(1)}%
            </p>
            <p className="text-sm text-chalk-dim">You've used all 3 attempts.</p>
            <a
              href="/api/certificate"
              className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
            >
              Download your certificate
            </a>
          </div>
        )}

        {status.state === "locked" && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-coral bg-coral/10 px-6 py-10 text-center">
            <p className="font-hand text-2xl font-bold text-chalk">
              You've used all 3 attempts
            </p>
            <p className="text-chalk-dim">
              Unfortunately no further attempts are available on this account.
            </p>
          </div>
        )}

        {status.state === "cooldown" && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-chalk/10 bg-panel px-6 py-10 text-center">
            <p className="font-hand text-2xl font-bold text-chalk">Not eligible yet</p>
            <p className="text-chalk-dim">
              You can try again on{" "}
              {status.eligibleAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              .
            </p>
            <p className="text-sm text-chalk-dim">
              Attempts remaining: {status.attemptsRemaining}
            </p>
            {status.bestPassedAttempt && (
              <>
                <p className="text-sm text-mustard">
                  You've already passed with {status.bestPassedAttempt.overall_percentage.toFixed(1)}%.
                </p>
                <a
                  href="/api/certificate"
                  className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
                >
                  Download your certificate
                </a>
              </>
            )}
          </div>
        )}

        {status.state === "can_attempt" && (
          <>
            {status.bestPassedAttempt && (
              <div className="mb-4 flex flex-col items-center gap-2 rounded-xl border border-mustard/40 bg-mustard/10 px-4 py-3 text-center text-sm">
                <p className="text-chalk">
                  You've already passed with{" "}
                  <span className="font-semibold text-mustard">
                    {status.bestPassedAttempt.overall_percentage.toFixed(1)}%
                  </span>
                  . Retaking below to improve still uses one of your remaining attempts, and
                  your certificate will always reflect your best score.
                </p>
                <a
                  href="/api/certificate"
                  className="text-xs text-mustard underline hover:text-chalk"
                >
                  Download your current certificate
                </a>
              </div>
            )}
            <div className="mb-6 flex flex-col gap-1 rounded-xl border border-chalk/10 bg-panel px-4 py-3 text-sm text-chalk-dim">
              <p>
                20 multiple-choice questions (60% of your score) plus 2 coding challenges,
                AI-graded (40% of your score). 70% overall to pass. You have{" "}
                {status.attemptsRemaining} attempt{status.attemptsRemaining !== 1 ? "s" : ""} left.
              </p>
              <p>
                If you don&apos;t pass, there&apos;s a 3-week wait before trying again. Leaving
                this tab/window during the exam will end your attempt automatically - stay on
                this page until you submit. Your attempt is reserved the moment you start, even
                if you don&apos;t finish.
              </p>
            </div>
            <ExamForm
              questions={await getExamQuestions()}
              codingQuestions={await getExamCodingQuestions()}
            />
          </>
        )}
      </main>
    </div>
  );
}
