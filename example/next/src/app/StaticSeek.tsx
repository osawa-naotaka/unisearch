import { useState, useRef, useEffect, JSX } from "react";
import { StaticSeekError, createIndexFromObject, search } from "staticseek";
import type { SearchResult, StaticSeekIndex } from "staticseek";

export default function StaticSeek({ query, indexUrl, render }: { query: string, indexUrl: string, render: (result: SearchResult[]) => JSX.Element }) {
    const index = useRef<StaticSeekIndex | null>(null);
    const [result, setResult] = useState<SearchResult[]>([]);

    const search_async = async () => {
        if(index.current) {
            const start = performance.now();
            const result = await search(index.current, query);
            if(result instanceof StaticSeekError){
                console.error(`fail to search: ${result.message}`);
                return ;
            }
            console.log(`search took ${performance.now() - start} ms`);
            setResult(result);
        }
    };

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
            if(newIndex instanceof StaticSeekError){
                console.error(`fail to create index: ${newIndex.message}`);
                return;
            }
            console.log(`loading index took ${performance.now() - start} ms`);
            index.current = newIndex;
            search_async();
        };

        if(index.current === null) {
            fetchIndex();
        }

        return () => { };
    }, []);

    useEffect(() => {
        search_async();
        return () => { };
    }, [index, query]);

    return render(result);
}
