import { InlineCode } from "../InlineCode";

interface InlineCodeListProps {
  items: string[];
}

export function InlineCodeList({ items }: InlineCodeListProps) {
  return (
    <>
      {items.map((item, index) => (
        <span key={item}>
          <InlineCode>{item}</InlineCode>
          {index < items.length - 1 ? ", " : "."}
        </span>
      ))}
    </>
  );
}
