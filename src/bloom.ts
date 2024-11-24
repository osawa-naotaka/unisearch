import type { BloomIndex, NgramFn, DocId } from "@src/types";
import { docToNgrams } from "@src/ngram";
import { docToWords } from "@src/preprocess";
import { intersect, union } from "@src/util";
import { murmurhash2_32_gc } from "@src/murmurhash2_gc";


function addBloom(docid: DocId, text: string, index: BloomIndex) : BloomIndex {
    for(let hashid = 0; hashid < index.hashes; hashid++) {
        const bitpos = murmurhash2_32_gc(hashid, text) % index.bits;
        index.index[bitpos] = union([docid], index.index[bitpos]);
    }
    return index;
}

function isExists(query: string, index: BloomIndex) : DocId[] {
    let result : DocId[] | null = null;

    for(let hashid = 0; hashid < index.hashes; hashid++) {
        const bitpos = murmurhash2_32_gc(hashid, query) % index.bits;
        const docs = index.index[bitpos];
        if(docs) {
            if(result) {
                result = intersect(result, docs);
            } else {
                result = docs;
            }
        } else {
            return [];
        }
    }
    return result || [];
}

export function docToBloomIndex(fn: NgramFn, docid: DocId, doc: string[], index: BloomIndex) : BloomIndex {
    for (const ngram of docToNgrams(fn, doc)) {
        addBloom(docid, ngram, index);
    }
    return index;
}

export function searchBloom(fn: NgramFn, query: string, index: BloomIndex) : DocId[] {
    let result : DocId[] | null = null;
    const words = docToWords([query]).flatMap(w => fn(w));
    for (const word of words) {
        const docs = isExists(word, index);
        if(docs) {
            if(result) {
                result = intersect(result, docs);
            } else {
                result = docs;
            }
        } else {
            return [];
        }
    }
    return result || [];
}
