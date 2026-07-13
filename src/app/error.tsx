"use client";

import { useEffect } from "react";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="notebook-bg flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark size={48} />
      <h1 className="font-hand text-3xl font-bold text-chalk">Something went wrong</h1>
      <p className="max-w-sm text-sm text-chalk-dim">
        That&apos;s on us, not something you did. Try again, or head back to the dashboard.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-medium text-ink transition hover:brightness-110"
        >
          <RotateCcw size={16} /> Try again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-full border border-chalk/20 px-6 py-3 text-sm font-medium text-chalk hover:bg-panel"
        >
          <Home size={16} /> Dashboard
        </Link>
      </div>
    </div>
  );
}
