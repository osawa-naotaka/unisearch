"use client";

import { useState, lazy, Suspense, JSX } from "react";
import Link from "next/link";
import type { SearchResult } from "staticseek";
import type { SearchKey } from "@/app/searchindex.json/route.ts";

const StaticSeek = lazy(() => import("@/app/StaticSeek"));

function renderResult(result: SearchResult[]): JSX.Element {
    const lis = result.map((item) => {
    const key = item.key as SearchKey;  // ad-hock solution. you might as well use zod or something like that to validate the key.
        return (
            <li key={key.slug}>
                <Link href={`/posts/${key.slug as string}`}><h3>{key.data.title as string}</h3></Link>
                <p>{item.refs[0].wordaround}</p>
            </li>
        );
    });

    return (
        <>
            <h2>results</h2>
            <ul>
                {result.length > 0 ? lis : <li>No results found.</li>}
            </ul>
        </>
    );
}

export default function Index() {
    const [query, setQuery] = useState<string>("");
    const [trigger, setTrigger] = useState<boolean>(false);

    function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        setTrigger(true);
    }

    return (
        <main>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="type your search query in English..." onChange={onChangeInput}/>
            </div>
            {trigger &&
                <Suspense fallback={<div>Loading...</div>}>
                    <StaticSeek query={query} indexUrl="/searchindex.json" render={renderResult} />
                </Suspense>
            }
        </main>
    );
}
