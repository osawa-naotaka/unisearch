import markdownStyles from "./markdown-styles.module.css";

type Props = {
    title: string;
    content: string;
};

export function Post({ title, content }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
         <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight md:leading-none mb-12 text-center md:text-left">
          {title}
        </h1>
        <div
            className={markdownStyles["markdown"]}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    </div>
  );
}
