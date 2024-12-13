import type { Path } from "@src/common";

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}

export function getValueByPath(path: string, obj: unknown): unknown {
    const keys = path.split(".");

    return path === ""
        ? obj
        : keys.reduce<unknown>((acc, key) => {
              if (isPlainObject(acc)) {
                  return key in acc ? acc[key] : undefined;
              }
              return undefined;
          }, obj);
}

export function extractStringsAll(path: Path, obj: unknown): [Path, string][] {
    if (typeof obj === "string") {
        return [[path, obj]];
    }
    if (Array.isArray(obj)) {
        return [[path, obj.join(" ")]];
    }
    if (isPlainObject(obj)) {
        return Object.keys(obj)
            .flatMap((key) => extractStringsAll(path ? `${path}.${key}` : key, obj[key]))
            .filter((x) => x !== null);
    }
    return [];
}
