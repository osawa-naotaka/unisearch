import { test, expect } from "vitest";
import { generate1ToNgram, generateNgram, generateNgramToTail } from "@src/algorithm";

test('1-gram for "t", is ["t"]', () => expect(generateNgram(1, "t")).toStrictEqual(["t"]));

test('1-gram for "test", is ["t", "e", "s", "t"]', () =>
    expect(generateNgram(1, "test")).toStrictEqual(["t", "e", "s", "t"]));

test('index 1-gram for "t", is ["t"]', () => expect(generate1ToNgram(1, "t")).toStrictEqual(["t"]));

test('index 1-gram for "test", is ["t", "e", "s", "t"]', () =>
    expect(generate1ToNgram(1, "test")).toStrictEqual(["t", "e", "s", "t"]));

test('2-gram for "t", is ["t"]', () => expect(generateNgram(2, "t")).toStrictEqual(["t"]));

test('2-gram for "te", is ["te"]', () => expect(generateNgram(2, "te")).toStrictEqual(["te"]));

test('2-gram for "test", is ["te", "es", "st"]', () =>
    expect(generateNgram(2, "test")).toStrictEqual(["te", "es", "st"]));

test('index 2-gram for "t", is ["t"]', () => expect(generate1ToNgram(2, "t")).toStrictEqual(["t"]));

test('index 2-gram for "te", is ["t", "e", "te"]', () =>
    expect(generate1ToNgram(2, "te")).toStrictEqual(["t", "e", "te"]));

test('index 2-gram for "test", is ["t", "e", "s", "t", "te", "es", "st"]', () =>
    expect(generate1ToNgram(2, "test")).toStrictEqual(["t", "e", "s", "t", "te", "es", "st"]));

test('3-gram for "t", is ["t"]', () => expect(generateNgram(3, "t")).toStrictEqual(["t"]));

test('3-gram for "te", is ["te"]', () => expect(generateNgram(3, "te")).toStrictEqual(["te"]));

test('3-gram for "tes", is ["tes"]', () => expect(generateNgram(3, "tes")).toStrictEqual(["tes"]));

test('3-gram for "test", is ["tes", "est"]', () => expect(generateNgram(3, "test")).toStrictEqual(["tes", "est"]));

test('index 3-gram for "t", is ["t"]', () => expect(generate1ToNgram(3, "t")).toStrictEqual(["t"]));

test('index 3-gram for "te", is ["t", "e", "te"]', () =>
    expect(generate1ToNgram(3, "te")).toStrictEqual(["t", "e", "te"]));

test('index 3-gram for "tes", is ["t", "e", "s", "te", "es", "tes"]', () =>
    expect(generate1ToNgram(3, "tes")).toStrictEqual(["t", "e", "s", "te", "es", "tes"]));

test('index 3-gram for "test", is ["t", "e", "s", "t", "te", "es", "st", "tes", "est"]', () =>
    expect(generate1ToNgram(3, "test")).toStrictEqual(["t", "e", "s", "t", "te", "es", "st", "tes", "est"]));

test('trie 1-gram for "t", is ["t"]', () => expect(generateNgramToTail(1, "t")).toStrictEqual(["t"]));

test('trie 1-gram for "test", is ["t", "e", "s", "t"]', () =>
    expect(generateNgramToTail(1, "test")).toStrictEqual(["t", "e", "s", "t"]));

test('trie 2-gram for "t", is ["t"]', () => expect(generateNgramToTail(2, "t")).toStrictEqual(["t"]));

test('trie 2-gram for "te", is ["te"]', () => expect(generateNgramToTail(2, "te")).toStrictEqual(["te", "e"]));

test('trie 2-gram for "test", is ["te", "es", "st", "t"]', () =>
    expect(generateNgramToTail(2, "test")).toStrictEqual(["te", "es", "st", "t"]));

test('trie 3-gram for "t", is ["t"]', () => expect(generateNgramToTail(3, "t")).toStrictEqual(["t"]));

test('trie 3-gram for "te", is ["te", "e"]', () => expect(generateNgramToTail(3, "te")).toStrictEqual(["te", "e"]));

test('trie 3-gram for "tes", is ["tes", "es", "s"]', () =>
    expect(generateNgramToTail(3, "tes")).toStrictEqual(["tes", "es", "s"]));

test('trie 3-gram for "test", is ["tes", "est", "st", "t"]', () =>
    expect(generateNgramToTail(3, "test")).toStrictEqual(["tes", "est", "st", "t"]));
