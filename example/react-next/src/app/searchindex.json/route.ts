import { getAllPosts } from "@/lib/posts";
import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";
import type { IndexClass } from "staticseek";

export const dynamic = "force-static";
export const revalidate = false;

export type SearchKey = {
    slug: string;
    data: {
      title: string;
    }
};

export async function GET(request: Request) {
    const allPosts = await getAllPosts();
    const index_class: IndexClass = GPULinearIndex;
    const index = createIndex(index_class, allPosts, { key_fields: ["data.title", "slug"], search_targets: ["data.title", "content"] });
    if (index instanceof StaticSeekError) {
        return new Response(index.message, { status: 500 });
    }
    return Response.json(indexToObject(index));
}
