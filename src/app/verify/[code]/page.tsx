import { getCertificateByCode } from "@/lib/db";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import LogoMark from "@/components/LogoMark";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = await getCertificateByCode(code.toUpperCase());

  return (
    <div className="notebook-bg flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-chalk/10 bg-panel px-8 py-10 text-center">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={32} />
          <span className="font-hand text-xl font-bold text-chalk">Mentora AI</span>
        </Link>

        {cert ? (
          <>
            <CheckCircle2 className="text-mustard" size={48} />
            <div>
              <p className="text-lg font-semibold text-chalk">Valid Certificate</p>
              <p className="mt-1 text-chalk-dim">
                Issued to <span className="text-chalk">{cert.displayName}</span>
              </p>
              <p className="text-chalk-dim">
                Best score: {cert.overallPercentage.toFixed(1)}% · Last updated{" "}
                {new Date(cert.attemptedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="mt-3 font-mono text-xs text-chalk-dim">Certificate ID: {code.toUpperCase()}</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="text-coral" size={48} />
            <div>
              <p className="text-lg font-semibold text-chalk">Certificate Not Found</p>
              <p className="mt-1 text-chalk-dim">
                No valid certificate matches ID{" "}
                <span className="font-mono text-chalk">{code.toUpperCase()}</span>.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
