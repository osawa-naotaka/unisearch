import { expect, test } from 'vitest';
import { generateNgramForIndex, generateNgramForSearch } from '@src/ngram';

test('1-gram for "t", is ["t"]', () =>
    expect(generateNgramForSearch(1, "t")).toStrictEqual(["t"]));

test('1-gram for "test", is ["t", "e", "s", "t"]', () =>
    expect(generateNgramForSearch(1, "test")).toStrictEqual(["t", "e", "s", "t"]));

test('index 1-gram for "t", is ["t"]', () =>
    expect(generateNgramForIndex(1, "t")).toStrictEqual(["t"]));

test('index 1-gram for "test", is ["t", "e", "s", "t"]', () =>
    expect(generateNgramForIndex(1, "test")).toStrictEqual(["t", "e", "s", "t"]));



test('2-gram for "t", is ["t"]', () =>
    expect(generateNgramForSearch(2, "t")).toStrictEqual(["t"]));

test('2-gram for "te", is ["te"]', () =>
    expect(generateNgramForSearch(2, "te")).toStrictEqual(["te"]));

test('2-gram for "test", is ["te", "es", "st"]', () =>
    expect(generateNgramForSearch(2, "test")).toStrictEqual(["te", "es", "st"]));

test('index 2-gram for "t", is ["t"]', () =>
    expect(generateNgramForIndex(2, "t")).toStrictEqual(["t"]));

test('index 2-gram for "te", is ["t", "e", "te"]', () =>
    expect(generateNgramForIndex(2, "te")).toStrictEqual(["t", "e", "te"]));

test('index 2-gram for "test", is ["t", "e", "s", "t", "te", "es", "st"]', () =>
    expect(generateNgramForIndex(2, "test")).toStrictEqual(["t", "e", "s", "t", "te", "es", "st"]));



test('3-gram for "t", is ["t"]', () =>
    expect(generateNgramForSearch(3, "t")).toStrictEqual(["t"]));

test('3-gram for "te", is ["te"]', () =>
    expect(generateNgramForSearch(3, "te")).toStrictEqual(["te"]));

test('3-gram for "tes", is ["tes"]', () =>
    expect(generateNgramForSearch(3, "tes")).toStrictEqual(["tes"]));

test('3-gram for "test", is ["tes", "est"]', () =>
    expect(generateNgramForSearch(3, "test")).toStrictEqual(["tes", "est"]));



test('index 3-gram for "t", is ["t"]', () =>
    expect(generateNgramForIndex(3, "t")).toStrictEqual(["t"]));

test('index 3-gram for "te", is ["t", "e", "te"]', () =>
    expect(generateNgramForIndex(3, "te")).toStrictEqual(["t", "e", "te"]));

test('index 3-gram for "tes", is ["t", "e", "s", "te", "es", "tes"]', () =>
    expect(generateNgramForIndex(3, "tes")).toStrictEqual(["t", "e", "s", "te", "es", "tes"]));

test('index 3-gram for "test", is ["t", "e", "s", "t", "te", "es", "st", "tes", "est"]', () =>
    expect(generateNgramForIndex(3, "test")).toStrictEqual(["t", "e", "s", "t", "te", "es", "st", "tes", "est"]));
