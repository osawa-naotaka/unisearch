import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type Post = {
    slug: string;
    data: Record<string, unknown>;
    content: string;
};

const postsDirectory = path.join(path.resolve(), "..", "..", "posts");

export function getPostSlugs(): string[] {
    return fs
        .readdirSync(postsDirectory)
        .filter((file) => file.endsWith(".md"))
        .map((file) => file.replace(/\.md$/, ""));
}

export async function getPostBySlug(slug: string): Promise<Post> {
    const mdxpath = path.join(postsDirectory, `${slug}.md`);
    const text = await readFile(mdxpath, { encoding: "utf-8" });
    const { data, content } = matter(text);
    return { slug, content, data };
}

export async function getAllPosts(): Promise<Post[]> {
    return await Promise.all(getPostSlugs().map((slug) => getPostBySlug(slug)));
}
