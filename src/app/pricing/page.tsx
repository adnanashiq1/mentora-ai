import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMonetizationEnabled, getUserSubscriptionStatus } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import UpgradeButton from "@/components/UpgradeButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";

export default async function PricingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const monetizationEnabled = await getMonetizationEnabled();
  const status = await getUserSubscriptionStatus(user.id);
  const isPro = status === "active";

  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Dashboard</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-xl font-bold text-chalk sm:text-2xl">
          <LogoMark size={26} /> Pricing
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-8 px-4 py-10 sm:px-6">
        {!monetizationEnabled ? (
          <div className="rounded-2xl border border-mustard/30 bg-mustard/10 px-6 py-8 text-center">
            <p className="font-hand text-2xl font-bold text-chalk">Everything is free right now</p>
            <p className="mt-2 text-sm text-chalk-dim">
              We&apos;re not charging for anything at this stage - enjoy full access.
            </p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-chalk/10 bg-panel p-6">
              <h2 className="text-lg font-bold text-chalk">Free</h2>
              <p className="mt-1 text-2xl font-bold text-chalk">$0</p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-chalk-dim">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-mustard" /> Full curriculum, quizzes, exam
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-mustard" /> Code sandbox &amp; guided projects
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-mustard" /> Standard chat &amp; interview limits
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-coral bg-coral/10 p-6">
              <h2 className="text-lg font-bold text-chalk">Pro</h2>
              <p className="mt-1 text-2xl font-bold text-chalk">
                $9<span className="text-sm font-normal text-chalk-dim">/month</span>
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-chalk-dim">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-coral" /> Everything in Free
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-coral" /> Much higher chat &amp; interview limits
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-coral" /> Priority support
                </li>
              </ul>

              <div className="mt-5">
                {isPro ? (
                  <ManageSubscriptionButton />
                ) : (
                  <UpgradeButton />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
