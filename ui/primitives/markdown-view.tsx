import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  source: string;
}

export function MarkdownView({ source }: MarkdownViewProps) {
  return (
    <div className="markdown-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
