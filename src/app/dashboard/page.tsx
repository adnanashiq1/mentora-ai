import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          Mentora AI
        </span>
        <UserButton afterSignOutUrl="/" />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome, {user.firstName ?? "there"}.
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          This is your dashboard. Onboarding and your first C# chapter get
          built here in Stage 2.
        </p>
      </main>
    </div>
  );
}
