import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Caveat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Mentora AI - The AI Programming Mentor That Gets to Know You First",
    template: "%s | Mentora AI",
  },
  description:
    "Learn C# with an AI tutor that personalizes every example to your interests. 26 chapters, gamified quizzes, a real code sandbox, guided projects, mock interviews, and a gated final exam with a verifiable certificate.",
  keywords: ["learn C#", "AI programming tutor", "coding bootcamp", "C# course", "programming certificate"],
  openGraph: {
    title: "Mentora AI - The AI Programming Mentor That Gets to Know You First",
    description:
      "Learn C# with an AI tutor that personalizes every example to your interests, a real code sandbox, guided projects, and a gated final exam with a certificate.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Mentora AI",
    description: "The AI programming mentor that gets to know you first.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${jetbrainsMono.variable} ${caveat.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
