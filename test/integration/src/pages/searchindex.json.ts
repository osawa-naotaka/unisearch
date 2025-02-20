import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";
import { array_of_articles } from "../../../array_of_articles";

export async function GET() {
    const index = createIndex(GPULinearIndex, array_of_articles, {
        search_targets: ["content", "data.title", "data.description", "data.tags"],
        key_fields: ["data"],
    });
    if (index instanceof StaticSeekError) {
        return new Response(null, { status: 500, statusText: index.message });
    }

    return new Response(JSON.stringify(indexToObject(index)));
}
