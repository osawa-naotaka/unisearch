import { describe, expect, test } from 'vitest';
import { getc, is, char, cat, rep, space, str, digit, int, frac, float } from '@src/parse';
import { fuzzy, exact, token, not, term, paren, group, from, weight, adj, and, expr } from '@src/parse';

describe("parser elements", () => {
    test("getc", () => 
        expect(getc([..."abc"]))
        .toStrictEqual({val: "a", rest: [..."bc"]})
    );
    test("getc null", () =>
        expect(getc([...""]))
        .toStrictEqual(null)
    );

    test("is 1", () =>
        expect(is((x) => x === " ")([..."abc"]))
        .toStrictEqual(null)
    );

    test("is 2", () =>
        expect(is((x) => x === " ")([..." abc"]))
        .toStrictEqual({val: " ", rest: [..."abc"]})
    );

    test("is null", () =>
        expect(is((x) => x === " ")([]))
        .toStrictEqual(null)
    );

    test("char 1", () =>
        expect(char("a")([..."abc"]))
        .toStrictEqual({val: "a", rest: [..."bc"]})
    );
    
    test("char 2", () =>
        expect(char("a")([..."dabc"]))
        .toStrictEqual(null)
    );

    test("char null", () =>
        expect(char("a")([]))
        .toStrictEqual(null)
    );

    test("cat 1", () =>
        expect(cat(getc, getc)([..."abcd"]))
        .toStrictEqual({val: ["a", "b"], rest: [..."cd"]})
    );

    test("cat null 1", () =>
        expect(cat(getc, getc)([]))
        .toStrictEqual(null)
    );

    test("cat null 2", () =>
        expect(cat()([..."abcd"]))
        .toStrictEqual({val: [], rest: [..."abcd"]})
    );


    test("rep 1", () =>
        expect(rep(char("a"))([..."aaabcd"]))
        .toStrictEqual({val: [..."aaa"], rest: [..."bcd"]})
    );

    test("rep 2", () =>
        expect(rep(char("a"))([..."bcdaaa"]))
        .toStrictEqual({val: [], rest: [..."bcdaaa"]})
    );

    test("rep 3", () =>
        expect(rep(char("a"), 1)([..."bcdaaa"]))
        .toStrictEqual(null)
    );

    test("rep 4", () =>
        expect(rep(char("a"))([]))
        .toStrictEqual({val: [], rest: []})
    );

    test("space 1", () =>
        expect(space([..."   aaabcd"]))
        .toStrictEqual({val: [], rest: [..."aaabcd"]})
    );

    test("space 2", () =>
        expect(space([..."bcdaaa"]))
        .toStrictEqual({val: [], rest: [..."bcdaaa"]})
    );

    test("space zero string", () =>
        expect(space([]))
        .toStrictEqual({val: [], rest: []})
    );

    test("str 1", () =>
        expect(str("from:")([..."from:title"]))
        .toStrictEqual({val: [..."from:"], rest: [..."title"]})
    );

    test("str 2", () =>
        expect(str("from:")([..."bcdaaa"]))
        .toStrictEqual(null)
    );

    test("str zero string", () =>
        expect(str("")([..."bcdaaa"]))
        .toStrictEqual({val: [], rest: [..."bcdaaa"]})
    );

    test("digit 1", () =>
        expect(digit([..."1abcd"]))
        .toStrictEqual({val: 1, rest: [..."abcd"]})
    );

    test("digit 2", () =>
        expect(digit([..."a1abcd"]))
        .toStrictEqual(null)
    );

    test("int 1", () =>
        expect(int([..."123"]))
        .toStrictEqual({val: 123, rest: []})
    );    

    test("flac 1", () =>
        expect(frac([..."123"]))
        .toStrictEqual({val: 0.123, rest: []})
    );    

    test("float 1", () =>
        expect(float([..."123.456"]))
        .toStrictEqual({val: 123.456, rest: []})
    );

});

describe("unisearch query parser", () => {
    test("fuzzy 1", () =>
        expect(fuzzy([..."bcdaaa"]))
        .toStrictEqual({val: {type: 'fuzzy', str: "bcdaaa"}, rest: []})
    );

    test("fuzzy 2", () =>
        expect(fuzzy([..."bcd acc"]))
        .toStrictEqual({val: {type: 'fuzzy', str: "bcd"}, rest: [..." acc"]})
    );

    test("fuzzy null", () =>
        expect(fuzzy([]))
        .toStrictEqual(null)
    );

    test("exact 1", () =>
        expect(exact([...'"abcdef"']))
        .toStrictEqual({val: {type: 'exact', str: "abcdef"}, rest: [...""]})
    );

    test("exact 2", () =>
        expect(exact([..."bcd acc"]))
        .toStrictEqual(null)
    );

    test("exact 3", () =>
        expect(exact([...'"bcd acc" efg']))
        .toStrictEqual({val: {type: 'exact', str: "bcd acc"}, rest: [..." efg"]})
    );

    test("exact null", () =>
        expect(exact([]))
        .toStrictEqual(null)
    );

    test("token 1", () =>
        expect(token([...'abc "def"']))
        .toStrictEqual({val: {type: 'fuzzy', str: "abc"}, rest: [...' "def"']})
    );

    test("token 2", () =>
        expect(token([...'"def"abc']))
        .toStrictEqual({val: {type: 'exact', str: "def"}, rest: [...'abc']})
    );

    test("not 1", () =>
        expect(not([...'-abc "def"']))
        .toStrictEqual({val: {type: 'not', node: {type: 'fuzzy', str: "abc"}}, rest: [...' "def"']})
    );

    test("not 2", () =>
        expect(not([...'-"def"abc']))
        .toStrictEqual({val: {type: 'not', node: {type: 'exact', str: "def"}}, rest: [...'abc']})
    );

    test("term 1", () =>
        expect(term([...'abc "def"']))
        .toStrictEqual({val: {type: 'fuzzy', str: "abc"}, rest: [...' "def"']})
    );

    test("term 2", () =>
        expect(term([...'"def"abc']))
        .toStrictEqual({val: {type: 'exact', str: "def"}, rest: [...'abc']})
    );

    test("term 3", () =>
        expect(term([...'-abc "def"']))
        .toStrictEqual({val: {type: 'not', node: {type: 'fuzzy', str: "abc"}}, rest: [...' "def"']})
    );

    test("term 4", () =>
        expect(term([...'-"def"abc']))
        .toStrictEqual({val: {type: 'not', node: {type: 'exact', str: "def"}}, rest: [...'abc']})
    );

    test("group 1", () =>
        expect(group([...'abc def']))
        .toStrictEqual({val: {type: 'fuzzy', str: "abc"}, rest: [..." def"]})
    );

    test("from 1", () =>
        expect(from([...'from:title def ghi']))
        .toStrictEqual({val: {type: 'from', field: "title", node: {type: 'fuzzy', str: "def"}}, rest: [..." ghi"]})
    );
  
    test("weight 1", () =>
        expect(weight([...'weight:1 def ghi']))
        .toStrictEqual({val: {type: 'weight', weight: 1, node: {type: 'fuzzy', str: "def"}}, rest: [..." ghi"]})
    );

    test("adj 1", () =>
        expect(adj([...'from:title def ghi']))
        .toStrictEqual({val: {type: 'from', field: "title", node: {type: 'fuzzy', str: "def"}}, rest: [..." ghi"]})
    );
  
    test("adj 2", () =>
        expect(adj([...'weight:1.23 def ghi']))
        .toStrictEqual({val: {type: 'weight', weight: 1.23, node: {type: 'fuzzy', str: "def"}}, rest: [..." ghi"]})
    );

    test("adj 3", () =>
        expect(adj([...'weight:1 -def ghi']))
        .toStrictEqual({val: {type: 'weight', weight: 1, node: {type: 'not', node: {type: 'fuzzy', str: "def"}}}, rest: [..." ghi"]})
    );

    test("adj 4", () =>
        expect(adj([...'def ghi']))
        .toStrictEqual({val: {type: 'fuzzy', str: "def"}, rest: [..." ghi"]})
    );

    test("and 1", () =>
        expect(and([...'a "bcd" -"efg" from:title hij']))
        .toStrictEqual({val: {type: 'and', nodes: [
            {type: 'fuzzy', str: 'a'},
            {type: 'exact', str: "bcd"},
            {type: 'not', node: {type: 'exact', str: "efg"}},
            {type: 'from', field: "title", node: {type: 'fuzzy', str: 'hij'}}
        ]}, rest: []})
    );

    test("expr 1", () =>
        expect(expr([...'a "bcd" OR -"efg" from:title hij']))
        .toStrictEqual({val: {type: 'or', nodes: [
            {type: 'and', nodes: [
                {type: 'fuzzy', str: 'a'},
                {type: 'exact', str: "bcd"},
            ]},
            {type: 'and', nodes: [
                {type: 'not', node: {type: 'exact', str: "efg"}},
                {type: 'from', field: "title", node: {type: 'fuzzy', str: 'hij'}}
            ]},
        ]}, rest: []})
    );

    test("paren 1", () =>
        expect(paren([...'(a)']))
        .toStrictEqual({val: {type: 'or', nodes: [
            {type: 'and', nodes: [
                {type: 'fuzzy', str: 'a'},
            ]},
        ]}, rest: []})
    ); 

    test("expr 2", () =>
        expect(expr([...'a ("bcd" OR -"efg") from:title hij']))
        .toStrictEqual({val: {type: 'or', nodes: [
            {type: 'and', nodes: [
                {type: 'fuzzy', str: 'a'},
                {type: 'or', nodes: [
                    {type: 'and', nodes: [
                        {type: 'exact', str: "bcd"},
                    ]},
                    {type: 'and', nodes: [
                        {type: 'not', node: {type: 'exact', str: "efg"}},    
                    ]},
                ]},
                {type: 'from', field: "title", node: {type: 'fuzzy', str: 'hij'}}
            ]},
        ]}, rest: []})
    );

});