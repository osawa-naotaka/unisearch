
import { SearchIndex, Path, SearchEnv, SearchResult } from "@src/base";
import { IndexClass } from "@src/indexing";
import { defaultSpritter, isNonSpaceSeparatedChar } from "@src/preprocess";

export type HybridIndexEntry<T1, T2> = {ja: T1, en: T2};

export function Hybrid<T1, T2>(name: string, ja: IndexClass, en: IndexClass): IndexClass {
    return {
        [name]: class implements SearchIndex<HybridIndexEntry<T1, T2>> {
            private ja: SearchIndex<T1>;
            private en: SearchIndex<T2>;
            
            public readonly index_entry: {ja: T1, en: T2};

            constructor(index?: HybridIndexEntry<T1, T2>) {
                if(index) {
                    this.index_entry = index;
                    this.ja = new ja(this.index_entry.ja);
                    this.en = new en(this.index_entry.en);
                } else {
                    this.ja = new ja;
                    this.en = new en;
                    this.index_entry = {
                        ja: this.ja.index_entry,
                        en: this.en.index_entry,
                    }
                }
            }
    
            public setToIndex(id: number, path: Path, str: string): void {
                const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
                const tokens = defaultSpritter([str]);
                for(const t of tokens) {
                    if(isNonSpaceSeparatedChar([...t][0])) {
                        this.ja.setToIndex(id, path, t);
                    } else {
                        this.en.setToIndex(id, path, t);
                    }
                }
            }

            public addKey(id: number, path: Path, key: string): void {
                this.ja.addKey(id, path, key);
                this.en.addKey(id, path, key);
            }

            public fixIndex(): void {
                this.ja.fixIndex();
                this.en.fixIndex();                
            }
    
            public search(env: SearchEnv, keyword: string): SearchResult[] {
                const tokens = defaultSpritter([keyword]);
                const results = [];
                for(const t of tokens) {
                    if(isNonSpaceSeparatedChar([...t][0])) {
                        results.push(this.ja.search(env, keyword));
                    } else {
                        results.push(this.en.search(env, keyword));
                    }
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
