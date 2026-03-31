import { InlineCode } from "../InlineCode";
import { BulletList } from "../shared/BulletList";
import { ContentSection } from "./ContentSection";

const WORKFLOW = [
  <>
    Install Trekker and initialize the repository with{" "}
    <InlineCode>trekker init</InlineCode>.
  </>,
  "Teach the agent to search current Trekker state before starting work.",
  "Let the agent update status and write completion notes back into Trekker.",
  "Resume from tracked state in the next session instead of reconstructing context from chat.",
];

export function HowAgentsUseItSection() {
  return (
    <ContentSection title="How agents use it">
      <p>
        Trekker gives coding agents a small, explicit system for tracking what
        they are doing. The state lives in the repository, so an agent can
        search it, continue from it, and update it without depending on
        temporary chat memory.
      </p>
      <BulletList items={WORKFLOW} />
    </ContentSection>
  );
}
