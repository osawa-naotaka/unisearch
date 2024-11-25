import type { LinearIndex } from "@src/types";
import { wikipedia_articles_ja } from "@test/wikipedia_articles.ja";
import { calculateJsonSize } from "@src/util";
import { docToLinearIndex, searchLinear } from "@src/linear";

// article size
console.log("articles size: " + calculateJsonSize(wikipedia_articles_ja))

// linear search
console.log("LINEAR SEARCH");
const linear_index : LinearIndex = [];
wikipedia_articles_ja.map((x, idx) => docToLinearIndex(idx, x.content, linear_index));
const ref_result = searchLinear("ナイター", linear_index);
console.log(ref_result);
