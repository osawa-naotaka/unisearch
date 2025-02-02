import type { Path } from "@src/frontend/base";

function isPlainObject(value: unknown): value is Record<Path, unknown> {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}

export function getValueByPath(path: Path, obj: unknown): unknown {
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

export function setObject(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split(".");
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];

        if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
            current[key] = {};
        }

        current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
}
