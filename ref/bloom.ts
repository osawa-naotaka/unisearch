import { foldl1Array, intersect, union } from "@ref/algo";
import type { Reference, Token } from "@ref/common";
import { murmurhash3_32_gc } from "@ref/murmurhash3_gc";
import { rangeArray } from "@ref/util";

export type BloomIndex = {
    index: Record<number, Reference[]>;
    bits: number;
    hashes: number;
};

function addBloom(refs: Reference, text: Token, index: BloomIndex) {
    for (let i = 0; i < index.hashes; i++) {
        const pos = murmurhash3_32_gc(text, i + 1) % index.bits;
        index.index[pos] = union([refs], index.index[pos]);
    }
}

function isExists(query: Token, index: BloomIndex): Reference[] {
    return foldl1Array(
        intersect,
        rangeArray(index.hashes).map((id) => index.index[murmurhash3_32_gc(query, id + 1) % index.bits] || []),
    );
}

export function addToBloomIndex(refs: Reference, text: Token, index: BloomIndex) {
    addBloom(refs, text, index);
}

export function searchExactBloom(query: Token, index: BloomIndex): Reference[] {
    return isExists(query, index);
}
