import { getCollection } from "astro:content";
import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";
import type { IndexClass } from "staticseek";

export type SearchKey = {
    id: string;
    data: {
        title: string;
    };
};

export async function GET() {
    const posts = await getCollection("posts");
    const index_class: IndexClass = GPULinearIndex;
    const linear_index = createIndex(index_class, posts, {
        search_targets: ["body", "data.title"],
        key_fields: ["data.title", "id"],
    });
    if (linear_index instanceof StaticSeekError) {
        return new Response(null, { status: 500, statusText: linear_index.message });
    }

    return new Response(JSON.stringify(indexToObject(linear_index)));
}
