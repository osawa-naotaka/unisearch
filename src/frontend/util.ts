import type { SearchFn, SearchFnResult, StaticSeekIndex } from "@src/frontend/base";
import { StaticSeekError } from "@src/frontend/base";
import { createIndexFromObject } from "@src/frontend/indexing";
import { search } from "@src/frontend/search";

export type SearchFnCallback = (isLoading: boolean) => void;

export function createSearchFn(url: string, callback: SearchFnCallback = () => {}): SearchFn {
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
                        callback(true);
                        const response = await fetch(url);
                        if (!response.ok) throw new StaticSeekError(`fail to fetch index: ${response.statusText}`);
                        const json = await response.json();
                        const newIndex = createIndexFromObject(json);
                        if (newIndex instanceof StaticSeekError) throw newIndex;
                        index = newIndex;
                        callback(false);
                    }
                    const result = await search(index, query);
                    resolve(result);
                } catch (e) {
                    callback(false);
                    reject(e);
                }
            });

            if (!processing) {
                process();
            }
        });
    };
}
