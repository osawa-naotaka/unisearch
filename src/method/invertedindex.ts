import { bitapSearch, createBitapKey, refine } from "@src/algorithm";
import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/base";

type Term = string;
type Id = number;
type TF = number;
type PostingList = [Id, TF][];
type Dictionary = [Term, PostingList][]
export type InvertedIndexEntry = { key: string[], index: Record<Path, Dictionary> };

type TemporalPostingList = Map<Id, TF>;
type TemporalDictionary = Map<Term, TemporalPostingList>;
type TemporalIndexEntry = Map<Path, TemporalDictionary>;

export class InvertedIndex implements SearchIndex<InvertedIndexEntry> {
    public readonly index_entry: InvertedIndexEntry;
    private readonly temporal_index_entry: TemporalIndexEntry = new Map();

    constructor(index?: InvertedIndexEntry) {
        this.index_entry = index || { key: [], index: {} };
    }

    public setToIndex(id: Id, path: Path, str: string): void {
        const dict: TemporalDictionary = this.temporal_index_entry.get(path) || new Map();
        const plist: TemporalPostingList = dict.get(str) || new Map();
        const tf = (plist.get(id) || 0) + 1;
        plist.set(id, tf);
        dict.set(str, plist);
        this.temporal_index_entry.set(path, dict);
    }

    public addKey(id: number, _path: Path, key: string): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {
        for(const [path, dict] of this.temporal_index_entry) {
            const d: Dictionary = [];
            for(const [term, plist] of dict) {
                d.push([term, Array.from(plist)])
            }
            d.sort(this.comp);
            this.index_entry.index[path] = d;
        }
    }

    public search(env: SearchEnv, keyword: string): SearchResult[] {
        const results = new Map<Id, SearchResult>();
        const bitapkey = createBitapKey(keyword);
        for(const path of env.search_targets || Object.keys(this.index_entry.index)) {
            const res: Dictionary = env.distance === 0
                ? refine([keyword, []], this.prefixComp, this.index_entry.index[path] || [])
                : refine([[...keyword][0], []], this.prefixComp, this.index_entry.index[path] || []).filter(([term]) => bitapSearch(bitapkey, env.distance || 0, term) !== null);
            for(const [term, plist] of res) {
                for(const [id, tf] of plist) {
                    const r = results.get(id) || { id: id, key: this.index_entry.key[id], score: 0, refs: [] };
                    r.refs.push({ token: term, path: path, pos: 0, wordaround: "", distance: 0 });  // todo: fix distance
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