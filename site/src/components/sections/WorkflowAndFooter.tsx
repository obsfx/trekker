import { Section } from "../Section";
import { CodeBlock, InlineCode } from "../CodeBlock";
import { NumberedList } from "../ListItems";

const WORKFLOW_STEPS = [
  "Install the Claude Code plugin",
  "Tell the agent to use Trekker in your prompt",
  <>Point the agent to <InlineCode>trekker quickstart</InlineCode> for reference</>,
  "Open the dashboard to watch progress",
];

export function WorkflowAndFooter() {
  return (
    <>
      <Section title="AI Agent Workflow">
        <div className="mb-6">
          <NumberedList items={WORKFLOW_STEPS} />
        </div>
        <p className="text-fluid-base text-white/70 mb-4 leading-relaxed">
          Example prompt:
        </p>
        <CodeBlock wrap>{`Use trekker to track your work. Run \`trekker quickstart\` if you need to learn how it works.`}</CodeBlock>
      </Section>

      <footer className="py-6 mt-4 border-t border-white/20">
        <div className="flex justify-center items-center gap-6 text-fluid-sm text-white/60">
          <a
            href="https://github.com/obsfx/trekker"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@obsfx/trekker"
            className="hover:text-white transition-colors"
          >
            npm
          </a>
        </div>
      </footer>
    </>
  );
}
