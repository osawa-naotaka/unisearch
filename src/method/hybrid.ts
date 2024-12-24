import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import type { IndexClass } from "@src/frontend/indexing";
import { hybridSpritter, isNonSpaceSeparatedChar } from "@src/util/preprocess";
import { intersectResults } from "@src/frontend/search";

export type HybridIndexEntry<T1, T2> = { ja: T1; en: T2 };

export function Hybrid<T1, T2>(name: string, ja: IndexClass, en: IndexClass): IndexClass {
    return {
        [name]: class implements SearchIndex<HybridIndexEntry<T1, T2>> {
            private ja: SearchIndex<T1>;
            private en: SearchIndex<T2>;

            public readonly index_entry: { ja: T1; en: T2 };

            constructor(index?: HybridIndexEntry<T1, T2>) {
                if (index) {
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

            public setToIndex(id: number, path: Path, str: string): void {
                const tokens = hybridSpritter([str]);
                for (const t of tokens) {
                    if (isNonSpaceSeparatedChar(t)) {
                        this.ja.setToIndex(id, path, t);
                    } else {
                        this.en.setToIndex(id, path, t);
                    }
                }
            }

            public addKey(id: number, key: string): void {
                this.ja.addKey(id, key);
                this.en.addKey(id, key);
            }

            public fixIndex(): void {
                this.ja.fixIndex();
                this.en.fixIndex();
            }

            public search(env: SearchEnv, keyword: string): SearchResult[] {
                const tokens = hybridSpritter([keyword]);
                const results = [];
                for (const t of tokens) {
                    if (isNonSpaceSeparatedChar(t)) {
                        results.push(this.ja.search(env, keyword));
                    } else {
                        results.push(this.en.search(env, keyword));
                    }
                }
                return intersectResults(results);
            }
        },
    }[name];
}
