import { bitapSearch, createBitapKey } from "@src/algorithm";
import type { BitapKey } from "@src/algorithm";
import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/base";
import { splitByGrapheme } from "@src/preprocess";

export type LinearIndexEntry = { key: string[]; index: Record<Path, string>[] };

export class LinearIndex implements SearchIndex<LinearIndexEntry> {
    public readonly index_entry: LinearIndexEntry;
    private grapheme_index: Record<Path, string[]>[] = [];

    constructor(index?: LinearIndexEntry) {
        this.index_entry = index || { key: [], index: [] };
        
        if (index) {
            index.index.forEach((rec, idx) => {
                if(this.grapheme_index[idx] === undefined) {
                    this.grapheme_index[idx] = {};
                }
                for (const k of Object.keys(rec)) {
                    this.grapheme_index[idx][k] = splitByGrapheme(rec[k]);
                }
            });
        }
    }

    public setToIndex(id: number, path: Path, str: string): void {
        if (this.index_entry.index[id] === undefined) {
            this.index_entry.index[id] = {};
        }
        this.index_entry.index[id][path] = str;

        if (this.grapheme_index[id] === undefined) {
            this.grapheme_index[id] = {};
        }
        this.grapheme_index[id][path] = splitByGrapheme(str);
    }

    public addKey(id: number, key: string): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {}

    public search(env: SearchEnv, keyword: string): SearchResult[] {
        if (env.distance === undefined || env.distance === 0) {
            return this.searchToken(
                this.index_entry.index,
                this.exactSearch(keyword),
                (pos, target) => target.slice(Math.max(pos - 10, 0), pos + keyword.length + 10),
                env.search_targets,
                env.weight || 1,
                keyword);
        }

        return this.searchToken(
            this.grapheme_index,
            this.fuzzySearch(env.distance, createBitapKey(splitByGrapheme(keyword))),
            (pos, target) => target.slice(Math.max(pos - 10, 0), pos + keyword.length + 10).join(""),
            env.search_targets,
            env.weight || 1,
            keyword,
        );
    }

    private exactSearch = (keyword: string) => (target: string): [number, number][] => {
        const result: [number, number][] = [];
        let pos = target.indexOf(keyword);
        while (pos !== -1) {
            result.push([pos, 0]);
            pos = target.indexOf(keyword, pos + keyword.length + 1);
        }
        return result;
    }

    private fuzzySearch =
        (maxerror: number, bitapkey: BitapKey) =>
        (target: string[]): [number, number][] =>
            bitapSearch(bitapkey, maxerror, target);

    private searchToken<T extends string | string[]>(
        index: Record<Path, T>[],
        search_fn: (target: T) => [number, number][],
        wordaround_fn: (pos: number, target: T) => string,
        search_targets: Path[] | undefined,
        weight: number,
        token: string,
    ): SearchResult[] {
        const result = new Map<number, SearchResult>();

        // search all index
        index.forEach((content, id) => {
            for (const path of search_targets || Object.keys(content)) {
                const search_target = content[path];
                const poses = search_fn(search_target);
                if (poses.length !== 0) {
                    for (const [pos, dist] of poses) {
                        const cur = result.get(id) || {
                            id: id,
                            key: this.index_entry.key[id],
                            score: 0,
                            refs: [],
                        };
                        cur.refs.push({
                            token: token,
                            path: path,
                            pos: pos,
                            wordaround: wordaround_fn(pos, search_target),
                            distance: dist,
                        });
                        result.set(id, cur);
                    }
                }
            }
        });

        const idf = Math.log(this.index_entry.index.length / (result.size + 1)) + 1;
        for (const [_, r] of result) {
            const tf = r.refs
                .map((v) => v.token.length / this.index_entry.index[r.id][v.path].length / (v.distance + 1))
                .reduce((x, y) => x + y);
            r.score = tf * idf * weight;
        }

        return [...result.values()];
    }
}
