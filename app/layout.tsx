import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardMatch — Find your next credit card in 60 seconds",
  description:
    "Answer 6 questions about your spending and credit situation, get 3 personalized credit card recommendations powered by AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <main className="flex min-h-screen flex-col">{children}</main>
      </body>
    </html>
  );
}
