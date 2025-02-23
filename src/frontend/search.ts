import type { SearchEnv, SearchIndex, SearchResult, StaticSeekIndexRoot } from "@src/frontend/base";
import { StaticSeekError } from "@src/frontend/base";
import type { ASTNode } from "@src/frontend/parse";
import { expr } from "@src/frontend/parse";
import { defaultNormalizer, splitByGrapheme, splitBySpace } from "@src/util/preprocess";

export async function search<T>(
    index: StaticSeekIndexRoot<SearchIndex<T>>,
    query: string,
): Promise<SearchResult[] | StaticSeekError> {
    try {
        const ast = expr(splitByGrapheme(normalizeQuery(query)));
        if (ast === null) return [];
        const r = await evalQuery(index.index_entry, index.env)(ast.val);
        return r.type === "excludes" ? [] : r.results.sort((a, b) => b.score - a.score);
    } catch (e) {
        if (e instanceof StaticSeekError) return e;
        throw e;
    }
}

export function createWithProp<T>(obj: SearchEnv, prop: string, val: T): SearchEnv {
    const new_obj = Object.create(obj);
    new_obj[prop] = val;
    return new_obj;
}

export function adjastDistance(env: SearchEnv, keyword: string[]): SearchEnv {
    const distance = Math.min(env.distance, Math.max(0, keyword.length - 2));
    return createWithProp(env, "distance", distance);
}

type QueryResult = {
    type: "includes" | "excludes";
    results: SearchResult[];
};

const evalQuery =
    <T>(index: SearchIndex<T>, env: SearchEnv) =>
    async (ast: ASTNode): Promise<QueryResult> => {
        switch (ast.type) {
            case "exact":
                return { type: "includes", results: await index.search(createWithProp(env, "distance", 0), ast.str) };
            case "fuzzy":
                return {
                    type: "includes",
                    results: await index.search(adjastDistance(env, ast.str), ast.str),
                };
            case "not": {
                const r = await evalQuery(index, env)(ast.node);
                return { type: "excludes", results: r.results };
            }
            case "from": {
                const path = env.field_names[ast.field];
                if (path) {
                    return evalQuery(index, createWithProp(env, "search_targets", [path]))(ast.node);
                }
                return evalQuery(index, env)(ast.node);
            }
            case "weight":
                return evalQuery(index, createWithProp(env, "weight", ast.weight))(ast.node);
            case "distance":
                return evalQuery(index, createWithProp(env, "distance", ast.distance))(ast.node);
            case "and":
                return intersectQueryResults(await Promise.all(ast.nodes.map(evalQuery(index, env))));
            case "or":
                return unionQueryResults(await Promise.all(ast.nodes.map(evalQuery(index, env))));
            default:
                return { type: "excludes", results: [] };
        }
    };

function unionQueryResults(results: QueryResult[]): QueryResult {
    const filtered = results.filter((r) => r.type === "includes");
    return filtered.reduce((prev, cur) => {
        const result: SearchResult[] = prev.results;
        for (const c of cur.results) {
            const p = result.find((x) => x.id === c.id);
            if (p) {
                p.refs = [...p.refs, ...c.refs];
                p.score += c.score;
            } else {
                result.push(c);
            }
        }
        return { type: "includes", results: result };
    });
}

function intersectQueryResults(results: QueryResult[]): QueryResult {
    const sorted = results.sort((a, b) => (b.type < a.type ? -1 : 1));

    return sorted.reduce((prev, cur) => {
        const result: SearchResult[] = [];
        for (const p of prev.results) {
            const c = cur.results.find((x) => x.id === p.id);
            if (cur.type === "includes") {
                if (c) result.push({ id: c.id, key: c.key, score: c.score + p.score, refs: [...p.refs, ...c.refs] });
            } else {
                if (!c) result.push(p);
            }
        }
        return { type: "includes", results: result };
    });
}

export function intersectResults(results: SearchResult[][]): SearchResult[] {
    return results.reduce((prev, cur) => {
        const result: SearchResult[] = [];
        for (const p of prev) {
            const c = cur.find((x) => x.id === p.id);
            if (c) result.push({ id: c.id, key: c.key, score: c.score + p.score, refs: [...p.refs, ...c.refs] });
        }
        return result;
    });
}

function normalizeQuery(q: string): string {
    const terms = splitBySpace([q]);
    return terms.map((t) => (t === "OR" ? "OR" : defaultNormalizer(t))).join(" ");
}
