import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import { Post } from "@/app/_components/post";
import { getAllPosts } from "@/lib/api";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
      slug: post.slug,
  }));
}

type Params = {
  params: Promise<{ slug: string; }>;
};

export default async function PostPage(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");

  return (
    <section>
        <article className="mb-32">
          <Post
            title={post.title}
            content={content}
          />
        </article>
    </section>
  );
}
