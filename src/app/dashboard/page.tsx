import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profile = await getProfile(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-chalk/10 px-6 py-4">
        <span className="font-hand text-2xl font-bold text-chalk">Mentora AI</span>
        <UserButton />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold text-chalk">
          Welcome, {user.firstName ?? "there"}.
        </h1>
        <p className="max-w-md text-chalk-dim">
          We&apos;ll teach you C# using examples from{" "}
          <span className="font-medium text-mustard">{profile.analogy_domain}</span>.
        </p>
        <div className="flex gap-3">
          <Link
            href="/chapters"
            className="rounded-full border border-chalk/20 px-6 py-3 text-sm font-medium text-chalk hover:bg-panel"
          >
            View your course
          </Link>
          <Link
            href="/chat"
            className="rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Start chatting with Mentora
          </Link>
        </div>
      </main>
    </div>
  );
}
