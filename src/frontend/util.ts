import type { SearchResult, StaticSeekIndex } from "@src/frontend/base";
import { StaticSeekError } from "@src/frontend/base";
import { createIndexFromObject } from "@src/frontend/indexing";
import { search } from "@src/frontend/search";

type SearchFnResult = Promise<SearchResult[] | StaticSeekError>;
type SearchFn = (query: string) => SearchFnResult;

export function createSearchFn(url: string): SearchFn {
    let index: StaticSeekIndex | null = null;
    const queue: (() => Promise<void>)[] = [];
    let processing = false;

    async function process(): Promise<void> {
        processing = true;
        while (queue.length > 0) {
            const task = queue.shift();
            if (task) {
                await task();
            }
        }
        processing = false;
    }

    return (query: string): SearchFnResult => {
        return new Promise((resolve, reject) => {
            queue.push(async () => {
                try {
                    if (index === null) {
                        const response = await fetch(url);
                        if (!response.ok) throw new StaticSeekError(`fail to fetch index: ${response.statusText}`);
                        const json = await response.json();
                        const newIndex = createIndexFromObject(json);
                        if (newIndex instanceof StaticSeekError) throw newIndex;
                        index = newIndex;
                    }
                    const result = await search(index, query);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });

            if (!processing) {
                process();
            }
        });
    };
}
