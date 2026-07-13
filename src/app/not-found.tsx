import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="notebook-bg flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark size={48} />
      <h1 className="font-hand text-4xl font-bold text-chalk">404</h1>
      <p className="max-w-sm text-sm text-chalk-dim">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
      >
        <Home size={16} /> Back to dashboard
      </Link>
    </div>
  );
}
