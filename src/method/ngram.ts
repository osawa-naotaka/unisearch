import { generateNgram, generateNgramToTail } from "@src/util/algorithm";
import type { SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import type { Path } from "@src/frontend/base";
import type { IndexClass } from "@src/frontend/indexing";
import { splitByGrapheme } from "@src/util/preprocess";
import { createWithProp, intersectResults } from "@src/frontend/search";

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

            public search(env: SearchEnv, keyword: string): SearchResult[] {
                return intersectResults(
                    generateNgram(num_gram, splitByGrapheme(keyword)).map((t) =>
                        this.ngram_index.search(createWithProp(env, "distance", 0), t),
                    ),
                );
            }
        },
    }[name];
}
