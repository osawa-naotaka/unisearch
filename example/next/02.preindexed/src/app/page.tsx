"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { StaticSeekError, createSearchFn } from "staticseek";
import type { SearchResult, Reference, SearchFn } from "staticseek";
import * as v from "valibot";

const schema = v.object({
    slug: v.string(),
    data: v.object({
        title: v.string(),
    }),
});

function emphasizeKeyword(refs: Reference[]): JSX.Element {
    const ref = refs[0]
    if(ref.wordaround && ref.keyword_range) {
        const wa_pre = ref.wordaround.slice(0, ref.keyword_range[0]);
        const wa_kwd = ref.wordaround.slice(ref.keyword_range[0], ref.keyword_range[1]);
        const wa_post = ref.wordaround.slice(ref.keyword_range[1]);
        return (
            <>
                {wa_pre}
                <em>{wa_kwd}</em>
                {wa_post}
            </>
        );
    }

    return <></>;
}

function StaticSeekResult(result: SearchResult[]): JSX.Element {
    const lis = result.map((item) => {
        const key = v.parse(schema, item.key);
        return (
            <li key={key.slug}>
                <Link href={`/posts/${key.slug}`}>
                    <h3>{key.data.title}</h3>
                </Link>
                <p>{emphasizeKeyword(item.refs)}</p>
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
    }, []);

    async function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
        if (search_fn.current) {
            const r = await search_fn.current(e.target.value);
            if (!(r instanceof StaticSeekError)) {
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
            {isLoading ? <div>Loading index...</div> : StaticSeekResult(result)}
        </main>
    );
}
