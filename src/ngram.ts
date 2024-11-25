import type { DocId, Ngram, NgramIndex } from "@src/types";
import { appendIfNotExists } from "@src/util";

export function generate1ToNgram(n: number, text: string): Ngram[] {
    return [...Array(n).keys()].flatMap(x => generateNgramInternal(x + 1, text));
}

export function generateNgram(n: number, text: string): Ngram[] {
    if(text.length < n) {
        return [text];
    } else {
        return generateNgramInternal(n, text);
    }
}


export function generateNgramTrie(n: number, text: string): Ngram[] {
    const grams = generateNgram(n, text);
    if(n < text.length) {
        for(let i = text.length - n; i < text.length - 1; i++) {
            grams.push(text.slice(i + 1));
        }
    } else if(text.length != 1) {
        for(let i = 1; i < text.length; i++) {
            grams.push(text.slice(i));
        }
    }
    return grams;
}


function generateNgramInternal(n: number, text: string): Ngram[] {
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

export function docToNgramIndex(docid: DocId, doc: string, index: NgramIndex) : NgramIndex {
    index[doc] = appendIfNotExists(docid, index[doc]);
    return index;
}

export function searchNgram(query: string, index: NgramIndex) : DocId[] {
    return index[query] || [];
}
