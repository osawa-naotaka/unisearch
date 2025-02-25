import { Hybrid } from "@src/method/hybrid";
import { InvertedIndex } from "@src/method/invertedindex";
import { Ngram } from "@src/method/ngram";
import { TrieIndex } from "@src/method/trieindex";

export const HybridTrieTrigramInvertedIndex = Hybrid(
    "HybridTrieTrigramInvertedIndex",
    Ngram(3, InvertedIndex),
    TrieIndex,
);
