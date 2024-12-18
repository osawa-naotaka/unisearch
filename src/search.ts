import { UniIndex, SearchIndex, SearchResult, UniSearchError } from "@src/base";
import { ASTNode, expr } from "@src/parse";

export function search<T>(index: UniIndex<SearchIndex<T>>, query: string): SearchResult[] | UniSearchError {
    const ast = expr([...query]);
    return ast ? evalQuery(index)(ast.val) : new UniSearchError("fail to parse query");
}

const evalQuery = <T>(index: UniIndex<SearchIndex<T>>) => (ast: ASTNode): SearchResult[] => {
    switch(ast.type) {
        case 'exact': return index.index_entry.search(index.search_targets, index.key_field, 0, ast.str);
        case 'fuzzy': return index.index_entry.search(index.search_targets, index.key_field, 1, ast.str);
        case 'and': return intersectResults(ast.nodes.map(evalQuery(index)));
        case 'or': return unionResults(ast.nodes.map(evalQuery(index)));
        default: return [];
    }
}

function unionResults(results: SearchResult[][]): SearchResult[] {
    return Array.from(results.reduce((prev, cur) => {
        const result: SearchResult[] = prev;
        for(const c of cur) {
            const p = result.find((x) => x.id === c.id);
            if(p) {
                p.refs = [...p.refs, ...c.refs];
                p.score += c.score;
            } else {
                result.push(c);
            }
        }
        return result;
    }).values());    
}

function intersectResults(results: SearchResult[][]): SearchResult[] {
    return Array.from(results.reduce((prev, cur) => {
        const result: SearchResult[] = [];
        for(const p of prev) {
            const c = cur.find((x) => x.id === p.id);
            if(c) result.push({id: c.id, key: c.key, score: c.score + p.score, refs: [...p.refs, ...c.refs]});
        }
        return result;
    }).values());    
}
