import { CommandBlockList } from "../shared/CommandBlockList";
import { InlineCodeList } from "../shared/InlineCodeList";
import { ContentSection } from "./ContentSection";

const CLAUDE_INSTALL = [
  "claude plugin marketplace add obsfx/trekker-claude-code",
  "claude plugin install trekker",
];

const CLAUDE_COMMANDS = [
  "/trekker:prime",
  "/trekker:ready",
  "/trekker:start",
  "/trekker:done",
  "/trekker:task-agent",
];

const CODEX_INSTALL = [
  "git clone git@github.com:obsfx/trekker-codex.git ~/plugins/trekker-codex",
];

const CODEX_SKILLS = [
  "trekker",
  "planning",
  "search",
  "task-sync",
  "issue-tracking",
  "complete-task",
];

export function AgentsSection() {
  return (
    <ContentSection id="agents" title="Agents">
      <h3>Claude Code</h3>
      <p>
        The Claude Code plugin adds Trekker tools, slash commands, skills, and
        lifecycle hooks so tracked state survives across sessions and subagent
        work.
      </p>
      <CommandBlockList commands={CLAUDE_INSTALL} />
      <p>
        Common commands: <InlineCodeList items={CLAUDE_COMMANDS} />
      </p>

      <h3>Codex</h3>
      <p>
        The Codex plugin brings the same persistent task model into Codex with
        bundled Trekker tools and workflow skills.
      </p>
      <CommandBlockList commands={CODEX_INSTALL} />
      <p>
        Core skills: <InlineCodeList items={CODEX_SKILLS} />
      </p>
    </ContentSection>
  );
}
