import { Section } from "../Section";
import { InlineCode } from "../CodeBlock";
import { CheckList } from "../ListItems";

const FEATURES = [
  "Tasks, epics, subtasks, and dependencies",
  "Full-text search across all items",
  "Filter by type, status, or priority",
  "Kanban board via separate dashboard package",
  <>Stores everything in a local <InlineCode>.trekker</InlineCode> folder</>,
  "TOON output format for AI token efficiency",
];

export function FeaturesSection() {
  return (
    <Section title="Features" id="features">
      <CheckList items={FEATURES} />
    </Section>
  );
}
