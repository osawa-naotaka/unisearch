import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
    title: "unisearch.js example using Next.js",
    description: "unisearch.js example using Next.js.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <head>
                <title>unisearch.js example using Next.js</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta charSet="utf-8" />
            </head>
            <body>
                <header>
                    <h2>
                        <Link href="/">Home</Link>
                    </h2>
                </header>

                <main>{children}</main>

                <footer>unisearch.js</footer>
            </body>
        </html>
    );
}