interface CodeBlockProps {
  children: string;
}

export function CodeBlock({ children }: CodeBlockProps) {
  return (
    <pre className="font-mono text-sm bg-neutral-100 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto -mx-4 md:mx-0 md:rounded-lg max-md:rounded-none max-md:border-x-0">
      <code>{children}</code>
    </pre>
  );
}

interface InlineCodeProps {
  children: string;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="font-mono text-sm bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}
