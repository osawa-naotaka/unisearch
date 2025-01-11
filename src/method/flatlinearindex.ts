import { Path, SearchEnv, SearchIndex, SearchResult, UniSearchError } from "@src/frontend/base";
import { splitByGrapheme, excerptOneCodepointPerGraphem } from "@src/util/preprocess";
import { binarySearch, BinarySearchType, bitapKeyNumber, bitapKeyBigint, createBitapKey, bitapSearch } from "@src/util/algorithm";

export type ContentRange = {
    id: number;
    path: string;
    start: number;
    end: number;
}

type ContentRef = {
    id: number;
    path: string;
    pos: number;
}

type BitapKeyUint32 = {
    mask: Map<number, number>;
    length: number;
};


export type FlatLinearIndexEntry = { key: string[]; content: string; toc: ContentRange[] };

export class FlatLinearIndex implements SearchIndex<FlatLinearIndexEntry> {
    public index_entry: FlatLinearIndexEntry;
    private gpu_content: Uint32Array;

    public constructor(index?: FlatLinearIndexEntry) {
        this.index_entry = index || { key: [], content: "", toc: [] };
        if(index) {
            this.gpu_content = new Uint32Array(index.content.length);
            for(let i = 0; i < index.content.length; i++) {
                this.gpu_content[i] = index.content.charCodeAt(i);
            }
        } else {
            this.gpu_content = new Uint32Array();
        }
    }

    public setToIndex(id: number, path: Path, str: string): void {
        const graphemes = excerptOneCodepointPerGraphem(str);
        const start = this.index_entry.content.length;
        const end = start + graphemes.length - 1;
        this.index_entry.content += graphemes;
        this.index_entry.toc.push({id: id, path: path, start: start, end: end});
    }

    public addKey(id: number, key: string): void {
        this.index_entry.key[id] = key;
    }

    public fixIndex(): void {
        this.gpu_content = new Uint32Array(this.index_entry.content.length);
        for(let i = 0; i < this.index_entry.content.length; i++) {
            this.gpu_content[i] = this.index_entry.content.charCodeAt(i);
        }
    }

    public search(env: SearchEnv, keyword: string): SearchResult[] {
        let poses: [number, number][] = [];
        if(env.distance === undefined || env.distance === 0) {
            poses = this.allIndexOf(keyword, this.index_entry.content);
        } else {
            const grapheme = splitByGrapheme(keyword);
            let raw_result: [number, number][];
            if(grapheme.length <= 32) {
                const key = this.createBitapKeyUint32(grapheme);
                raw_result = this.bitapSearch(key, env.distance, this.gpu_content);
            } else if(grapheme.length < 50) {
                const key = createBitapKey(bitapKeyNumber(), grapheme);
                raw_result = bitapSearch(key, env.distance, this.gpu_content);
            } else {
                const key = createBitapKey(bitapKeyBigint(), grapheme);
                raw_result = bitapSearch(key, env.distance, this.gpu_content);
            }

            let latest_item = raw_result[0];
            let latest_pos = latest_item[0];

            for(const [pos, distance] of raw_result.slice(1)) {
                if(latest_pos + 1 === pos || latest_pos === pos) {
                    latest_pos = pos;
                    if(distance < latest_item[1]) {
                        latest_item = [pos, distance];
                    } else if (distance == latest_item[1]) {
                        if(distance === 0) {
                            poses.push(latest_item);
                            latest_item = [pos, distance];    
                        }
                    }
                } else {
                    poses.push(latest_item);
                    latest_item = [pos, distance];
                    latest_pos = pos;
                }
            }

            poses.push(latest_item);
        }

        const result = new Map<number, SearchResult>();
        for(const pos of poses) {
            const cref = this.getReference(pos[0]);
            const r = result.get(cref.id) || {id: cref.id, key: this.index_entry.key[cref.id], score: 0, refs: []};
            r.refs.push({
                token: keyword,
                path: cref.path,
                pos: cref.pos,
                wordaround: this.index_entry.content.slice(Math.max(pos[0] - 20, 0), pos[0] + keyword.length + 20),
                distance: pos[1]
            });
            result.set(cref.id, r);
        }
        return Array.from(result.values());        
    }

    private allIndexOf(keyword: string, content: string): [number, number][] {
        const result: [number, number][] = [];
        let pos = content.indexOf(keyword);
        while(pos !== -1) {
            result.push([pos, 0]);
            pos = content.indexOf(keyword, pos + keyword.length);
        }
        return result;
    }
    
    private getReference(pos: number): ContentRef {
        const index = binarySearch(
            {id: 0, path: "", start: pos, end: pos},
            (a, b) => a.start < b.start ? -1 : a.end > b.end ? 1 : 0,
            this.index_entry.toc,
            BinarySearchType.Exact
        );
        if(index === null) throw new UniSearchError("unisearch.js: getReference internal error.");
        const toc = this.index_entry.toc[index];
        return {
            id: toc.id,
            path: toc.path,
            pos: pos - toc.start
        }
    }

    private createBitapKeyUint32(pattern: string[]): BitapKeyUint32 {
        if (pattern.length > 32) throw new Error("createBitapKey: key length must be less than 32.");
        const key: BitapKeyUint32 = {
            mask: new Map<number, number>(),
            length: pattern.length,
        };
    
        for (let i = 0; i < key.length; i++) {
            const char = pattern[i].charCodeAt(0);
            const bit = 1 << i;
            const old = key.mask.get(char);
    
            if (!old) {
                key.mask.set(char, bit);
            } else {
                key.mask.set(char, old | bit);
            }
        }
    
        return key;
    }
    
    private bitapSearch(key: BitapKeyUint32, maxErrors: number, text: Uint32Array): [number, number][] {
        const state: number[] = Array(maxErrors + 1).fill(0);
        const matchbit = 1 << (key.length - 1);
        const result: [number, number][] = [];
    
        for (let i = 0; i < text.length; i++) {
            const mask = key.mask.get(text[i]) || 0;
            let replace = 0;
            let insertion = 0;
            let deletion = 0;
    
            for (let distance = 0; distance < maxErrors + 1; distance++) {
                const next_state_candidate = (state[distance] << 1) | 1;
                const next_state = next_state_candidate & mask | replace | insertion | deletion;
    
                replace = next_state_candidate;
                insertion = state[distance];
                deletion = (next_state << 1) | 1;
    
                state[distance] = next_state;
    
                if ((state[distance] & matchbit) !== 0) {
                    result.push([i - key.length + 1, distance]);
                    break;
                }
            }
        }
        return result;
    }
}

