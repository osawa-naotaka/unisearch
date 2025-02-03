"use client";

import type { SearchKey } from "@/app/searchindex.json/route.ts";
import Link from "next/link";
import { useState } from "react";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";

export default function Index() {
    const INDEX_STATE = {
        NOT_INITIALIZED: 0,
        FETCHING: 1,
        INITIALIZED: 2,
    } as const;
    type INDEX_STATE = (typeof INDEX_STATE)[keyof typeof INDEX_STATE];

    const [results, setResults] = useState<SearchResult[]>([]);
    const [index_state, setIndexState] = useState<INDEX_STATE>(INDEX_STATE.NOT_INITIALIZED);
    const [index, setIndex] = useState<StaticSeekIndex | null>(null);

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const start = performance.now();
        if (index_state === INDEX_STATE.FETCHING) return;
        if (index_state !== INDEX_STATE.INITIALIZED) {
            setIndexState(INDEX_STATE.FETCHING);

            const response = await fetch("/searchindex.json");
            if (!response.ok) {
                console.error(`fail to fetch index: ${response.statusText}`);
                setIndexState(INDEX_STATE.NOT_INITIALIZED);
                return;
            }
            const response_json = await response.json();
            const newIndex = createIndexFromObject(response_json);

            if (newIndex instanceof StaticSeekError) {
                console.error(newIndex);
                setIndexState(INDEX_STATE.NOT_INITIALIZED);
                return;
            }

            setIndex(newIndex);

            const results = await search(newIndex, e.target.value);
            if (results instanceof StaticSeekError) {
                console.error(results);
                return;
            }
            setResults(results);
            console.log(`search time: ${performance.now() - start}ms`);
            setIndexState(INDEX_STATE.INITIALIZED);
            return;
        }

        if (!index) return;
        const results = await search(index, e.target.value);
        if (results instanceof StaticSeekError) {
            console.error(results);
            return;
        }
        setResults(results);
        console.log(`search time: ${performance.now() - start}ms`);
    };

    return (
        <section>
            <div className="input-area">
                <div>search</div>
                <input type="text" name="search" id="search" onChange={handleSearch} />
            </div>
            <h2>results</h2>
            <ul>
                {index_state === INDEX_STATE.FETCHING && <li>loading search index...</li>}
                {results.length === 0 && <li>No results found.</li>}
                {results.map((r) => {
                    const post = r.key as SearchKey; // ad-hock solution. you might as well use zod or something like that to validate the key.
                    if (!post.data.title || !post.slug) throw new Error("title or slug is not found in the search result.");

                    return (
                        <li key={post.slug}>
                            <Link href={`/posts/${post.slug}`}>
                                <h3>{post.data.title}</h3>
                            </Link>
                            <p>{r.refs[0].wordaround}</p>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

async function execSearch(index: StaticSeekIndex, searchText: string): Promise<SearchResult[]> {
    const results = await search(index, searchText);
    return results instanceof StaticSeekError ? [] : results;
}
