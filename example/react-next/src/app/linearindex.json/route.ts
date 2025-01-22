import { createIndex, UniSearchError, LinearIndex, indexToObject } from "unisearch.js";
import { getAllPosts } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET(request: Request) {
    const allPosts = getAllPosts();
    const index = createIndex(LinearIndex, allPosts, {key_fields: ["title", "slug"]});
    if (index instanceof UniSearchError) {
      return new Response(index.message, { status:500 });
    }
    return Response.json(indexToObject(index));
}
