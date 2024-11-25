import { docToWords } from "@src/preprocess";
import { intersect, appendIfNotExists } from "@src/util";
import type { DocId, Bigram, BigramIndex } from "@src/types";

function hashChar(char: string) : number {
    const hashConst = 48271;
    const modConst = 65535; // 16 bit

    const unicodeValue = char.codePointAt(0) ?? 0;
    return (unicodeValue * hashConst) % modConst;
}

function split8bit(char: number) : number[] {
    const high = (char >> 8) & 0xff;
    const low = char & 0xff;
    return [low, high];    
}

function concat8bit(high: number, low: number) : number {
    return (high << 8) | low;
}

function generateBigram(text: string) : Bigram[] {
    const hashed = [...text].map(hashChar).flatMap(split8bit);
    const grams = [];
    for(let i = 0; i < hashed.length - 1; i++) {
        grams.push(concat8bit(hashed[i+1], hashed[i]));
    }

    return grams;
}

export function docToBigrams(doc: string[]) : Set<Bigram> {
    const words        = docToWords(doc);
    const bigrams      = words.flatMap(generateBigram);
    const uniq_bigrams = new Set(bigrams);

    return uniq_bigrams;
}

export function docToBigramIndex(docid: DocId, doc: string[], index: BigramIndex) : BigramIndex {
    for (const bigram of docToBigrams(doc)) {
        index[bigram] = appendIfNotExists(docid, index[bigram]);
    }
    return index;
}

export function searchBigram(query: string, index: BigramIndex) : DocId[] {
    let result : DocId[] | null = null;
    for (const bigram of docToBigrams([query])) {
        const docs = index[bigram];
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
