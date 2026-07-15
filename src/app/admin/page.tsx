import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAdminStats, getMonetizationEnabled, getProSubscriberCount } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import MonetizationToggle from "@/components/MonetizationToggle";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin =
    !!adminEmail && user.emailAddresses.some((e) => e.emailAddress === adminEmail);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const stats = await getAdminStats();
  const monetizationEnabled = await getMonetizationEnabled();
  const proSubscribers = await getProSubscriberCount();

  const cards = [
    { label: "Students onboarded", value: stats.totalStudents },
    { label: "Quiz attempts", value: stats.totalQuizAttempts },
    { label: "Chat messages sent", value: stats.totalChatMessages },
    {
      label: "Exam attempts (pass rate)",
      value: `${stats.examAttemptsPassed} / ${stats.examAttemptsTotal}`,
    },
    {
      label: "Project submissions (met requirements)",
      value: `${stats.projectSubmissionsMet} / ${stats.projectSubmissionsTotal}`,
    },
    { label: "Pro subscribers", value: proSubscribers },
  ];

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-xl font-bold text-chalk sm:text-2xl">
          <LogoMark size={26} /> Admin
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
        <MonetizationToggle initialEnabled={monetizationEnabled} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-chalk/10 bg-panel px-5 py-4">
              <p className="text-2xl font-bold text-mustard">{c.value}</p>
              <p className="text-sm text-chalk-dim">{c.label}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-chalk">Chapter completion (students)</h2>
          <div className="flex flex-col gap-1">
            {stats.chapterCompletion.map((c) => (
              <div
                key={c.order_num}
                className="flex items-center justify-between rounded-lg border border-chalk/10 bg-panel px-4 py-2 text-sm"
              >
                <span className="text-chalk">
                  {c.order_num}. {c.title}
                </span>
                <span className="text-chalk-dim">{c.completedCount} students</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-chalk">
            <Trophy size={18} className="text-mustard" /> Top 10 leaderboard
          </h2>
          <div className="flex flex-col gap-1">
            {stats.topLeaderboard.map((entry, i) => (
              <div
                key={entry.user_id}
                className="flex items-center justify-between rounded-lg border border-chalk/10 bg-panel px-4 py-2 text-sm"
              >
                <span className="text-chalk">
                  {i + 1}. {entry.display_name}
                </span>
                <span className="text-chalk-dim">{entry.total_points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
