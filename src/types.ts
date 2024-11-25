export type DocId  = number;
export type Bigram = number;
export type Ngram  = string;
export type Token  = string;

export type InvertedIndexBase<T extends keyof any> = Record<T, DocId[] | undefined>;
export type InvertedIndex = InvertedIndexBase<Token>;
export type BigramIndex   = InvertedIndexBase<Bigram>;
export type NgramIndex    = InvertedIndexBase<Ngram>;

export type LinearIndex   = {docid: number, content: string[]}[]

export type TrieNode = {
    ids: DocId[];
    children: Record<string, TrieNode>;
};

export type TrieIndex = TrieNode;

export type HybridIndex   = {
    ngram: NgramIndex,
    inverted: InvertedIndex
};


export type NgramFn = (text: string) => string[];

export type BloomIndex = {
    index: Record<number, number[]>,
    bits: number,
    hashes: number
};

export type IndexFn<T> = (docid: DocId, doc: string, index: T) => T;
export type SearchFn<T> = (query: string, index: T) => DocId[];
export type PreprocessFn = (text: string) => string[];
