import { getAllKeywords } from "@ref/bench/benchmark_common";
import { createIndex, search, GPULinearIndex, StaticSeekError, indexToObject, HybridTrieBigramInvertedIndex } from "@src/main";
import { wikipedia_en_extracted } from "@test/wikipedia_en_extracted";
import { wikipedia_en_keyword } from "@test/wikipedia_en_keyword";

const index_start = performance.now();
const index = createIndex(HybridTrieBigramInvertedIndex, wikipedia_en_extracted.slice(0, 100), { key_fields: ["title"]});
if(index instanceof StaticSeekError) throw index;
console.log(`indexing time: ${performance.now() - index_start} ms`);
console.log(`index size: ${new Blob([JSON.stringify(indexToObject(index))]).size} byte`);

const input = document.querySelector<HTMLInputElement>("input#search-text");
const result = document.querySelector("ul#result");
const button = document.querySelector("button#run");
if(input === null || result === null || button === null) throw new Error("id search-text or result or run are not found.");

input.addEventListener("input", async () => {
    const search_start = performance.now();
    const res = await search(index, input.value);
    if(res instanceof StaticSeekError) throw res;
    console.log(`search time: ${performance.now() - search_start} ms.`);
    result.innerHTML = res.map((r) => `<li><div>${r.key["title"]}</div><p>${r.refs[0].wordaround}</p></li>`).join("\n");
});

button.addEventListener("click", async () => {
    const keywords = getAllKeywords(wikipedia_en_keyword).slice(0,100);
    const search_start = performance.now();
    const res = [];
    for(const k of keywords) {
        const r = await search(index, k);
        if(r instanceof StaticSeekError) throw r;
        res.push(r);
    }
    console.log(`search time: ${(performance.now() - search_start) / keywords.length} ms.`);    
    console.log(res);
})

