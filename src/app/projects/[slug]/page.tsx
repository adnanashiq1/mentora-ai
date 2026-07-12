import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getProjectBySlug, getProjectSubmissions } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import ProjectWorkspace from "@/components/ProjectWorkspace";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const submissions = await getProjectSubmissions(user.id, slug);

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/projects" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">All projects</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-xl font-bold text-chalk sm:text-2xl">
          <LogoMark size={26} />
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <ProjectWorkspace project={project} initialSubmissions={submissions} />
      </main>
    </div>
  );
}
