
type Char = string;
type Str = string[];

type ParserOut<T> = {val: T, rest: Str} | null;
type Parser<T> = (s: Str) => ParserOut<T>;
type ParserData<P> = P extends Parser<infer T> ? T : never;

// Basic parser
export const getc: Parser<Char> = (s) => {
    if(s.length === 0) {
        return null;
    } else {
        const [car, ...cdr] = s;
        return {val: car, rest: cdr};
    }
}

type CondFn<T> = (c: T) => boolean;
type IsFn = (fn: CondFn<Char>) => Parser<Char>;
export const is: IsFn = (fn: CondFn<Char>) => (s) => {
    const r = getc(s);
    if(r === null) return null; 
    if(!fn(r.val)) return null;
    return r; 
}

type CharFn = (c: Char) => Parser<Char>;
export const char: CharFn = (c) => is((x) => x === c);

// using "as". fix it.
type CatFn = <T extends Parser<unknown>[]>(...ps: [...T]) => Parser<{[K in keyof T]: ParserData<T[K]>}>;
export const cat: CatFn = <T extends Parser<unknown>[]>(...ps: [...T]) => (s) => {
    const rs = [] as {[K in keyof T]: ParserData<T[K]>};
    let cur = s;
    for(const p of ps) {
        const r = p(cur);
        if(r === null) return null;
        rs.push(r.val);
        cur = r.rest;
    }
    return {val: rs, rest: cur};
}

type RepFn = <T>(fn: Parser<T>, min?: number) => Parser<T[]>;
export const rep: RepFn = <T>(fn: Parser<T>, min = 0) => (s) => {
    const rs = [];
    let rest = s;
    let r = fn(rest);
    while(r !== null) {
        rs.push(r.val);
        rest = r.rest;
        r = fn(rest);
    }
    if(rs.length < min) return null;
    return {val: rs, rest: rest};
}

type MapFn = <T, S>(p: Parser<T>, fn: (x: T) => S) => Parser<S>;
export const map: MapFn = (p, fn) => (s) => {
    const r = p(s);
    if(r === null) return null;
    return {val: fn(r.val), rest: r.rest};
}

type OrFn = <T>(...ps: Parser<T>[]) => Parser<T>;
export const or: OrFn = (...ps) => (s) => {
    if(ps.length === 0) return null;
    for(const p of ps) {
        const r = p(s);
        if(r !== null) return r;
    }
    return null;
}

type DiffFn = <T, U>(p1: Parser<T>, p2: Parser<U>) => Parser<T>;
export const diff: DiffFn = (p1, p2) => (s) => {
    const rp2 = p2(s);
    if(rp2 === null) {
        return p1(s);
    }
    return null;
}

const spaces = "\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u0009\u000A\u000B\u000C\u000D\u0085\u2028\u2029\u200B";
const digits = "0123456789";

type SpaceFn = Parser<Str>;
export const space: SpaceFn = map(rep(or(...[...spaces].map(char))), () => []);
export const space1: SpaceFn = map(rep(or(...[...spaces].map(char)), 1), () => []);

type StrFn = (s: string) => Parser<Str>;
export const str: StrFn = (s) => cat(...[...s].map(char));

export const digit: Parser<number> = map(or(...[...digits].map(char)), (x) => Number.parseInt(x, 10));
export const int: Parser<number> = map(rep(digit), (x) => x.reduce((p, c) => p * 10 + c, 0));
export const frac: Parser<number> = map(rep(digit), (x) => (x.reduceRight((p, c) => p / 10 + c, 0)) / 10);
export const float: Parser<number> = map(cat(int, char("."), frac), (x) => x[0] + x[2]);


// parser for UNISEARCH BNF
/*
<space>   ::= \u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u0009\u000A\u000B\u000C\u000D\u0085\u2028\u2029\u200B
<char>    ::= [^<space>"]
<digit>   ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
<number>  ::= <digit>+ | <digit>+ '.' <digit>+
<string>  ::= <char>+
<exstr>   ::=  [^\"]+

<exact>   ::=  '"' <exstr> '"'
<fuzzy>   ::= <string>

<token>   ::= <exact> | <fuzzy>
<term>    ::= <token> | '-' <token>
<group>   ::= <term> | '(' <space>* <expr> <space>* ')'
<adj>     ::= 'from:' <string> <space>+ <group> | 'weight:' <number> <space>+ <group> | group
<and>     ::= <adj> (<space>+ <adj>)*
<expr>    ::= <and> [<space>+ 'or' <space>+ <and>]*
*/

type Exact = {
    type: 'exact';
    str: string;
};

type Fuzzy = {
    type: 'fuzzy';
    str: string;
};

type Not = {
    type: 'not';
    node: ASTNode;
}

type Null = {
    type: 'null';
}

type From = {
    type: 'from';
    field: string;
    node: ASTNode;
}

type Weight = {
    type: 'weight';
    weight: number;
    node: ASTNode;
}

type And = {
    type: 'and';
    nodes: ASTNode[];
}

type Or = {
    type: 'or';
    nodes: ASTNode[];
}

export type ASTNode = Null | Exact | Fuzzy | Not | From | Weight | And | Or;


export const ident: Parser<Str> = rep(diff(getc, or(...['"', '(', ')', ...spaces].map(char))), 1);
export const fuzzy: Parser<ASTNode> = map(diff(ident, str("OR")), (x) => ({type: 'fuzzy', str: x.join('')}));

const dquote: Parser<Str> = map(char('"'), () => []);

export const exact: Parser<ASTNode> = map(cat(dquote, rep(diff(getc, or(char('"'), char('('), char(')')))), dquote), (x) => ({type: 'exact', str: x[1].join('')}));

export const token: Parser<ASTNode> = or(exact, fuzzy);
export const not: Parser<ASTNode> = map(cat(char('-'), token), (x) => ({type: 'not', node: x[1]}));
export const term: Parser<ASTNode> = or(not, token);
export const paren: Parser<ASTNode> = map(cat(char('('), space, expr, space, char(')')), (x) => x[2]);
export const group: Parser<ASTNode> = or(term, paren)
export const from: Parser<ASTNode> =  map(cat(str('from:'), ident, space1, group), (x) => ({type: 'from', field: x[1].join(''), node: x[3]}));
export const weight: Parser<ASTNode> = map(cat(str('weight:'), or(float, int), space1, group), (x) => ({type: 'weight', weight: x[1], node: x[3]}));
export const adj: Parser<ASTNode> = or(from, weight, group);
export const and: Parser<ASTNode> = map(cat(adj, rep(map(cat(space1, adj), (x) => x[1]))), (x) => ({type: 'and', nodes: [x[0], ...x[1]]}));

// using "as": fix it.
export function expr(s: Str): ParserOut<ASTNode> {
    return map(cat(and, rep(map(cat(space1, str('OR'), space1, and), (x) => x[3]))), (x) => ({type: 'or', nodes: [x[0], ...x[1]]} as ASTNode))(s);
}