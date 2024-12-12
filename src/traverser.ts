import type { Path } from "@src/indexing";

export function getValueByPath(path: Path, obj: any): any {
    const keys = path.split(".");
    return path === "" ? obj : keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function extractStringsAll(path: Path, obj: any): [Path, string][] {
    if (typeof obj === "string") {
        return [[path, obj]];
    }
    if (Array.isArray(obj)) {
        return [[path, obj.join(" ")]];
    }
    if (typeof obj === "object" && obj !== null) {
        return Object.keys(obj)
            .flatMap((key) => extractStringsAll(path ? `${path}.${key}` : key, obj[key]))
            .filter((x) => x !== null);
    }
    return [];
}
