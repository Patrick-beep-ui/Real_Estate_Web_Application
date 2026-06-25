"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveContent, cleanMarkdownContent, createHeadingId, stripFAQFromContent } from "@/lib/blog-utils";

function cleanHeadingChild(child: React.ReactNode): React.ReactNode {
  return typeof child === "string" ? child.replace(/^#{1,6}\s+/, "") : child;
}

function cleanChildren(children: React.ReactNode) {
  return Array.isArray(children) ? children.map(cleanHeadingChild) : cleanHeadingChild(children);
}

function getTextContent(children: React.ReactNode): string {
  return String(children).trim().replace(/^#{1,6}\s+/, "");
}

const headingComponents = {
  h1: ({ children, ...props }: any) => {
    const id = createHeadingId(getTextContent(children));
    return (
      <h2
        id={id}
        className="text-3xl md:text-4xl font-bold text-foreground mt-12 mb-6 scroll-mt-24"
        {...props}
      >
        {cleanChildren(children)}
      </h2>
    );
  },
  h2: ({ children, ...props }: any) => {
    const id = createHeadingId(getTextContent(children));
    return (
      <h3
        id={id}
        className="text-xl md:text-2xl font-semibold text-foreground mt-8 mb-3 pl-4 border-l-4 border-accent scroll-mt-24"
        {...props}
      >
        {cleanChildren(children)}
      </h3>
    );
  },
  h3: ({ children, ...props }: any) => {
    const id = createHeadingId(getTextContent(children));
    return (
      <h4
        id={id}
        className="text-xl md:text-2xl font-semibold text-foreground mt-8 mb-3 scroll-mt-24"
        {...props}
      >
        {cleanChildren(children)}
      </h4>
    );
  },
};

const components = {
  ...headingComponents,
  p: ({ children, ...props }: any) => {
    const cleaned = cleanChildren(children);
    return (
      <p className="my-4 text-lg leading-relaxed text-muted-foreground" {...props}>
        {cleaned}
      </p>
    );
  },
  a: ({ href, children, ...props }: any) => (
    <a
      href={href?.replace(/\/locations\//g, "/markets/")}
      className="text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-accent pl-6 py-2 my-6 italic text-muted-foreground bg-accent/5 rounded-r-lg"
      {...props}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-outside pl-6 my-6 space-y-3 text-muted-foreground marker:text-accent" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-outside pl-6 my-6 space-y-3 text-muted-foreground marker:text-accent marker:font-semibold" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-lg leading-relaxed pl-1" {...props}>
      {children}
    </li>
  ),
  img: (props: any) => (
    <img
      src={props.src || ""}
      alt={props.alt || ""}
      className="rounded-lg my-8 mx-auto max-w-full md:max-w-[80%] h-auto shadow-md"
      loading="lazy"
    />
  ),
  hr: (props: any) => (
    <hr className="my-12 border-border" {...props} />
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-8">
      <table className="w-full border-collapse text-left text-sm md:text-base" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-accent/10" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-border" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-accent/5 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 font-semibold text-foreground border-b-2 border-accent" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3 text-muted-foreground" {...props}>
      {children}
    </td>
  ),
};

export function BlogMarkdown({ content, className }: { content: string; className?: string }) {
  const resolved = resolveContent(content || "");
  const cleaned = cleanMarkdownContent(resolved.replace(/<script[\s\S]*?<\/script>/gi, "").trim());

  return (
    <div className={className || "prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-accent hover:prose-a:text-accent/80 prose-li:text-muted-foreground prose-blockquote:border-accent prose-blockquote:text-muted-foreground"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {stripFAQFromContent(cleaned) || "*No content*"}
      </ReactMarkdown>
    </div>
  );
}
