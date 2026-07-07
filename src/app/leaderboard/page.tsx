import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import LogoMark from "@/components/LogoMark";

export default async function LeaderboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const entries = await getLeaderboard(20);

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-chalk/10 px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="text-sm">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-2xl font-bold text-chalk">
          <LogoMark size={26} /> Leaderboard
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 px-6 py-10">
        {entries.length === 0 ? (
          <p className="text-center text-chalk-dim">
            No quiz scores yet — be the first on the board.
          </p>
        ) : (
          entries.map((entry, i) => {
            const isMe = entry.user_id === user.id;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between rounded-xl border px-5 py-3 ${
                  isMe ? "border-coral bg-coral/10" : "border-chalk/10 bg-panel"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-hand w-8 text-2xl font-bold text-mustard">
                    {i + 1}
                  </span>
                  <span className="text-chalk">
                    {entry.display_name}
                    {isMe && <span className="ml-2 text-xs text-chalk-dim">(you)</span>}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-coral">
                  <Trophy size={16} />
                  <span className="font-semibold">{entry.total_points}</span>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
