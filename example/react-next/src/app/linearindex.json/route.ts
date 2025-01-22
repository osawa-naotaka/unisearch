import { createIndex, UniSearchError, GPULinearIndex, indexToObject } from "unisearch.js";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET(request: Request) {
    const allPosts = getAllPosts();
    const index = createIndex(GPULinearIndex, allPosts, {key_fields: ["title", "slug"], search_targets: ["title", "content"]});
    if (index instanceof UniSearchError) {
      return new Response(index.message, { status:500 });
    }
    return Response.json(indexToObject(index));
}
