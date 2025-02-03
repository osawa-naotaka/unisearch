import type { Path, SearchEnv, SearchIndex, SearchResult } from "@src/frontend/base";
import { StaticSeekError } from "@src/frontend/base";
import {
    BinarySearchType,
    binarySearch,
    bitapKeyBigint,
    bitapKeyNumber,
    bitapSearch,
    createBitapKey,
} from "@src/util/algorithm";
import { excerptOneCodepointPerGraphem, splitByGrapheme } from "@src/util/preprocess";

export type ContentRange = {
    id: number;
    path: string;
    start: number;
    end: number;
};

type ContentRef = {
    id: number;
    path: string;
    pos: number;
    size: number;
};

export type FlatLinearIndexStringEntry = {
    key: Record<Path, unknown>[];
    content: string;
    content_length: number;
    num_id: number;
    toc: ContentRange[];
};

export class FlatLinearIndexString implements SearchIndex<FlatLinearIndexStringEntry> {
    public index_entry: FlatLinearIndexStringEntry;
    public gpu_content: Uint32Array;

    public constructor(index?: FlatLinearIndexStringEntry) {
        this.index_entry = index || {
            key: [],
            content: "",
            content_length: 0,
            num_id: 0,
            toc: [],
        };
        if (index) {
            this.gpu_content = new Uint32Array(this.index_entry.content_length);
            for (let i = 0; i < this.index_entry.content_length; i++) {
                this.gpu_content[i] = this.index_entry.content.charCodeAt(i);
            }
        } else {
            this.gpu_content = new Uint32Array();
        }
    }

    public setToIndex(id: number, path: Path, str: string): void {
        const graphemes = excerptOneCodepointPerGraphem(str);
        const start = this.index_entry.content_length;
        const end = start + graphemes.length - 1;
        this.index_entry.content += graphemes;
        this.index_entry.content_length += graphemes.length;
        this.index_entry.toc.push({ id: id, path: path, start: start, end: end });
        this.index_entry.num_id = Math.max(this.index_entry.num_id, id + 1);
    }

    public addKey(id: number, key: Record<Path, unknown>): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {
        this.gpu_content = new Uint32Array(this.index_entry.content_length);
        for (let i = 0; i < this.index_entry.content_length; i++) {
            this.gpu_content[i] = this.index_entry.content.charCodeAt(i);
        }
    }

    public async search(env: SearchEnv, keyword: string): Promise<SearchResult[]> {
        let poses: [number, number][] = [];
        if (env.distance === undefined || env.distance === 0) {
            poses = this.allIndexOf(keyword, this.index_entry.content);
        } else {
            const grapheme = splitByGrapheme(keyword).map((x) => x.charCodeAt(0));
            if (grapheme.length < 50) {
                const key = createBitapKey<number, number>(bitapKeyNumber(), grapheme);
                const raw_result = bitapSearch(key, env.distance, this.gpu_content);
                poses = this.mergeResults(raw_result);
            } else {
                const key = createBitapKey<bigint, number>(bitapKeyBigint(), grapheme);
                const raw_result = bitapSearch(key, env.distance, this.gpu_content);
                poses = this.mergeResults(raw_result);
            }
        }

        return this.createSearchResult(poses, keyword, env.weight);
    }

    protected mergeResults(raw_result: [number, number][]): [number, number][] {
        if (raw_result.length === 0) return [];

        const poses: [number, number][] = [];
        let latest_item = raw_result[0];
        let latest_pos = latest_item[0];

        for (const [pos, distance] of raw_result.slice(1)) {
            if (latest_pos + 1 === pos || latest_pos === pos) {
                latest_pos = pos;
                if (distance < latest_item[1]) {
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

    protected createSearchResult(poses: [number, number][], keyword: string, weight?: number): SearchResult[] {
        const result = new Map<number, SearchResult>();
        const content_size = new Map<number, Map<string, number>>();

        for (const pos of poses) {
            const cref = this.getReference(pos[0]);
            const r = result.get(cref.id) || {
                id: cref.id,
                key: this.index_entry.key[cref.id],
                score: 0,
                refs: [],
            };

            r.refs.push({
                token: keyword,
                path: cref.path,
                pos: cref.pos,
                wordaround: this.index_entry.content.slice(Math.max(pos[0] - 20, 0), pos[0] + keyword.length + 20),
                distance: pos[1],
            });

            result.set(cref.id, r);

            const id_size = content_size.get(cref.id) || new Map<string, number>();
            id_size.set(cref.path, cref.size);
            content_size.set(cref.id, id_size);
        }

        const idf = Math.log(this.index_entry.num_id / (result.size + 1)) + 1;
        for (const [_, r] of result) {
            const tf = r.refs
                .map(
                    (v) =>
                        v.token.length /
                        (content_size.get(r.id)?.get(v.path) || Number.POSITIVE_INFINITY) /
                        (v.distance + 1),
                )
                .reduce((x, y) => x + y);
            r.score = tf * idf * (weight || 1);
        }

        return Array.from(result.values());
    }

    private allIndexOf(keyword: string, content: string): [number, number][] {
        const result: [number, number][] = [];
        const grapheme = excerptOneCodepointPerGraphem(keyword);
        let pos = content.indexOf(grapheme);
        while (pos !== -1) {
            result.push([pos, 0]);
            pos = content.indexOf(grapheme, pos + grapheme.length);
        }
        return result;
    }

    protected getReference(pos: number): ContentRef {
        const index = binarySearch(
            { id: 0, path: "", start: pos, end: pos },
            (a, b) => (a.start < b.start ? -1 : a.end > b.end ? 1 : 0),
            this.index_entry.toc,
            BinarySearchType.Exact,
        );
        if (index === null) throw new StaticSeekError("staticseek: getReference internal error.");
        const toc = this.index_entry.toc[index];
        return {
            id: toc.id,
            path: toc.path,
            pos: pos - toc.start,
            size: toc.end - toc.start + 1,
        };
    }
}
