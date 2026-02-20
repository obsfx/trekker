import { Section } from "../Section";
import { CodeBlock, InlineCode } from "../CodeBlock";
import { Screenshots } from "../Screenshots";

const DASHBOARD_IMAGES = [
  { src: "/trekker/images/dashboard-kanban.png", alt: "Trekker Dashboard - Kanban View" },
  { src: "/trekker/images/dashboard-epic.png", alt: "Trekker Dashboard - Epic Detail" },
  { src: "/trekker/images/dashboard-task.png", alt: "Trekker Dashboard - Task Detail" },
];

export function AdditionalFeatures() {
  return (
    <>
      <Section title="Search">
        <p className="text-fluid-base text-white/70 mb-4 leading-relaxed">
          Search across all tasks, epics, subtasks, and comments using FTS5.
        </p>
        <div className="space-y-2">
          <CodeBlock>{`trekker search "authentication"`}</CodeBlock>
          <CodeBlock>{`trekker search "bug fix" --type task,subtask`}</CodeBlock>
          <CodeBlock>{`trekker search "login" --type comment --status completed`}</CodeBlock>
          <CodeBlock>{`trekker search "query" [--type types] [--status status] [--limit n] [--page n]`}</CodeBlock>
        </div>
      </Section>

      <Section title="History">
        <p className="text-fluid-base text-white/70 mb-4 leading-relaxed">
          View an audit log of all changes.
        </p>
        <div className="space-y-2">
          <CodeBlock>{`trekker history`}</CodeBlock>
          <CodeBlock>{`trekker history --entity TREK-1`}</CodeBlock>
          <CodeBlock>{`trekker history --type task,epic --action create,update`}</CodeBlock>
          <CodeBlock>{`trekker history --since 2024-01-01 --until 2024-12-31`}</CodeBlock>
        </div>
      </Section>

      <Section title="Unified List View">
        <div className="space-y-2">
          <CodeBlock>{`trekker list`}</CodeBlock>
          <CodeBlock>{`trekker list --type task,epic`}</CodeBlock>
          <CodeBlock>{`trekker list --status todo,in_progress`}</CodeBlock>
          <CodeBlock>{`trekker list --priority 0,1,2`}</CodeBlock>
          <CodeBlock>{`trekker list --sort priority,created_at`}</CodeBlock>
        </div>
      </Section>

      <Section title="TOON Output Format">
        <p className="text-fluid-base text-white/70 mb-4 leading-relaxed">
          Use the <InlineCode>--toon</InlineCode> flag to get structured output
          that uses fewer tokens.
        </p>
        <div className="space-y-2">
          <CodeBlock>{`trekker --toon task list`}</CodeBlock>
          <CodeBlock>{`trekker --toon task show TREK-1`}</CodeBlock>
        </div>
      </Section>

      <Section title="Dashboard">
        <p className="text-fluid-base text-white/70 mb-4 leading-relaxed">
          A kanban board that reads from your <InlineCode>.trekker</InlineCode>{" "}
          database.
        </p>
        <div className="space-y-2">
          <CodeBlock>{`npm install -g @obsfx/trekker-dashboard`}</CodeBlock>
          <CodeBlock>{`trekker-dashboard -p 3000`}</CodeBlock>
        </div>
      </Section>

      <Screenshots images={DASHBOARD_IMAGES} />

      <Section title="Data Storage">
        <p className="text-fluid-base text-white/70 leading-relaxed">
          Trekker creates a <InlineCode>.trekker</InlineCode> folder in your
          project root. Add it to <InlineCode>.gitignore</InlineCode> if you do
          not want to track it.
        </p>
      </Section>
    </>
  );
}
