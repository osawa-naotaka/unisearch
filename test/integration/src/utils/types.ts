import * as v from "valibot";

export const PostInfo_v = v.object({
    data: v.object({
        title: v.string(),
        description: v.string(),
        tags: v.array(v.string())
    }),
});
