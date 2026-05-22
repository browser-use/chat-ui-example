"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-6 text-2xl font-bold tracking-tight last:mb-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-4 mt-6 text-xl font-semibold tracking-tight first:mt-0 last:mb-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-5 text-lg font-semibold tracking-tight first:mt-0 last:mb-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-3 mt-4 text-base font-semibold first:mt-0 last:mb-0">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-4 mt-4 leading-7 first:mt-0 last:mb-0">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 font-medium underline underline-offset-4 hover:text-blue-500 dark:hover:text-blue-300"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-4 italic text-zinc-500 dark:text-zinc-400">{children}</blockquote>
  ),
  ul: ({ children }) => (
    <ul className="my-4 ml-6 list-disc [&>li]:mt-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ml-6 list-decimal [&>li]:mt-1.5">{children}</ol>
  ),
  hr: () => <hr className="my-5 border-zinc-300 dark:border-zinc-700" />,
  table: ({ children }) => (
    <table className="my-4 w-full border-separate border-spacing-0 overflow-y-auto">{children}</table>
  ),
  th: ({ children }) => (
    <th className="bg-zinc-200 dark:bg-zinc-800 px-3 py-2 text-left text-xs font-bold first:rounded-tl-lg last:rounded-tr-lg">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-l border-zinc-300 dark:border-zinc-800 px-3 py-2 text-left last:border-r">{children}</td>
  ),
  tr: ({ children }) => (
    <tr className="m-0 border-b border-zinc-300 dark:border-zinc-800 p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
      {children}
    </tr>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-4 text-sm">{children}</pre>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className={`font-mono text-sm text-zinc-800 dark:text-zinc-200 ${className}`}>{children}</code>;
    }
    return (
      <code className="bg-zinc-200 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 px-1 py-0.5 font-semibold text-sm">
        {children}
      </code>
    );
  },
};

function MarkdownImpl({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}

export const Markdown = memo(MarkdownImpl);
