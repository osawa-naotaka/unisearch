import { wikipedia_ja_extracted } from "@test/wikipedia_ja_extracted";
import { createIndex, LinearIndex, UniSearchError } from "@src/main";
import { search } from "@src/main";

const index = createIndex(LinearIndex, wikipedia_ja_extracted);
if(index instanceof UniSearchError) throw index;

const result = search(index, "distance:3 アンパサンド");
console.log(result);
