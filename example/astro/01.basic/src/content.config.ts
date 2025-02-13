import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const contents = defineCollection({
    loader: glob({ pattern: "./[^_]*.json", base: "contents" }),
    schema: z.array(z.string()),
});

export const collections = { contents };
