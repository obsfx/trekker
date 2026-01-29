import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  children: string;
  wrap?: boolean;
}

export function CodeBlock({ children, wrap = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative -mx-4 md:mx-0">
      {/* Copy button - outside scrollable area */}
      <button
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-3 right-3 md:right-3 max-md:right-4 z-10 p-2 rounded-md bg-white/20 text-white/60 hover:text-white hover:bg-white/30 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <pre className={`font-mono text-fluid-sm bg-white/10 p-4 pr-14 rounded-lg md:rounded-lg max-md:rounded-none codeblock-scroll ${wrap ? 'whitespace-pre-wrap' : 'overflow-x-auto'}`}>
        <code className="text-white/90">{children}</code>
      </pre>
    </div>
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
