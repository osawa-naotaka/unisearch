import type { DocId, Token } from "@src/common";
import { murmurhash3_32_gc } from "@src/murmurhash3_gc";
import { foldl1Array, intersect, rangeArray, union } from "@src/util";

export type BloomIndex = {
    index: Record<number, number[]>;
    bits: number;
    hashes: number;
};

function addBloom(docid: DocId, text: Token, index: BloomIndex) {
    rangeArray(index.hashes)
        .map((id) => murmurhash3_32_gc(text, id + 1) % index.bits)
        .map((pos) => {
            index.index[pos] = union([docid], index.index[pos]);
        });
}

function isExists(query: Token, index: BloomIndex): DocId[] {
    return foldl1Array(
        rangeArray(index.hashes).map((id) => index.index[murmurhash3_32_gc(query, id + 1) % index.bits] || []),
        intersect,
    );
}

export function addToBloomIndex(docid: DocId, text: Token, index: BloomIndex) {
    addBloom(docid, text, index);
}

export function searchBloom(query: Token, index: BloomIndex): DocId[] {
    return isExists(query, index);
}
