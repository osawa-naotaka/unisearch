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
    trie: TrieIndex,
    ngram: NgramIndex,
    inverted: InvertedIndex
};


export type NgramFn = (text: string) => string[];

export type BloomIndex = {
    index: Record<number, number[]>,
    bits: number,
    hashes: number
};
