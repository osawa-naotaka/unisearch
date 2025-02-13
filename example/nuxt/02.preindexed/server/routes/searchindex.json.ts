import { GPULinearIndex, StaticSeekError, createIndex, indexToObject } from "staticseek";
import type { IndexClass } from "staticseek";
import matter from "gray-matter";

export default defineEventHandler(async (event) => {
    const raw_posts = await queryCollection(event, "posts").all();
    const posts = raw_posts.map((post) => ({ stem: post.stem, body: matter(post.rawbody.replaceAll("\\n", "\n")) }));

    const index_class: IndexClass = GPULinearIndex;
    const index = createIndex(index_class, posts, { 
        key_fields: ["stem", "body.data.title"], 
        search_targets: ["body.data.title", "body.content"] 
    });
    
    if (index instanceof StaticSeekError) {
        throw createError({
            statusCode: 500,
            message: index.message
        });
    }
    
    return indexToObject(index);
});
