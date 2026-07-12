import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getChapterBySlug, getQuizQuestions } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuizForm from "@/components/QuizForm";

export default async function ChapterQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { slug } = await params;
  const chapter = await getChapterBySlug(slug);
  if (!chapter) notFound();

  const questions = await getQuizQuestions(slug);

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link
          href={`/chapters/${slug}`}
          className="flex items-center gap-2 text-chalk-dim hover:text-chalk"
        >
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Back to chapter</span>
        </Link>
        <span className="font-hand text-xl font-bold text-chalk">Quiz time</span>
        <div className="w-[110px]" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        {questions.length === 0 ? (
          <p className="text-chalk-dim">
            No quiz is available for this chapter yet.
          </p>
        ) : (
          <QuizForm chapterSlug={slug} chapterTitle={chapter.title} questions={questions} />
        )}
      </main>
    </div>
  );
}
