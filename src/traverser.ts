import { UniSearchError } from '@src/indexing'
import type { Path } from '@src/indexing';

export function getValueByPath(obj: any, path: Path): any {
    const keys = path.split('.');
    return path === "" ? obj : keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function* traverse(path: Path, value: any): Generator<[Path, string]> {
    if (typeof value === "string") {
        yield [path, value];
    } else if (typeof value === "object" && value !== null) {
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                yield* traverse(path === "" ? key : path + "." + key, value[key]);
            }
        }
    }
}

export function* traverseIn(obj: any): Generator<[Path, string]> {
    yield* traverse("", obj);
}

export function* traverseSelected(obj: any, paths: Path[]): Generator<[Path, string]> {
    for(const path of paths) {
        const val = getValueByPath(obj, path);
        if(val === undefined) throw new UniSearchError(`unisearch: cannot find path ${path}`);
        yield* traverse(path, val);
    }
}

export function extractStrings(path: Path, obj: any): [Path, string][] {
    if (typeof obj === "string") {
        return [[path, obj]];
    } else if (typeof obj === "object" && obj !== null) {
        return Object.keys(obj).flatMap((key) => extractStrings(path ? `${path}.${key}` : key, obj[key])).filter((x) => x !== null);
    }
    return [];
}
