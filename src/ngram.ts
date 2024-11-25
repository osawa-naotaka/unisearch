import type { DocId, Ngram, NgramIndex, NgramFn } from "@src/types";
import { docToWords } from "@src/preprocess";
import { appendIfNotExists, intersect } from "@src/util";

export function generateNgramForIndex(n: number, text: string): Ngram[] {
    return [...Array(n).keys()].flatMap(x => generateNgram(x + 1, text));
}

export function generateNgramForSearch(n: number, text: string): Ngram[] {
    if(text.length < n) {
        return [text];
    } else {
        return generateNgram(n, text);
    }
}

export function generateNgram(n: number, text: string): Ngram[] {
    if(text.length === 0) throw new Error("call generateNgram with null string.");
    if(text.length < n) {
        return [];
    } else {
        const grams: Ngram[] = [];
        for (let i = 0; i <= text.length - n; i++) {
            grams.push(text.slice(i, i + n));
        }
        return grams;
    }
}

export function docToNgrams(fn: NgramFn, doc: string[]) : Set<Ngram> {
    const words      = docToWords(doc);
    const grams      = words.flatMap(t => fn(t));
    const uniq_grams = new Set(grams);

    return uniq_grams;
}

export function docToNgramIndex(docid: DocId, doc: string, index: NgramIndex) : NgramIndex {
    index[doc] = appendIfNotExists(docid, index[doc]);
    return index;
}


export function searchNgram(query: string, index: NgramIndex) : DocId[] {
    return index[query] || [];
}
