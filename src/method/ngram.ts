import type { SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import type { Path } from "@src/frontend/base";
import type { IndexClass } from "@src/frontend/indexing";
import { createWithProp, intersectResults } from "@src/frontend/search";
import { generateNgram, generateNgramToTail } from "@src/util/algorithm";
import { splitByGrapheme } from "@src/util/preprocess";

export function Ngram<T>(num_gram: number, index_class: IndexClass): IndexClass {
    const name = `N${num_gram}gram`;
    return {
        [name]: class implements SearchIndex<T> {
            private readonly ngram_index: SearchIndex<T>;
            public readonly index_entry: T;

            constructor(index?: T) {
                if (index) {
                    this.index_entry = index;
                    this.ngram_index = new index_class(this.index_entry);
                } else {
                    this.ngram_index = new index_class();
                    this.index_entry = this.ngram_index.index_entry;
                }
            }

            public setToIndex(id: number, path: Path, str: string): void {
                const tokens = generateNgramToTail(num_gram, splitByGrapheme(str));
                for (const t of tokens) {
                    this.ngram_index.setToIndex(id, path, t);
                }
            }

            public addKey(id: number, key: string): void {
                this.ngram_index.addKey(id, key);
            }

            public fixIndex(): void {
                this.ngram_index.fixIndex();
            }

            public async search(env: SearchEnv, keyword: string): Promise<SearchResult[]> {
                const grapheme = splitByGrapheme(keyword);
                const search_env = createWithProp(env, "distance", grapheme.length < num_gram ? 1 : 0);
                const max_match = Math.max(1, grapheme.length - num_gram + 1);
                const threshold =
                    grapheme.length < num_gram ? 1 : Math.max(1, max_match - (env.distance || 0) * num_gram);
                return intersectResultsNgram(
                    threshold,
                    await Promise.all(generateNgram(num_gram, grapheme).map((t) => this.ngram_index.search(search_env, t))),
                );
            }
        },
    }[name];
}

function intersectResultsNgram(threshold: number, results: SearchResult[][]): SearchResult[] {
    const union = unionResults(results).filter((x) => x.length >= threshold);
    return union.flatMap((x) => intersectResults(x.map((y) => [y])));
}

function unionResults(results: SearchResult[][]): SearchResult[][] {
    const result = new Map<number, SearchResult[]>();
    for (const r of results) {
        for (const c of r) {
            const cur = result.get(c.id) || [];
            cur.push(c);
            result.set(c.id, cur);
        }
    }
    return Array.from(result.values());
}
