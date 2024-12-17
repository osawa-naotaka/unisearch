import type { Path, SearchResult, SearchIndex } from "@src/base";
import { bitapSearch, createBitapKey } from "@src/algorithm";
import { defaultNormalizer } from "@src/preprocess";

export type LinearIndexEntry = Record<Path, string>[];

export class LinearIndex implements SearchIndex<LinearIndexEntry> {
    public readonly index_entry: LinearIndexEntry = [];

    public setToIndex(id: number, path: Path, str: string): void {
        if (this.index_entry[id] === undefined) {
            this.index_entry[id] = {};
        }
        this.index_entry[id][path] = defaultNormalizer(str);        
    }

    public search(search_targets: Path[], key_fields: Path[], distance: number, keyword: string): SearchResult[] {
        return this.searchToken(distance === 0 ? this.exactSearch : this.fuzzySearch(distance), search_targets, key_fields, keyword);
    }

    private exactSearch(keyword: string, target: string): [number, number][] {
        const result: [number, number][] = [];
        let pos = target.indexOf(keyword);
        while (pos !== -1) {
            result.push([pos, 0]);
            pos = target.indexOf(keyword, pos + keyword.length + 1);
        }
        return result;
    }

    private fuzzySearch = (maxerror: number) => (keyword: string, target: string): [number, number][] => {
        const key = createBitapKey(keyword);
        const result: [number, number][] = [];
        let pos = bitapSearch(key, maxerror, target);
        while (pos !== null) {
            result.push(pos);
            pos = bitapSearch(key, 1, target, pos[0] + keyword.length + 1);
        }
        return result;
    };

    private searchToken(
        search_fn: (keyword: string, target: string) => [number, number][],
        search_targets: Path[],
        key_fields: Path[],
        token: string
    ): SearchResult[] {
        const result = new Map<number, SearchResult>();
    
        // search all index
        this.index_entry.forEach((content, id) => {
            for (const path of search_targets.length === 0 ? Object.keys(content) : search_targets) {
                const search_target = content[path];
                const poses = search_fn(token, search_target);
                if (poses.length !== 0) {
                    for (const [pos, dist] of poses) {
                        const cur = result.get(id) || {
                            id: id,
                            keys: key_fields.map((key) => this.index_entry[id][key]),
                            score: 0,
                            refs: [],
                        };
                        cur.refs.push({
                            token: token,
                            path: path,
                            pos: pos,
                            wordaround: search_target.slice(Math.max(pos - 10, 0), pos + token.length + 10),
                            distance: dist,
                        });
                        result.set(id, cur);
                    }
                }
            }
        });

        return [...result.values()];
    }
}
