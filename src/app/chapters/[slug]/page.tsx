import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getChapterBySlug } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { slug } = await params;
  const chapter = await getChapterBySlug(slug);
  if (!chapter) notFound();

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-chalk/10 px-6 py-4">
        <Link href="/chapters" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="text-sm">All chapters</span>
        </Link>
        <span className="font-hand text-xl font-bold text-chalk">
          Chapter {chapter.order_num}
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        <h1 className="text-3xl font-bold text-chalk">{chapter.title}</h1>

        {chapter.sections.map((section, i) => (
          <div key={i} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-mustard">{section.heading}</h2>
            <p className="leading-relaxed text-chalk-dim">{section.body}</p>
            {section.code && (
              <pre className="overflow-x-auto rounded-xl border-l-4 border-coral bg-panel p-4 text-sm text-chalk font-mono">
                <code>{section.code}</code>
              </pre>
            )}
          </div>
        ))}

        <Link
          href="/chat"
          className="mt-4 flex w-fit items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
        >
          <MessageCircle size={16} />
          Discuss this chapter with Mentora
        </Link>
      </main>
    </div>
  );
}
