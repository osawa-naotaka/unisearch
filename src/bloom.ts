import type { Reference, Token } from "@src/common";
import { murmurhash3_32_gc } from "@src/murmurhash3_gc";
import { foldl1Array, intersect, rangeArray, union } from "@src/util";

export type BloomIndex = {
    index: Record<number, Reference[]>;
    bits: number;
    hashes: number;
};

function addBloom(refs: Reference, text: Token, index: BloomIndex) {
    rangeArray(index.hashes)
        .map((id) => murmurhash3_32_gc(text, id + 1) % index.bits)
        .map((pos) => {
            index.index[pos] = union([refs], index.index[pos]);
        });
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

export function searchBloom(query: Token, index: BloomIndex): Reference[] {
    return isExists(query, index);
}
