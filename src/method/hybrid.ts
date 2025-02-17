import { StaticSeekError } from "@src/frontend/base";
import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import type { IndexClass } from "@src/frontend/indexing";
import { adjastDistance, intersectResults } from "@src/frontend/search";
import { hybridSpritter, isNonSpaceSeparatedChar, splitByGrapheme } from "@src/util/preprocess";

export type HybridIndexEntry<T1, T2> = { ja: T1; en: T2 };

export function Hybrid<T1, T2>(name: string, ja: IndexClass, en: IndexClass): IndexClass {
    return {
        [name]: class implements SearchIndex<HybridIndexEntry<T1, T2>> {
            private ja: SearchIndex<T1>;
            private en: SearchIndex<T2>;

            public readonly index_entry: { ja: T1; en: T2 };

            constructor(index?: HybridIndexEntry<T1, T2>) {
                if (index) {
                    if (index.ja === undefined || index.en === undefined) {
                        throw new StaticSeekError("StaticSeek: malformed index structure: Hybrid.");
                    }
                    this.index_entry = index;
                    this.ja = new ja(this.index_entry.ja);
                    this.en = new en(this.index_entry.en);
                } else {
                    this.ja = new ja();
                    this.en = new en();
                    this.index_entry = {
                        ja: this.ja.index_entry,
                        en: this.en.index_entry,
                    };
                }
            }

            public setToIndex(id: number, path: Path, str: string[]): void {
                const tokens = hybridSpritter([str.join("")]);
                for (const t of tokens) {
                    if (isNonSpaceSeparatedChar(t)) {
                        this.ja.setToIndex(id, path, splitByGrapheme(t));
                    } else {
                        this.en.setToIndex(id, path, splitByGrapheme(t));
                    }
                }
            }

            public addKey(id: number, key: Record<Path, unknown>): void {
                this.ja.addKey(id, key);
                this.en.addKey(id, key);
            }

            public fixIndex(): void {
                this.ja.fixIndex();
                this.en.fixIndex();
            }

            public async search(env: SearchEnv, keyword: string[]): Promise<SearchResult[]> {
                const tokens = hybridSpritter([keyword.join("")]);
                const results = [];
                for (const t of tokens) {
                    const grapheme = splitByGrapheme(t);
                    const adj_env = adjastDistance(env, grapheme);
                    if (isNonSpaceSeparatedChar(t)) {
                        results.push(await this.ja.search(adj_env, grapheme));
                    } else {
                        results.push(await this.en.search(adj_env, grapheme));
                    }
                }
                return intersectResults(results);
            }
        },
    }[name];
}
