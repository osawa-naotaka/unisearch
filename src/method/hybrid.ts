import { StaticSeekError } from "@src/frontend/base";
import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import type { IndexClass } from "@src/frontend/indexing";
import { adjastDistance, intersectResults } from "@src/frontend/search";
import { hybridSpritter, isNonSpaceSeparatedChar } from "@src/util/preprocess";

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
                const tokens = hybridSpritter([str]);
                for (const t of tokens) {
                    if (isNonSpaceSeparatedChar(t[0])) {
                        this.ja.setToIndex(id, path, t);
                    } else {
                        this.en.setToIndex(id, path, t);
                    }
                }
            }

            public setDocumentLength(id: number, path: Path, length: number): void {
                this.ja.setDocumentLength(id, path, length);
                this.en.setDocumentLength(id, path, length);
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
                const tokens = hybridSpritter([keyword]);
                const results = [];
                for (const grapheme of tokens) {
                    const adj_env = adjastDistance(env, grapheme);
                    if (isNonSpaceSeparatedChar(grapheme[0])) {
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
