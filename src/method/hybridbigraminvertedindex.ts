import { InvertedIndex } from "@src/method/invertedindex";
import { Ngram } from "@src/method/ngram";
import { Hybrid } from "@src/method/hybrid";

export const HybridBigramInvertedIndex = Hybrid("HybridBigramInvertedIndex", Ngram(2, InvertedIndex), InvertedIndex);
