import type { BloomIndex, DocId } from "@src/types";
import { accumulateArray, intersect, union } from "@src/util";
import { murmurhash3_32_gc } from "@src/murmurhash3_gc";

function addBloom(docid: DocId, text: string, index: BloomIndex) {
    [...Array(index.hashes).keys()].map(id => murmurhash3_32_gc(text, id + 1) % index.bits).map(pos => index.index[pos] = union([docid], index.index[pos]));
}

function isExists(query: string, index: BloomIndex) : DocId[] {
    return accumulateArray([...Array(index.hashes).keys()].map(id => index.index[murmurhash3_32_gc(query, id + 1) % index.bits] || []), intersect);
}

export function docToBloomIndex(docid: DocId, doc: string, index: BloomIndex) {
    addBloom(docid, doc, index);
}

export function searchBloom(query: string, index: BloomIndex) : DocId[] {
    return isExists(query, index);
}
