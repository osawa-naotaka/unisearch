import type { DocId, Ngram, NgramIndex } from "@src/types";
import { docToWords } from "@src/preprocess";
import { addLikeSet, intersect } from "@src/util";

export function generateNgram(n: number, generate_lesser: boolean, text: string): Ngram[] {
    if (n <= 0) {
        throw new Error("Invalid value of n. It must be greater than 0.");
    }

    if (text.length === 0) {
        return [];
    }

    if (n > text.length && !generate_lesser) {
        return [text];
    }

    const grams: Ngram[] = [];
    const maxLength = Math.min(n, text.length);
    
    if (generate_lesser) {
        for (let len = 1; len <= maxLength; len++) {
            grams.push(text.slice(0, len));
        }
        
        if (text.length > n) {
            for (let i = 1; i <= text.length - n; i++) {
                grams.push(text.slice(i, i + n));
            }
        }
    } else {
        for (let i = 0; i <= text.length - n; i++) {
            grams.push(text.slice(i, i + n));
        }
    }

    return grams;
}

export function docToNgrams(n: number, generate_lesser: boolean, doc: string[]) : Set<Ngram> {
    const words      = docToWords(doc);
    const grams      = words.flatMap(t => generateNgram(n, generate_lesser, t));
    const uniq_grams = new Set(grams);

    return uniq_grams;
}

export function docToNgramIndex(n: number, generate_lesser: boolean, docid: DocId, doc: string[], index: NgramIndex) : NgramIndex {
    for (const ngram of docToNgrams(n, generate_lesser, doc)) {
        index[ngram] = addLikeSet(docid, index[ngram]);
    }
    return index;
}

export function searchNgram(n: number, query: string, index: NgramIndex) : DocId[] {
    let result : DocId[] | null = null;
    const words = docToWords([query]).flatMap(w => generateNgram(n, false, w));
    for (const word of words) {
        const docs = index[word];
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
