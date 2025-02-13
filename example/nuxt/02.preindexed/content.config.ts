import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    posts: defineCollection({
        type: 'page',
        source: '../../../posts/*.md',
        schema: z.object({
          title: z.string(),
          rawbody: z.string(),
        }),
      }),
    }
  },
);
