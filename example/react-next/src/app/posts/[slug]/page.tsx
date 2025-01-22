import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { remark } from "remark";
import html from "remark-html";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

type Params = { params: Promise<{ slug: string; }>; };

export default async function PostPage(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = (await remark().use(html).process(post.content || "")).toString();

  return (
    <section>
        <article>
          <h2>{post.title}</h2>
          <div className="main-text" dangerouslySetInnerHTML={{ __html: content }} />
        </article>
    </section>
  );
}
