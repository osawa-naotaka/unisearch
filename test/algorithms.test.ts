import { test, expect } from "vitest";
import { generate1ToNgram, generateNgram, generateNgramToTail } from "@src/util/algorithm";
import { splitByGrapheme } from "@src/util/preprocess";

test('1-gram for "t", is ["t"]', () => expect(generateNgram(1, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('1-gram for "test", is ["t", "e", "s", "t"]', () =>
    expect(generateNgram(1, splitByGrapheme("test"))).toStrictEqual([["t"], ["e"], ["s"], ["t"]]));

test('index 1-gram for "t", is ["t"]', () => expect(generate1ToNgram(1, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('index 1-gram for "test", is ["t", "e", "s", "t"]', () =>
    expect(generate1ToNgram(1, splitByGrapheme("test"))).toStrictEqual([["t"], ["e"], ["s"], ["t"]]));

test('2-gram for "t", is ["t"]', () => expect(generateNgram(2, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('2-gram for "te", is ["te"]', () => expect(generateNgram(2, splitByGrapheme("te"))).toStrictEqual([["t", "e"]]));

test('2-gram for "test", is ["te", "es", "st"]', () =>
    expect(generateNgram(2, splitByGrapheme("test"))).toStrictEqual([["t", "e"], ["e", "s"], ["s", "t"]]));

test('index 2-gram for "t", is ["t"]', () => expect(generate1ToNgram(2, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('index 2-gram for "te", is ["t", "e", "te"]', () =>
    expect(generate1ToNgram(2, splitByGrapheme("te"))).toStrictEqual([["t"], ["e"], ["t", "e"]]));

test('index 2-gram for "test", is ["t", "e", "s", "t", "te", "es", "st"]', () =>
    expect(generate1ToNgram(2, splitByGrapheme("test"))).toStrictEqual([["t"], ["e"], ["s"], ["t"], ["t", "e"], ["e", "s"], ["s", "t"]]));

test('3-gram for "t", is ["t"]', () => expect(generateNgram(3, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('3-gram for "te", is ["te"]', () => expect(generateNgram(3, splitByGrapheme("te"))).toStrictEqual([["t", "e"]]));

test('3-gram for "tes", is ["tes"]', () => expect(generateNgram(3, splitByGrapheme("tes"))).toStrictEqual([["t", "e", "s"]]));

test('3-gram for "test", is ["tes", "est"]', () => expect(generateNgram(3, splitByGrapheme("test"))).toStrictEqual([["t", "e", "s"], ["e", "s", "t"]]));

test('index 3-gram for "t", is ["t"]', () => expect(generate1ToNgram(3, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('index 3-gram for "te", is ["t", "e", "te"]', () =>
    expect(generate1ToNgram(3, splitByGrapheme("te"))).toStrictEqual([["t"], ["e"], ["t", "e"]]));

test('index 3-gram for "tes", is ["t", "e", "s", "te", "es", "tes"]', () =>
    expect(generate1ToNgram(3, splitByGrapheme("tes"))).toStrictEqual([["t"], ["e"], ["s"], ["t", "e"], ["e", "s"], ["t", "e", "s"]]));

test('index 3-gram for "test", is ["t", "e", "s", "t", "te", "es", "st", "tes", "est"]', () =>
    expect(generate1ToNgram(3, splitByGrapheme("test"))).toStrictEqual([["t"], ["e"], ["s"], ["t"], ["t", "e"], ["e", "s"], ["s", "t"], ["t", "e", "s"], ["e", "s", "t"]]));

test('trie 1-gram for "t", is ["t"]', () => expect(generateNgramToTail(1, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('trie 1-gram for "test", is ["t", "e", "s", "t"]', () =>
    expect(generateNgramToTail(1, splitByGrapheme("test"))).toStrictEqual([["t"], ["e"], ["s"], ["t"]]));

test('trie 2-gram for "t", is ["t"]', () => expect(generateNgramToTail(2, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('trie 2-gram for "te", is ["te"]', () => expect(generateNgramToTail(2, splitByGrapheme("te"))).toStrictEqual([["t", "e"], ["e"]]));

test('trie 2-gram for "test", is ["te", "es", "st", "t"]', () =>
    expect(generateNgramToTail(2, splitByGrapheme("test"))).toStrictEqual([["t", "e"], ["e", "s"], ["s", "t"], ["t"]]));

test('trie 3-gram for "t", is ["t"]', () => expect(generateNgramToTail(3, splitByGrapheme("t"))).toStrictEqual([["t"]]));

test('trie 3-gram for "te", is ["te", "e"]', () => expect(generateNgramToTail(3, splitByGrapheme("te"))).toStrictEqual([["t", "e"], ["e"]]));

test('trie 3-gram for "tes", is ["tes", "es", "s"]', () =>
    expect(generateNgramToTail(3, splitByGrapheme("tes"))).toStrictEqual([["t", "e", "s"], ["e", "s"], ["s"]]));

test('trie 3-gram for "test", is ["tes", "est", "st", "t"]', () =>
    expect(generateNgramToTail(3, splitByGrapheme("test"))).toStrictEqual([["t", "e", "s"], ["e", "s", "t"], ["s", "t"], ["t"]]));
