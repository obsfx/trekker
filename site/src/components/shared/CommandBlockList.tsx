import { CodeBlock } from "../CodeBlock";

interface CommandBlockListProps {
  commands: string[];
}

export function CommandBlockList({ commands }: CommandBlockListProps) {
  return (
    <div className="command-block-list">
      {commands.map((command) => (
        <CodeBlock key={command}>{command}</CodeBlock>
      ))}
    </div>
  );
}
