import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjects } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LogoMark from "@/components/LogoMark";

export default async function ProjectsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const projects = await getProjects();

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-xl font-bold text-chalk sm:text-2xl">
          <LogoMark size={26} /> Guided Projects
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
        <p className="text-sm text-chalk-dim">
          Real, small programs that pull together everything you've learned. Submit your code and
          Mentora will give you coaching feedback - not a pass/fail score.
        </p>
        {projects.map((p) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            className="flex items-start gap-4 rounded-2xl border border-chalk/10 bg-panel px-5 py-4 transition hover:border-coral/50"
          >
            <span className="font-hand text-3xl font-bold text-mustard">{p.order_num}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-chalk">{p.title}</h2>
                <span className="rounded-full border border-chalk/20 px-2 py-0.5 text-[11px] text-chalk-dim">
                  {p.difficulty}
                </span>
              </div>
              <p className="text-sm text-chalk-dim">{p.description}</p>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
