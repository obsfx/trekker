interface CodeBlockProps {
  children: string;
}

function normalizeCodeBlock(value: string) {
  const lines = value.replace(/\t/g, "  ").split("\n");

  while (lines.length > 0 && lines[0].trim() === "") {
    lines.shift();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => line.match(/^ */)?.[0].length ?? 0);

  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;

  return lines.map((line) => line.slice(minIndent)).join("\n");
}

export function CodeBlock({ children }: CodeBlockProps) {
  const normalized = normalizeCodeBlock(children);

  return (
    <pre className="code-block">
      <code>{normalized}</code>
    </pre>
  );
}
