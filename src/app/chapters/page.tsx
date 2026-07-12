import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getChapters } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LogoMark from "@/components/LogoMark";

export default async function ChaptersPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const chapters = await getChapters();

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-2xl font-bold text-chalk">
          <LogoMark size={26} /> C# Course
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-10">
        {chapters.map((ch) => (
          <Link
            key={ch.slug}
            href={`/chapters/${ch.slug}`}
            className="flex items-start gap-4 rounded-2xl border border-chalk/10 bg-panel px-5 py-4 transition hover:border-coral/50"
          >
            <span className="font-hand text-3xl font-bold text-mustard">
              {ch.order_num}
            </span>
            <div>
              <h2 className="font-semibold text-chalk">{ch.title}</h2>
              <p className="text-sm text-chalk-dim">{ch.summary}</p>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
