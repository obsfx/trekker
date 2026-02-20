import { Section, SubSection } from "../Section";
import { CodeBlock, InlineCode } from "../CodeBlock";
import { CheckList } from "../ListItems";

const KEY_FEATURES = [
  "Persistent task memory across sessions via SQLite",
  "Search-first workflow to restore context",
  "5 lifecycle hooks for automatic state management",
  "Autonomous task agent for discovery and completion",
  "Blocks internal TaskCreate/TodoWrite — enforces Trekker",
  "Multi-instance safe with conflict handling",
];

const SLASH_COMMANDS = [
  { cmd: "/trekker:prime", desc: "Load workflow context" },
  { cmd: "/trekker:create", desc: "Create task interactively" },
  { cmd: "/trekker:list", desc: "List tasks with filters" },
  { cmd: "/trekker:show", desc: "Show task details" },
  { cmd: "/trekker:ready", desc: "Find unblocked tasks" },
  { cmd: "/trekker:start", desc: "Begin working on a task" },
  { cmd: "/trekker:done", desc: "Complete with summary" },
  { cmd: "/trekker:blocked", desc: "Mark task as blocked" },
  { cmd: "/trekker:comment", desc: "Add a comment to a task" },
  { cmd: "/trekker:deps", desc: "Manage dependencies" },
  { cmd: "/trekker:epic", desc: "Manage epics" },
  { cmd: "/trekker:history", desc: "View audit log" },
  { cmd: "/trekker:task-agent", desc: "Run autonomous agent" },
];

const HOOKS = [
  { name: "SessionStart", desc: "Loads trekker state and recent activity into context" },
  { name: "PreCompact", desc: "Preserves task state before context window compaction" },
  { name: "PreToolUse", desc: "Blocks internal TaskCreate/TodoWrite to enforce Trekker" },
  { name: "Stop", desc: "Saves progress when session ends" },
  { name: "SubagentStop", desc: "Captures subagent work back into trekker" },
];

export function ClaudeCodePlugin() {
  return (
    <Section title="Claude Code Plugin">
      <div className="flex items-center gap-3 mb-4">
        <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/claude-color.png" alt="Claude" className="w-8 h-8" />
        <p className="text-fluid-base text-white/70">
          Give Claude Code direct access to Trekker with 25 MCP tools, 13 slash commands, and an autonomous task agent.
        </p>
      </div>

      <SubSection title="Install">
        <div className="space-y-2">
          <CodeBlock>{`claude /plugin marketplace add obsfx/trekker-claude-code`}</CodeBlock>
          <CodeBlock>{`claude /plugin install trekker`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="Key Features">
        <CheckList items={KEY_FEATURES} />
      </SubSection>

      <SubSection title="Slash Commands">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-fluid-sm">
          {SLASH_COMMANDS.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-white/70">
              <InlineCode>{item.cmd}</InlineCode>
              <span className="text-white/50">-</span>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Hooks">
        <p className="text-fluid-base text-white/70 mb-3 leading-relaxed">
          5 lifecycle hooks run automatically to manage state across sessions.
        </p>
        <div className="space-y-2 text-fluid-sm">
          {HOOKS.map((hook, index) => (
            <div key={index} className="flex items-start gap-2 text-white/70">
              <InlineCode>{hook.name}</InlineCode>
              <span className="text-white/50">-</span>
              <span>{hook.desc}</span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Autonomous Task Agent">
        <p className="text-fluid-base text-white/70 leading-relaxed">
          The <InlineCode>/trekker:task-agent</InlineCode> command launches an
          autonomous agent that finds ready tasks, works on them, and marks them
          complete. It picks up unblocked tasks in priority order and leaves
          comments as it progresses.
        </p>
      </SubSection>
    </Section>
  );
}
