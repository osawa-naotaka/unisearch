import * as v from "valibot";

export const PostInfo_v = v.object({
    id: v.string(),
    data: v.object({
        title: v.string(),
    }),
});
