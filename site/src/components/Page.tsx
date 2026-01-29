import { Header, Hero } from "./Hero";
import { Section, SubSection } from "./Section";
import { CodeBlock, InlineCode } from "./CodeBlock";
import { Screenshots } from "./Screenshots";

export function Page() {
  return (
    <>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <div className="px-4 md:px-6 max-w-4xl mx-auto pb-8">
          <Hero />

      <main id="main-content">

      {/* Divider */}
      <div className="border-t border-white/20 my-4" />

      <Section title="Why Trekker">
        <div className="space-y-4">
          <p className="text-fluid-base text-white/70 leading-relaxed">
            AI coding agents work better when they can track their own progress. A
            simple CLI-based task manager keeps them on the right path across
            sessions.
          </p>
          <p className="text-fluid-base text-white/70 leading-relaxed">
            I built this after using{" "}
            <a
              href="https://github.com/steveyegge/beads"
              className="text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors"
            >
              Beads
            </a>{" "}
            for a while. Beads does the job, but its codebase has grown quickly
            without enough care for what is happening inside. A task tracker is a
            simple application. It should not need thousands of lines of code.
          </p>
          <p className="text-fluid-base text-white/70 leading-relaxed">
            My concerns about the future and security of that project led me here.
            Trekker is my simplified alternative.
          </p>
          <p className="text-fluid-base text-white/70 leading-relaxed">
            I built this with AI assistance, but I did it for myself. That means I
            put enough care into it to make it reliable for my own work.
          </p>
        </div>
      </Section>

      <Section title="Prerequisites">
        <p className="text-fluid-base text-white/70 mb-4 leading-relaxed">
          You need the Bun runtime. Trekker uses{" "}
          <InlineCode>bun:sqlite</InlineCode> for database operations. This
          makes every command respond instantly.
        </p>
        <p className="text-fluid-sm text-white/50 mb-2">macOS/Linux</p>
        <CodeBlock>{`curl -fsSL https://bun.sh/install | bash`}</CodeBlock>
        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Windows</p>
        <CodeBlock>{`powershell -c "irm bun.sh/install.ps1 | iex"`}</CodeBlock>
        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Via npm</p>
        <CodeBlock>{`npm install -g bun`}</CodeBlock>
      </Section>

      <Section title="Installation" id="installation">
        <p className="text-fluid-sm text-white/50 mb-2">Using bun (recommended)</p>
        <CodeBlock>{`bun install -g @obsfx/trekker`}</CodeBlock>
        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Using npm</p>
        <CodeBlock>{`npm install -g @obsfx/trekker`}</CodeBlock>
      </Section>

      <Section title="Features" id="features">
        <ul className="space-y-3">
          {[
            "Tasks, epics, subtasks, and dependencies",
            "Full-text search across all items",
            "Filter by type, status, or priority",
            "Kanban board via separate dashboard package",
            <>Stores everything in a local <InlineCode>.trekker</InlineCode> folder</>,
            "TOON output format for AI token efficiency",
          ].map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-fluid-base text-white/70">
              <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </Section>

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
          <ul className="space-y-2">
            {[
              "Persistent task memory across sessions via SQLite",
              "Search-first workflow to restore context",
              "Smart hooks for session start and context preservation",
              "Autonomous task agent for discovery and completion",
              "Multi-instance safe with conflict handling",
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-3 text-fluid-base text-white/70">
                <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </SubSection>

        <SubSection title="Slash Commands">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-fluid-sm">
            {[
              { cmd: "/trekker:prime", desc: "Load workflow context" },
              { cmd: "/trekker:create", desc: "Create task interactively" },
              { cmd: "/trekker:list", desc: "List tasks with filters" },
              { cmd: "/trekker:ready", desc: "Find unblocked tasks" },
              { cmd: "/trekker:start", desc: "Begin working on a task" },
              { cmd: "/trekker:done", desc: "Complete with summary" },
              { cmd: "/trekker:blocked", desc: "Mark task as blocked" },
              { cmd: "/trekker:task-agent", desc: "Run autonomous agent" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-white/70">
                <InlineCode>{item.cmd}</InlineCode>
                <span className="text-white/50">-</span>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      <Section title="Quick Start">
        <p className="text-fluid-sm text-white/50 mb-2">Initialize your project</p>
        <CodeBlock>{`trekker init`}</CodeBlock>

        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Create an epic</p>
        <CodeBlock>{`trekker epic create -t "User Authentication" -d "JWT-based auth"`}</CodeBlock>

        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Add tasks to the epic</p>
        <div className="space-y-2">
          <CodeBlock>{`trekker task create -t "Create user model" -e EPIC-1`}</CodeBlock>
          <CodeBlock>{`trekker task create -t "Build login endpoint" -e EPIC-1`}</CodeBlock>
        </div>

        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Establish dependencies (TREK-2 depends on TREK-1)</p>
        <CodeBlock>{`trekker dep add TREK-2 TREK-1`}</CodeBlock>

        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Update task status</p>
        <div className="space-y-2">
          <CodeBlock>{`trekker task update TREK-1 -s in_progress`}</CodeBlock>
          <CodeBlock>{`trekker task update TREK-1 -s completed`}</CodeBlock>
        </div>
      </Section>

      <Section title="Commands" id="commands">
        <SubSection title="Project Management">
          <div className="space-y-2">
            <CodeBlock>{`trekker init`}</CodeBlock>
            <CodeBlock>{`trekker wipe`}</CodeBlock>
            <CodeBlock>{`trekker quickstart`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Epics">
          <div className="space-y-2">
            <CodeBlock>{`trekker epic create -t "Epic title" [-d "description"] [-p 0-5]`}</CodeBlock>
            <CodeBlock>{`trekker epic list [--status todo|in_progress|completed|archived]`}</CodeBlock>
            <CodeBlock>{`trekker epic show EPIC-1`}</CodeBlock>
            <CodeBlock>{`trekker epic update EPIC-1 -s in_progress`}</CodeBlock>
            <CodeBlock>{`trekker epic complete EPIC-1`}</CodeBlock>
            <CodeBlock>{`trekker epic delete EPIC-1`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Tasks">
          <div className="space-y-2">
            <CodeBlock>{`trekker task create -t "Task title" [-d "desc"] [-p 0-5] [-e EPIC-1] [--tags "tag1,tag2"]`}</CodeBlock>
            <CodeBlock>{`trekker task list [--status todo|in_progress|completed|wont_fix|archived] [--epic EPIC-1]`}</CodeBlock>
            <CodeBlock>{`trekker task show TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker task update TREK-1 -s in_progress`}</CodeBlock>
            <CodeBlock>{`trekker task delete TREK-1`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Subtasks">
          <div className="space-y-2">
            <CodeBlock>{`trekker subtask create TREK-1 -t "Subtask title" [-d "desc"] [-p 0-5]`}</CodeBlock>
            <CodeBlock>{`trekker subtask list TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker subtask update TREK-1-1 -s completed`}</CodeBlock>
            <CodeBlock>{`trekker subtask delete TREK-1-1`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Comments">
          <div className="space-y-2">
            <CodeBlock>{`trekker comment add TREK-1 -a "agent" -c "Progress note"`}</CodeBlock>
            <CodeBlock>{`trekker comment list TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker comment update CMT-1 -c "Updated content"`}</CodeBlock>
            <CodeBlock>{`trekker comment delete CMT-1`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Dependencies">
          <div className="space-y-2">
            <CodeBlock>{`trekker dep add TREK-2 TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker dep remove TREK-2 TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker dep list TREK-1`}</CodeBlock>
          </div>
        </SubSection>
      </Section>

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

      <Section title="Status & Priority">
        <SubSection title="Priority Scale">
          <div className="overflow-x-auto">
            <table className="w-full text-fluid-sm">
              <thead>
                <tr className="border-b-2 border-white/20">
                  <th className="text-left py-3 pr-4 font-semibold text-white">
                    Priority
                  </th>
                  <th className="text-left py-3 font-semibold text-white">Label</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                {[
                  { priority: 0, label: "Critical" },
                  { priority: 1, label: "High" },
                  { priority: 2, label: "Medium (default)" },
                  { priority: 3, label: "Low" },
                  { priority: 4, label: "Backlog" },
                  { priority: 5, label: "Someday" },
                ].map((row, i) => (
                  <tr key={row.priority} className={`border-b border-white/10 ${i % 2 === 1 ? 'bg-white/5' : ''}`}>
                    <td className="py-3 pr-4 font-mono text-white">{row.priority}</td>
                    <td className="py-3">{row.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="Status Values">
          <p className="text-fluid-base text-white/70 mb-3">
            <strong className="text-white">Tasks:</strong>{" "}
            <InlineCode>todo</InlineCode>, <InlineCode>in_progress</InlineCode>,{" "}
            <InlineCode>completed</InlineCode>,{" "}
            <InlineCode>wont_fix</InlineCode>, <InlineCode>archived</InlineCode>
          </p>
          <p className="text-fluid-base text-white/70">
            <strong className="text-white">Epics:</strong>{" "}
            <InlineCode>todo</InlineCode>, <InlineCode>in_progress</InlineCode>,{" "}
            <InlineCode>completed</InlineCode>,{" "}
            <InlineCode>archived</InlineCode>
          </p>
        </SubSection>

        <SubSection title="ID Formats">
          <ul className="space-y-2 text-fluid-base text-white/70">
            <li className="flex items-center gap-2">
              <span className="text-white">Epics:</span>
              <InlineCode>EPIC-1</InlineCode>,{" "}
              <InlineCode>EPIC-2</InlineCode>, ...
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">Tasks:</span>
              <InlineCode>TREK-1</InlineCode>,{" "}
              <InlineCode>TREK-2</InlineCode>, ...
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">Comments:</span>
              <InlineCode>CMT-1</InlineCode>,{" "}
              <InlineCode>CMT-2</InlineCode>, ...
            </li>
          </ul>
        </SubSection>
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

      <Screenshots
        images={[
          {
            src: "/trekker/images/dashboard-kanban.png",
            alt: "Trekker Dashboard - Kanban View",
          },
          {
            src: "/trekker/images/dashboard-epic.png",
            alt: "Trekker Dashboard - Epic Detail",
          },
          {
            src: "/trekker/images/dashboard-task.png",
            alt: "Trekker Dashboard - Task Detail",
          },
        ]}
      />

      <Section title="Data Storage">
        <p className="text-fluid-base text-white/70 leading-relaxed">
          Trekker creates a <InlineCode>.trekker</InlineCode> folder in your
          project root. Add it to <InlineCode>.gitignore</InlineCode> if you do
          not want to track it.
        </p>
      </Section>

      <Section title="AI Agent Workflow">
        <ol className="space-y-3 mb-6">
          {[
            "Install the Claude Code plugin",
            "Tell the agent to use Trekker in your prompt",
            <>Point the agent to <InlineCode>trekker quickstart</InlineCode> for reference</>,
            "Open the dashboard to watch progress",
          ].map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-fluid-base text-white/70">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-[#001BB7] text-sm font-semibold flex items-center justify-center">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-fluid-base text-white/70 mb-4 leading-relaxed">
          Example prompt:
        </p>
        <CodeBlock wrap>{`Use trekker to track your work. Run \`trekker quickstart\` if you need to learn how it works.`}</CodeBlock>
      </Section>

      {/* Footer */}
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
      </main>
      </div>
    </>
  );
}
