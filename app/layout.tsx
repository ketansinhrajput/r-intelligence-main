import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resume Intelligence - AI-Powered Resume & Cover Letter Optimization",
  description:
    "Analyze your resume against job descriptions, get ATS scores, and generate optimized resumes and cover letters for software engineering roles.",
  keywords: [
    "resume",
    "ATS",
    "job application",
    "cover letter",
    "software engineering",
    "AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
