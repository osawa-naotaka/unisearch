import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import { StaticSeekError } from "@src/frontend/base";
import { getWeight } from "@src/frontend/indexing";
import {
    BinarySearchType,
    binarySearch,
    bitapKeyBigint,
    bitapKeyNumber,
    bitapSearch,
    createBitapKey,
} from "@src/util/algorithm";
import * as v from "valibot";

const ContentRange_v = v.object({
    id: v.number(),
    path: v.string(),
    start: v.number(),
    end: v.number(),
});
type ContentRange = v.InferOutput<typeof ContentRange_v>;

export const LinearIndexEntry_v = v.object({
    key: v.array(v.record(v.string(), v.unknown())),
    content: v.string(),
    content_length: v.number(),
    num_id: v.number(),
    toc: v.array(ContentRange_v),
});
export type LinearIndexEntry = v.InferOutput<typeof LinearIndexEntry_v>;

export class LinearIndex implements SearchIndex<LinearIndexEntry> {
    public index_entry: LinearIndexEntry;
    public u32_content: Uint32Array;

    public constructor(index?: LinearIndexEntry) {
        this.index_entry = index
            ? v.parse(LinearIndexEntry_v, index)
            : {
                  key: [],
                  content: "",
                  content_length: 0,
                  num_id: 0,
                  toc: [],
              };
        if (index) {
            this.u32_content = new Uint32Array(this.index_entry.content_length);
            for (let i = 0; i < this.index_entry.content_length; i++) {
                this.u32_content[i] = this.index_entry.content.charCodeAt(i);
            }
        } else {
            this.u32_content = new Uint32Array();
        }
    }

    public setToIndex(id: number, path: Path, str: string[]): void {
        const graphemes = str.map((c) => c[0]).join("");
        const start = this.index_entry.content_length;
        const end = start + graphemes.length - 1;
        this.index_entry.content += graphemes;
        this.index_entry.content_length += graphemes.length;
        this.index_entry.toc.push({ id: id, path: path, start: start, end: end });
        this.index_entry.num_id = Math.max(this.index_entry.num_id, id + 1);
    }

    public setDocumentLength(_id: number, _path: Path, _length: number): void {}

    public addKey(id: number, key: Record<string, unknown>): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {
        this.u32_content = new Uint32Array(this.index_entry.content_length);
        for (let i = 0; i < this.index_entry.content_length; i++) {
            this.u32_content[i] = this.index_entry.content.charCodeAt(i);
        }
    }

    public async search(env: SearchEnv, keyword: string[]): Promise<SearchResult[]> {
        let poses: [number, number][] = [];
        if (env.distance === 0) {
            poses = this.allIndexOf(keyword, this.index_entry.content);
        } else {
            const grapheme = keyword.map((x) => x.charCodeAt(0));
            if (grapheme.length <= 32) {
                const key = createBitapKey<number, number>(bitapKeyNumber(), grapheme);
                const raw_result = bitapSearch(key, env.distance, this.u32_content);
                poses = this.mergeResults(raw_result);
            } else {
                const key = createBitapKey<bigint, number>(bitapKeyBigint(), grapheme);
                const raw_result = bitapSearch(key, env.distance, this.u32_content);
                poses = this.mergeResults(raw_result);
            }
        }

        return this.createSearchResult(poses, keyword.join(""), env);
    }

    protected mergeResults(raw_result: [number, number][]): [number, number][] {
        if (raw_result.length === 0) return [];

        const poses: [number, number][] = [];
        let latest_item = raw_result[0];
        let latest_pos = latest_item[0];

        for (const [pos, distance] of raw_result.slice(1)) {
            if (latest_pos + 1 === pos || latest_pos === pos) {
                latest_pos = pos;
                if (distance <= latest_item[1]) {
                    latest_item = [pos, distance];
                }
            } else {
                poses.push(latest_item);
                latest_item = [pos, distance];
                latest_pos = pos;
            }
        }
        poses.push(latest_item);

        return poses;
    }

    protected createSearchResult(poses: [number, number][], keyword: string, env: SearchEnv): SearchResult[] {
        const result = new Map<number, SearchResult>();
        const content_size = new Map<number, Map<string, number>>();

        for (const pos of poses) {
            const cref = this.getReference(pos[0]);
            if (env.search_targets) {
                const path = binarySearch(
                    cref.path,
                    (a, b) => a.localeCompare(b),
                    env.search_targets,
                    BinarySearchType.Exact,
                );
                if (path === null) continue;
            }
            const find_pos = pos[0] - cref.start;
            const size = cref.end - cref.start + 1;
            const r = result.get(cref.id) || {
                id: cref.id,
                key: this.index_entry.key[cref.id] || {},
                score: 0,
                refs: [],
            };

            const wa_begin = Math.max(pos[0] - 100, cref.start);
            const wa_end = Math.min(pos[0] + keyword.length + 100, cref.end + 1);
            r.refs.push({
                token: keyword,
                path: cref.path,
                pos: find_pos,
                wordaround: this.index_entry.content.slice(wa_begin, wa_end),
                keyword_range: [pos[0] - wa_begin, pos[0] - wa_begin + keyword.length],
                distance: pos[1],
            });

            result.set(cref.id, r);

            const id_size = content_size.get(cref.id) || new Map<string, number>();
            id_size.set(cref.path, size);
            content_size.set(cref.id, id_size);
        }

        const idf = Math.log(this.index_entry.num_id / (result.size + 1)) + 1;
        for (const [_, r] of result) {
            const tf = r.refs
                .map(
                    (v) =>
                        (getWeight(env.weights, v.path) * v.token.length) /
                        (content_size.get(r.id)?.get(v.path) || Number.POSITIVE_INFINITY) /
                        (v.distance + 1),
                )
                .reduce((x, y) => x + y);
            r.score = tf * idf;
        }

        return Array.from(result.values());
    }

    private allIndexOf(keyword: string[], content: string): [number, number][] {
        const result: [number, number][] = [];
        const grapheme = keyword.map((c) => c[0]).join("");
        let pos = content.indexOf(grapheme);
        while (pos !== -1) {
            result.push([pos, 0]);
            pos = content.indexOf(grapheme, pos + grapheme.length);
        }
        return result;
    }

    protected getReference(pos: number): ContentRange {
        const index = binarySearch(
            { id: 0, path: "", start: pos, end: pos },
            (a, b) => (a.start < b.start ? -1 : a.end > b.end ? 1 : 0),
            this.index_entry.toc,
            BinarySearchType.Exact,
        );
        if (index === null) throw new StaticSeekError("staticseek: getReference internal error.");
        return this.index_entry.toc[index];
    }
}
