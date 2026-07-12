import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserStreak, getUserBadges } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Flame, Award, Lock } from "lucide-react";
import LogoMark from "@/components/LogoMark";

export default async function AchievementsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const streak = await getUserStreak(user.id);
  const badges = await getUserBadges(user.id);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-xl font-bold text-chalk sm:text-2xl">
          <LogoMark size={26} /> Achievements
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex items-center justify-center gap-8 rounded-2xl border border-chalk/10 bg-panel px-6 py-8 text-center">
          <div>
            <div className="flex items-center justify-center gap-2">
              <Flame className={streak.current > 0 ? "text-coral" : "text-chalk-dim"} size={28} />
              <span className="font-hand text-4xl font-bold text-chalk">{streak.current}</span>
            </div>
            <p className="mt-1 text-sm text-chalk-dim">Current streak</p>
          </div>
          <div className="h-12 w-px bg-chalk/10" />
          <div>
            <span className="font-hand text-4xl font-bold text-mustard">{streak.longest}</span>
            <p className="mt-1 text-sm text-chalk-dim">Longest streak</p>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-chalk">Badges</h2>
            <span className="text-sm text-chalk-dim">
              {earnedCount} / {badges.length} earned
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-5 text-center ${
                  badge.earned
                    ? "border-mustard/40 bg-mustard/10"
                    : "border-chalk/10 bg-panel opacity-50"
                }`}
              >
                {badge.earned ? (
                  <Award className="text-mustard" size={26} />
                ) : (
                  <Lock className="text-chalk-dim" size={22} />
                )}
                <span className="text-xs font-semibold text-chalk sm:text-sm">{badge.name}</span>
                <span className="text-[11px] text-chalk-dim">{badge.description}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
