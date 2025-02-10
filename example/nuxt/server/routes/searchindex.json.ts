import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";
import type { IndexClass } from "staticseek";
import { getAllPosts } from "../utils/posts";

export default defineEventHandler(async (event) => {
    const posts = await getAllPosts();
    const index_class: IndexClass = GPULinearIndex;
    const index = createIndex(index_class, posts, { 
        key_fields: ["data.title", "slug"], 
        search_targets: ["data.title", "content"] 
    });
    
    if (index instanceof StaticSeekError) {
        throw createError({
            statusCode: 500,
            message: index.message
        });
    }
    
    return indexToObject(index);
});
