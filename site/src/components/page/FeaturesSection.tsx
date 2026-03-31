import { InlineCode } from "../InlineCode";
import { BulletList } from "../shared/BulletList";
import { ContentSection } from "./ContentSection";

const FEATURES = [
  <>
    Local SQLite-backed state inside <InlineCode>.trekker</InlineCode>.
  </>,
  "Tasks, epics, subtasks, comments, and dependencies.",
  "Full-text search and history for context recovery.",
  <>
    Structured <InlineCode>--toon</InlineCode> output for agent-friendly
    parsing.
  </>,
  "A separate dashboard package when you want a visual board.",
];

export function FeaturesSection() {
  return (
    <ContentSection id="features" title="Features">
      <p>
        The product is deliberately narrow. It is a local task system for
        agents, not a hosted project management platform.
      </p>
      <BulletList items={FEATURES} />
    </ContentSection>
  );
}
