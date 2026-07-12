import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getProfile, getUserStreak } from "@/lib/db";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { BookOpen, TrendingUp, Trophy, Terminal, Award, Flame, Sparkles, Briefcase } from "lucide-react";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await getProfile(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  const streak = await getUserStreak(user.id);

  const cards = [
    { href: "/chapters", label: "Your Course", icon: BookOpen },
    { href: "/progress", label: "My Progress", icon: TrendingUp },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/achievements", label: "Achievements", icon: Sparkles },
    { href: "/projects", label: "Guided Projects", icon: Briefcase },
    { href: "/sandbox", label: "Code Sandbox", icon: Terminal },
    { href: "/exam", label: "Final Exam", icon: Award },
  ];

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <span className="flex items-center gap-2 font-hand text-xl font-bold text-chalk sm:text-2xl">
          <LogoMark size={26} /> Mentora AI
        </span>
        <div className="flex items-center gap-3">
          {streak.current > 0 && (
            <Link
              href="/achievements"
              className="flex items-center gap-1 rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-sm text-coral"
              title={`${streak.current}-day streak`}
            >
              <Flame size={14} /> {streak.current}
            </Link>
          )}
          <UserButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-10 text-center sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-chalk sm:text-3xl">
            Welcome, {user.firstName ?? "there"}.
          </h1>
          <p className="mt-2 max-w-md text-sm text-chalk-dim sm:text-base">
            We&apos;ll teach you C# using examples from{" "}
            <span className="font-medium text-mustard">{profile.analogy_domain}</span>.
          </p>
        </div>

        <Link
          href="/chat"
          className="w-full max-w-xs rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110 sm:w-auto"
        >
          Start chatting with Mentora
        </Link>

        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-chalk/15 bg-panel px-4 py-5 text-chalk transition hover:border-mustard/40"
            >
              <Icon size={22} className="text-mustard" />
              <span className="text-xs font-medium sm:text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
