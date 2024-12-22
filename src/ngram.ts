import { IndexClass } from "@src/indexing";
import { SearchIndex, SearchEnv, SearchResult } from "@src/base";
import { Path } from "@src/base";
import { generateNgramToTail, generateNgram } from "@src/algorithm";
import { createWithProp } from "./search";

export function Ngram<T>(num_gram: number, index_class: IndexClass): IndexClass {
    const name = `N${num_gram}gram`;
    return {
        [name]: class implements SearchIndex<T> {
            private readonly ngram_index: SearchIndex<T>;
            public readonly index_entry: T;

            constructor(index?: T) {
                if(index) {
                    this.index_entry = index;
                    this.ngram_index = new index_class(this.index_entry);
                } else {
                    this.ngram_index = new index_class();
                    this.index_entry = this.ngram_index.index_entry;
                }
            }
    
            public setToIndex(id: number, path: Path, str: string): void {
                const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
                const tokens = generateNgramToTail(num_gram, str);
                for(const t of tokens) {
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
                const tokens = generateNgram(num_gram, keyword);
                const results = [];
                for(const t of tokens) {
                    results.push(this.ngram_index.search(createWithProp(env, "distance", 0), t));   // forward match
                }
                return intersectResults(results);
            }
        }    
    }[name];
} 

function intersectResults(results: SearchResult[][]): SearchResult[] {
    return results.reduce((prev, cur) => {
        const result: SearchResult[] = [];
        for (const p of prev) {
            const c = cur.find((x) => x.id === p.id);
            if (c) result.push({ id: c.id, key: c.key, score: c.score + p.score, refs: [...p.refs, ...c.refs] });
        }
        return result ;
    });
}
