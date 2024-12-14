import { describe, expect, test } from 'vitest';
import { extractStringsAll, getValueByPath } from '@src/traverser';

describe("getValueByPath", () => {
    test('select root object', () => 
        expect(getValueByPath("", "string1"))
        .toStrictEqual("string1"));
    
    test('select path 1: string', () => 
        expect(getValueByPath("key1", {key1: "string1"}))
        .toStrictEqual("string1"));
    
    test('select path 2: object', () => 
        expect(getValueByPath("key1", {key1: {key3: ["string2", "string3"]}, key2: "string1" }))
        .toStrictEqual({key3: ["string2", "string3"]}));
    
    test('select path 3: array of string', () => 
        expect(getValueByPath("key1.key3", {key1: {key3: ["string2", "string3"]}, key2: "string1" }))
        .toStrictEqual(["string2", "string3"]));
});


describe("extractStringsAll", () => {
    test('extract single string', () =>
        expect(extractStringsAll("", "string1"))
        .toStrictEqual([["", "string1"]]));
    
    test('extract object', () =>
        expect(extractStringsAll("", {key1: "string1", key2: "string2"}))
        .toStrictEqual([["key1", "string1"], ["key2", "string2"]]));
    
    test('extract array of string', () =>
        expect(extractStringsAll("", ["string1", "string2"]))
        .toStrictEqual([["", "string1 string2"]]));
    
    test('check if number field is not extracted.', () =>
        expect(extractStringsAll("", {field1: ["string1", "string2"], field2: {field3: "string3", field4: 10}}))
        .toStrictEqual([["field1", "string1 string2"], ["field2.field3", "string3"]]));
});
