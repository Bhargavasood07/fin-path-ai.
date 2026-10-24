import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinPath AI — RBI Grounded Loan & Financial Journey Platform",
  description: "Calculate accurate reducing EMIs, uncover true APR, verify RBI Key Facts Statement (KFS) compliance, and consult official regulatory documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
