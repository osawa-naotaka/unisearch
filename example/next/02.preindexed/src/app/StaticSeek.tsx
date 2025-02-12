import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";

type StaticSeekProps = {
    query: string;
    indexUrl: string;
    suspense: JSX.Element;
    children: (result: SearchResult[]) => JSX.Element;
};

export default function StaticSeek({ query, indexUrl, suspense, children }: StaticSeekProps) {
    const index = useRef<StaticSeekIndex | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<SearchResult[]>([]);

    const search_async = async () => {
        if (index.current) {
            const start = performance.now();
            const result = await search(index.current, query);
            if (result instanceof StaticSeekError) {
                console.error(`fail to search: ${result.message}`);
                return;
            }
            console.log(`search took ${performance.now() - start} ms`);
            setResult(result);
        }
    };

    // biome-ignore lint: ignore dependencies
    useEffect(() => {
        const fetchIndex = async () => {
            const start = performance.now();
            const response = await fetch(indexUrl);
            if (!response.ok) {
                console.error(`fail to fetch index: ${response.statusText}`);
                return;
            }
            const response_json = await response.json();
            const newIndex = createIndexFromObject(response_json);
            if (newIndex instanceof StaticSeekError) {
                console.error(`fail to create index: ${newIndex.message}`);
                return;
            }
            console.log(`loading index took ${performance.now() - start} ms`);
            index.current = newIndex;
            setLoading(false);
            search_async();
        };

        if (index.current === null) {
            fetchIndex();
        }

        return () => {};
    }, []);

    // biome-ignore lint: include dependencies for search_async
    useEffect(() => {
        search_async();
        return () => {};
    }, [index, query]);

    return loading ? suspense : children(result);
}
