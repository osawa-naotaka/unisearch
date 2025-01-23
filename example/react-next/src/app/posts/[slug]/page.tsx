import { getPostBySlug, getPostSlugs } from "@/lib/posts";
import { compileMDX } from "next-mdx-remote/rsc";

export async function generateStaticParams() {
    const posts = getPostSlugs();
    return posts.map((slug) => ({ slug: slug }));
}

type Params = { params: Promise<{ slug: string }> };

export default async function PostPage(props: Params) {
    const params = await props.params;
    const post = await getPostBySlug(params.slug);
    const { content } = await compileMDX({ source: post.content, options: { mdxOptions: { format: "md" } } });

    return (
        <section>
            <article>
                <h2>{post.data.title as string}</h2>
                {content}
            </article>
        </section>
    );
}
