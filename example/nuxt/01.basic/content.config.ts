import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    contents: defineCollection({
        type: 'data',
        source: 'contents/*.json',
        schema: z.object({
          data: z.array(z.string()),
        }),
      }),
    }
  },
);
