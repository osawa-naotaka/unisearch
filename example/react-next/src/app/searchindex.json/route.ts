import { getAllPosts } from "@/lib/posts";
import { GPULinearIndex, UniSearchError, createIndex, indexToObject } from "unisearch.js";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET(request: Request) {
    const allPosts = await getAllPosts();
    const index = createIndex(GPULinearIndex, allPosts, { key_fields: ["data.title", "slug"], search_targets: ["data.title", "content"] });
    if (index instanceof UniSearchError) {
        return new Response(index.message, { status: 500 });
    }
    return Response.json(indexToObject(index));
}