import { getCollection } from "astro:content";
import { GPULinearIndex, UniSearchError, createIndex, indexToObject } from "unisearch.js";

export async function GET() {
    const posts = await getCollection("posts");
    const linear_index = createIndex(GPULinearIndex, posts, {
        search_targets: ["body", "data.title"],
        key_fields: ["data.title", "id"],
    });
    if (linear_index instanceof UniSearchError) {
        return new Response(null, { status: 500, statusText: linear_index.message });
    }

    return new Response(JSON.stringify(indexToObject(linear_index)));
}
