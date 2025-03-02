import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import { getWeight } from "@src/frontend/indexing";
import { bitapKeyBigint, bitapKeyNumber, bitapSearch, createBitapKey, refine } from "@src/util/algorithm";
import { splitByGrapheme } from "@src/util/preprocess";
import * as v from "valibot";

const Term_v = v.string();
const Id_v = v.number();
const TFIDF_v = v.number();
const PostingList_v = v.array(v.tuple([Id_v, TFIDF_v]));
const Dictionary_v = v.array(v.tuple([Term_v, PostingList_v]));
export const InvertedIndexEntry_v = v.object({
    key: v.array(v.record(v.string(), v.unknown())),
    index: v.record(v.string(), Dictionary_v),
});

type Term = v.InferOutput<typeof Term_v>;
type Id = v.InferOutput<typeof Id_v>;
type TFIDF = v.InferOutput<typeof TFIDF_v>;
type PostingList = v.InferOutput<typeof PostingList_v>;
type Dictionary = v.InferOutput<typeof Dictionary_v>;
type InvertedIndexEntry = v.InferOutput<typeof InvertedIndexEntry_v>;

type TemporalPostingList = Map<Id, TFIDF>;
type TemporalDictionary = Map<Term, TemporalPostingList>;
type TemporalIndexEntry = Map<Path, TemporalDictionary>;
type DocumentLength = Map<Path, number>[];

export class InvertedIndex implements SearchIndex<InvertedIndexEntry> {
    public readonly index_entry: InvertedIndexEntry;
    private readonly temporal_index_entry: TemporalIndexEntry = new Map();
    private readonly document_length: DocumentLength = [];

    constructor(index?: InvertedIndexEntry) {
        this.index_entry = index ? v.parse(InvertedIndexEntry_v, index) : { key: [], index: {} };
    }

    public setToIndex(id: Id, path: Path, str: string[]): void {
        const dict: TemporalDictionary = this.temporal_index_entry.get(path) || new Map();
        const plist: TemporalPostingList = dict.get(str.join("")) || new Map();
        const tf = (plist.get(id) || 0) + 1;
        plist.set(id, tf);
        dict.set(str.join(""), plist);
        this.temporal_index_entry.set(path, dict);
    }

    public setDocumentLength(id: number, path: Path, length: number): void {
        this.document_length[id] = this.document_length[id] || new Map();
        this.document_length[id].set(path, length);
    }

    public addKey(id: number, key: Record<Path, unknown>): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {
        for (const [path, dict] of this.temporal_index_entry) {
            const d: Dictionary = [];
            for (const [term, plist] of dict) {
                const idf = Math.log(this.document_length.length / (plist.size + 1)) + 1;
                const new_plist: PostingList = [];
                for (const [id, tf_tmp] of plist) {
                    const tf = tf_tmp / (this.document_length[id].get(path) || Number.POSITIVE_INFINITY);
                    new_plist.push([id, tf * idf]);
                }
                d.push([term, new_plist]);
            }
            d.sort(this.comp);
            this.index_entry.index[path] = d;
        }
    }

    public async search(env: SearchEnv, keyword: string[]): Promise<SearchResult[]> {
        const results = new Map<Id, SearchResult>();
        for (const path of env.search_targets || Object.keys(this.index_entry.index)) {
            let res: [string, PostingList, number][] = [];
            if (env.distance === 0) {
                res = refine([keyword.join(""), []], this.prefixComp, this.index_entry.index[path] || []).map(
                    ([term, plist]) => [term, plist, 0],
                );
            } else {
                const refined = refine([keyword[0], []], this.prefixComp, this.index_entry.index[path] || []);
                if (keyword.length < 32) {
                    const bitapkey = createBitapKey<number, string>(bitapKeyNumber(), keyword);
                    for (const [term, plist] of refined) {
                        const r = bitapSearch(bitapkey, env.distance, splitByGrapheme(term));
                        if (r.length !== 0) {
                            r.sort((a, b) => a[1] - b[1]);
                            const min_dist = r[0][1];
                            res.push([term, plist, min_dist]);
                        }
                    }
                } else {
                    const bitapkey = createBitapKey<bigint, string>(bitapKeyBigint(), keyword);
                    for (const [term, plist] of refined) {
                        const r = bitapSearch(bitapkey, env.distance, splitByGrapheme(term));
                        if (r.length !== 0) {
                            r.sort((a, b) => a[1] - b[1]);
                            const min_dist = r[0][1];
                            res.push([term, plist, min_dist]);
                        }
                    }
                }
            }

            for (const [term, plist, distance] of res) {
                for (const [id, tfidf] of plist) {
                    const r = results.get(id) || { id: id, key: this.index_entry.key[id] || {}, score: 0, refs: [] };
                    r.refs.push({ token: term, path: path, distance: distance });
                    r.score += (tfidf * getWeight(env.weights, path) * term.length) / (distance + 1);
                    results.set(id, r);
                }
            }
        }
        return Array.from(results.values());
    }

    private comp([a]: [Term, PostingList], [b]: [Term, PostingList]) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    private prefixComp([key]: [Term, PostingList], [item]: [Term, PostingList]) {
        return item.startsWith(key) ? 0 : key < item ? -1 : 1;
    }
}
