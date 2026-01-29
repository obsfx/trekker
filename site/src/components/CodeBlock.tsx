import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  children: string;
}

export function CodeBlock({ children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <pre className="group relative font-mono text-fluid-sm bg-white/10 p-4 rounded-lg overflow-x-auto -mx-4 md:mx-0 md:rounded-lg max-md:rounded-none">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-3 right-3 p-2 rounded-md bg-white/10 text-white/60 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <code className="text-white/90">{children}</code>
    </pre>
  );
}

interface InlineCodeProps {
  children: string;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="font-mono text-fluid-sm bg-white/15 text-white px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}
