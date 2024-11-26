import type { BloomIndex, DocId } from "@src/types";
import { accumulateArray, intersect, union } from "@src/util";
import { murmurhash2_32_gc } from "@src/murmurhash2_gc";

function addBloom(docid: DocId, text: string, index: BloomIndex) : BloomIndex {
    for(let hashid = 0; hashid < index.hashes; hashid++) {
        const bitpos = murmurhash2_32_gc(hashid, text) % index.bits;
        index.index[bitpos] = union([docid], index.index[bitpos]);
    }
    return index;
}

function isExists(query: string, index: BloomIndex) : DocId[] {
    return accumulateArray([...Array(index.hashes).keys()].map(id => index.index[murmurhash2_32_gc(id, query) % index.bits] || []), intersect);
}

export function docToBloomIndex(docid: DocId, doc: string, index: BloomIndex) : BloomIndex {
    addBloom(docid, doc, index);
    return index;
}

export function searchBloom(query: string, index: BloomIndex) : DocId[] {
    return isExists(query, index);
}
