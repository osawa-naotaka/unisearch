export type DocId  = number;
export type Bigram = number;
export type BigramIndex = Record<Bigram, DocId[]>;

// export type InvertedIndex = Map<string, Set<number>>;
export type InvertedIndex = Record<string, DocId[]>;

export type Trigram = string;
export type MinHash = number;
