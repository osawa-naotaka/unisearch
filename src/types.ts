export type DocId  = number;
export type Bigram = number;
export type BigramIndex = Record<Bigram, DocId[]>;

export type Ngram  = string;
export type NgramIndex = Record<Ngram, DocId[]>;

export type LinearIndex = {docid: number, content: string[]}[]

export type InvertedIndex = Record<string, DocId[]>;

export type Trigram = string;
export type MinHash = number;
