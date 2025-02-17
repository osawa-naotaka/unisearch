import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import { bitapKeyBigint, bitapKeyNumber, bitapSearch, createBitapKey, refine } from "@src/util/algorithm";
import { splitByGrapheme } from "@src/util/preprocess";
import { z } from "zod";

const Term_z = z.string();
const Id_z = z.number();
const TF_z = z.number();
const PostingList_z = z.array(z.tuple([Id_z, TF_z]));
const Dictionary_z = z.array(z.tuple([Term_z, PostingList_z]))
export const InvertedIndexEntry_z = z.object({
    key: z.array(z.record(z.string(), z.unknown())),
    index: z.record(z.string(), Dictionary_z)
});

type Term = z.infer<typeof Term_z>;
type Id = z.infer<typeof Id_z>;
type TF = z.infer<typeof TF_z>;
type PostingList = z.infer<typeof PostingList_z>;
type Dictionary = z.infer<typeof Dictionary_z>;
type InvertedIndexEntry = z.infer<typeof InvertedIndexEntry_z>;

type TemporalPostingList = Map<Id, TF>;
type TemporalDictionary = Map<Term, TemporalPostingList>;
type TemporalIndexEntry = Map<Path, TemporalDictionary>;

export class InvertedIndex implements SearchIndex<InvertedIndexEntry> {
    public readonly index_entry: InvertedIndexEntry;
    private readonly temporal_index_entry: TemporalIndexEntry = new Map();

    constructor(index?: InvertedIndexEntry) {
        this.index_entry = index ? InvertedIndexEntry_z.parse(index) : { key: [], index: {} };
    }

    public setToIndex(id: Id, path: Path, str: string[]): void {
        const dict: TemporalDictionary = this.temporal_index_entry.get(path) || new Map();
        const plist: TemporalPostingList = dict.get(str.join("")) || new Map();
        const tf = (plist.get(id) || 0) + 1;
        plist.set(id, tf);
        dict.set(str.join(""), plist);
        this.temporal_index_entry.set(path, dict);
    }

    public addKey(id: number, key: Record<Path, unknown>): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {
        for (const [path, dict] of this.temporal_index_entry) {
            const d: Dictionary = [];
            for (const [term, plist] of dict) {
                d.push([term, Array.from(plist)]);
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
                        const r = bitapSearch(bitapkey, env.distance || 0, splitByGrapheme(term));
                        if (r.length !== 0) {
                            r.sort((a, b) => a[1] - b[1]);
                            const min_dist = r[0][1];
                            res.push([term, plist, min_dist]);
                        }
                    }
                } else {
                    const bitapkey = createBitapKey<bigint, string>(bitapKeyBigint(), keyword);
                    for (const [term, plist] of refined) {
                        const r = bitapSearch(bitapkey, env.distance || 0, splitByGrapheme(term));
                        if (r.length !== 0) {
                            r.sort((a, b) => a[1] - b[1]);
                            const min_dist = r[0][1];
                            res.push([term, plist, min_dist]);
                        }
                    }
                }
            }

            for (const [term, plist, distance] of res) {
                for (const [id, tf] of plist) {
                    const r = results.get(id) || { id: id, key: this.index_entry.key[id] || {}, score: 0, refs: [] };
                    r.refs.push({ token: term, path: path, distance: distance });
                    r.score += tf;
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
