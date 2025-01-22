import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import cn from "classnames";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `unisearch.js example using Next.js`,
  description: `unisearch.js example using Next.js.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={cn(inter.className, "dark:bg-slate-900 dark:text-slate-400 max-w-2xl mx-auto")}>
        <header>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight mb-20 mt-8 flex items-center">
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </h2>
        </header>

        <main className="min-h-screen">{children}</main>

        <footer className="bg-neutral-50 border-t border-neutral-200 dark:bg-slate-800">
          unisearch.js
        </footer>

      </body>
    </html>
  );
}
