"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { JSX } from "react";
import { createSearchFn, SearchResult, StaticSeekError } from "staticseek";
import type { SearchFn } from "staticseek";
import * as v from "valibot";

const schema = v.object({
    slug: v.string(),
    data: v.object({
        title: v.string(),
    }),
});

function StaticSeekResult(result: SearchResult[]): JSX.Element {
    const lis = result.map((item) => {
        const key = v.parse(schema, item.key);
        return (
            <li key={key.slug}>
                <Link href={`/posts/${key.slug as string}`}>
                    <h3>{key.data.title as string}</h3>
                </Link>
                <p>{item.refs[0].wordaround}</p>
            </li>
        );
    });

    return (
        <>
            <h2>results</h2>
            <ul>{result.length > 0 ? lis : <li>No results found.</li>}</ul>
        </>
    );
}

export default function Index() {
    const search_fn = useRef<SearchFn>(null);
    const [result, setResult] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        search_fn.current = createSearchFn("/searchindex.json", setIsLoading);
    }, [])

    async function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
        if(search_fn.current) {
            const r = await search_fn.current(e.target.value);
            if(!(r instanceof StaticSeekError)) {
                setResult(r);
            }
        }
    }

    return (
        <main>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" placeholder="type your search query in English..." onChange={onChangeInput} />
            </div>
            {isLoading ? (<div>Loading index...</div>) : StaticSeekResult(result)}
        </main>
    );
}
