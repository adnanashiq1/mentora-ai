import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="notebook-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chalk/10 bg-ink px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-chalk-dim hover:text-chalk">
          <ArrowLeft size={18} />
          <span className="hidden text-sm sm:inline">Home</span>
        </Link>
        <span className="flex items-center gap-2 font-hand text-xl font-bold text-chalk sm:text-2xl">
          <LogoMark size={24} /> Privacy Policy
        </span>
        <div className="w-[88px]" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-10 text-sm leading-relaxed text-chalk-dim sm:px-6">
        <div className="rounded-xl border border-mustard/30 bg-mustard/10 px-4 py-3 text-xs text-chalk">
          This is a starting template, not legal advice. Have an actual lawyer review this before
          relying on it with real users and real data, and make sure it accurately reflects what
          your app actually does and where your users are located (privacy law varies by region).
        </div>

        <p className="text-chalk-dim">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section>
          <h2 className="mb-1 font-semibold text-chalk">1. What we collect</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Account info (name, email) via Clerk, our authentication provider</li>
            <li>Onboarding profile (interests, background, learning goals)</li>
            <li>Chat history with the AI tutor and interview prep sessions</li>
            <li>Quiz, exam, and project submission results</li>
            <li>Code you write and run in the sandbox or projects</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-chalk">2. How we use it</h2>
          <p>
            To personalize your learning experience, track your progress, grade quizzes and
            exams, generate your certificate, and improve the platform. We don&apos;t sell your
            personal data.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-chalk">3. Third parties we share data with</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Clerk - authentication and account management</li>
            <li>Neon (PostgreSQL) - database storage</li>
            <li>Google Gemini API - powers AI chat, grading, and interview feedback</li>
            <li>Judge0 - executes code you run in the sandbox or submit for projects/exams</li>
          </ul>
          <p className="mt-2">
            Each of these providers has its own privacy practices governing data they process on
            our behalf.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-chalk">4. Leaderboard visibility</h2>
          <p>
            Your first name and quiz points appear on the public leaderboard, visible to other
            signed-in users. Certificate verification pages show your name and score to anyone
            with the verification link.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-chalk">5. Children&apos;s privacy</h2>
          <p>
            Mentora AI is intended for users 13 and older. We don&apos;t knowingly collect data
            from children under 13.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-chalk">6. Your rights</h2>
          <p>
            You can request access to, correction of, or deletion of your data by contacting us.
            Deleting your account removes your profile, chat history, and submission records.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-chalk">7. Contact</h2>
          <p>Questions about this policy? Reach out at [your contact email].</p>
        </section>
      </main>
    </div>
  );
}
