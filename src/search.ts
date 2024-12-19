import type { SearchEnv, SearchIndex, SearchResult, UniIndex } from "@src/base";
import { UniSearchError } from "@src/base";
import type { ASTNode } from "@src/parse";
import { expr } from "@src/parse";
import { defaultNormalizer } from "./preprocess";

export function search<T>(index: UniIndex<SearchIndex<T>>, query: string): SearchResult[] | UniSearchError {
    const ast = expr([...defaultNormalizer(query)]);
    return ast
        ? evalQuery(
              index.index_entry,
              createWithProp(createWithProp(index.env, "distance", 1), "weight", 1),
          )(ast.val).sort((a, b) => b.score - a.score)
        : new UniSearchError("fail to parse query");
}

function createWithProp<T>(obj: SearchEnv, prop: string, val: T): SearchEnv {
    const new_obj = Object.create(obj);
    new_obj[prop] = val;
    return new_obj;
}

const evalQuery =
    <T>(index: SearchIndex<T>, env: SearchEnv) =>
    (ast: ASTNode): SearchResult[] => {
        switch (ast.type) {
            case "exact":
                return index.search(createWithProp(env, "distance", 0), ast.str);
            case "fuzzy":
                return index.search(env, ast.str);
            case "from":
                return evalQuery(index, createWithProp(env, "search_targets", [ast.field]))(ast.node); // fix it.
            case "weight":
                return evalQuery(index, createWithProp(env, "weight", ast.weight))(ast.node);
            case "distance":
                return evalQuery(index, createWithProp(env, "distance", ast.distance))(ast.node);
            case "and":
                return intersectResults(ast.nodes.map(evalQuery(index, env)));
            case "or":
                return unionResults(ast.nodes.map(evalQuery(index, env)));
            default:
                return [];
        }
    };

function unionResults(results: SearchResult[][]): SearchResult[] {
    return results.reduce((prev, cur) => {
        const result: SearchResult[] = prev;
        for (const c of cur) {
            const p = result.find((x) => x.id === c.id);
            if (p) {
                p.refs = [...p.refs, ...c.refs];
                p.score += c.score;
            } else {
                result.push(c);
            }
        }
        return result;
    });
}

function intersectResults(results: SearchResult[][]): SearchResult[] {
    return results.reduce((prev, cur) => {
        const result: SearchResult[] = [];
        for (const p of prev) {
            const c = cur.find((x) => x.id === p.id);
            if (c) result.push({ id: c.id, key: c.key, score: c.score + p.score, refs: [...p.refs, ...c.refs] });
        }
        return result;
    });
}
