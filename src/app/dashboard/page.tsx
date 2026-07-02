import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/db";

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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          Mentora AI
        </span>
        <UserButton />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome, {user.firstName ?? "there"}.
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          We&apos;ll teach you C# using examples from{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {profile.analogy_domain}
          </span>
          . Your first chapter and the AI chat get built here in Stage 3.
        </p>
      </main>
    </div>
  );
}
