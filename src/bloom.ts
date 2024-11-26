import type { BloomIndex, DocId } from "@src/types";
import { accumulateArray, intersect, union } from "@src/util";
import { murmurhash2_32_gc } from "@src/murmurhash2_gc";

function addBloom(docid: DocId, text: string, index: BloomIndex) {
    [...Array(index.hashes).keys()].map(id => murmurhash2_32_gc(id, text) % index.bits).map(pos => index.index[pos] = union([docid], index.index[pos]));
}

function isExists(query: string, index: BloomIndex) : DocId[] {
    return accumulateArray([...Array(index.hashes).keys()].map(id => index.index[murmurhash2_32_gc(id, query) % index.bits] || []), intersect);
}

export function docToBloomIndex(docid: DocId, doc: string, index: BloomIndex) {
    addBloom(docid, doc, index);
}

export function searchBloom(query: string, index: BloomIndex) : DocId[] {
    return isExists(query, index);
}
