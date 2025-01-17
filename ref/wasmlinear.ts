import type { Reference } from "@ref/common";
import { normalizeText } from "@ref/preprocess";
import type { StringManager } from "@ref/bitap-wasm/pkg/bitap";

export type WasmLinearIndex = StringManager;

export function addToWasmLinearIndex(ref: Reference, doc: string, index: WasmLinearIndex) {
    index.register(ref.id, doc);
}

export function searchWasmLinear(query: string, index: WasmLinearIndex): Reference[] {
    const query_normalized = normalizeText(query);
    index.register_keyword(query_normalized);
    const refs = [];
    for (let i = 0; i < index.size(); i++) {
        const results = index.find_all(i);
        if (results.length !== 0) {
            refs.push({
                id: i,
                n: results.length,
                position: Array.from(results).map((x) => ({ index: x })),
            });
        }
    }
    return refs;
}
