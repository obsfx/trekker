import { Hero } from "./Hero";
import { Section, SubSection } from "./Section";
import { CodeBlock, InlineCode } from "./CodeBlock";
import { Screenshots } from "./Screenshots";

export function Page() {
  return (
    <div className="px-4 md:px-6">
      <Hero />

      <Section title="Why Trekker" className="max-w-3xl">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          AI coding agents work better when they can track their own progress. A
          simple CLI-based task manager keeps them on the right path across
          sessions.
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          I built this after using{" "}
          <a
            href="https://github.com/steveyegge/beads"
            className="text-accent dark:text-accent-dark underline underline-offset-2 hover:decoration-dotted"
          >
            Beads
          </a>{" "}
          for a while. Beads does the job, but its codebase has grown quickly
          without enough care for what is happening inside. A task tracker is a
          simple application. It should not need thousands of lines of code.
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          My concerns about the future and security of that project led me here.
          Trekker is my simplified alternative.
        </p>
        <p className="text-neutral-600 dark:text-neutral-400">
          I built this with AI assistance, but I did it for myself. That means I
          put enough care into it to make it reliable for my own work.
        </p>
      </Section>

      <Section title="Prerequisites" className="max-w-3xl">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          You need the Bun runtime. Trekker uses{" "}
          <InlineCode>bun:sqlite</InlineCode> for database operations. This
          makes every command respond instantly.
        </p>
        <CodeBlock>{`# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# Via npm
npm install -g bun`}</CodeBlock>
      </Section>

      <Section title="Installation" className="max-w-3xl">
        <CodeBlock>{`# Using bun (recommended)
bun install -g @obsfx/trekker

# Using npm
npm install -g @obsfx/trekker`}</CodeBlock>
      </Section>

      <Section title="Features" className="max-w-3xl">
        <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400 space-y-2">
          <li>Tasks, epics, subtasks, and dependencies</li>
          <li>Full-text search across all items</li>
          <li>Filter by type, status, or priority</li>
          <li>Kanban board via separate dashboard package</li>
          <li>
            Stores everything in a local <InlineCode>.trekker</InlineCode>{" "}
            folder
          </li>
          <li>TOON output format for AI token efficiency</li>
        </ul>
      </Section>

      <Section title="Quick Start" className="max-w-3xl">
        <CodeBlock>{`# Initialize your project
trekker init

# Create an epic
trekker epic create -t "User Authentication" -d "JWT-based auth"

# Add tasks to the epic
trekker task create -t "Create user model" -e EPIC-1
trekker task create -t "Build login endpoint" -e EPIC-1

# Establish dependencies (TREK-2 depends on TREK-1)
trekker dep add TREK-2 TREK-1

# Update task status
trekker task update TREK-1 -s in_progress
trekker task update TREK-1 -s completed`}</CodeBlock>
      </Section>

      <Section title="Commands" className="max-w-3xl">
        <SubSection title="Project Management">
          <CodeBlock>{`trekker init          # Initialize in current directory
trekker wipe          # Delete all data
trekker quickstart    # Display full documentation`}</CodeBlock>
        </SubSection>

        <SubSection title="Epics">
          <CodeBlock>{`trekker epic create -t "Epic title" [-d "description"] [-p 0-5]
trekker epic list [--status todo|in_progress|completed|archived]
trekker epic show EPIC-1
trekker epic update EPIC-1 -s in_progress
trekker epic complete EPIC-1
trekker epic delete EPIC-1`}</CodeBlock>
        </SubSection>

        <SubSection title="Tasks">
          <CodeBlock>{`trekker task create -t "Task title" [-d "desc"] [-p 0-5] [-e EPIC-1] [--tags "tag1,tag2"]
trekker task list [--status todo|in_progress|completed|wont_fix|archived] [--epic EPIC-1]
trekker task show TREK-1
trekker task update TREK-1 -s in_progress
trekker task delete TREK-1`}</CodeBlock>
        </SubSection>

        <SubSection title="Subtasks">
          <CodeBlock>{`trekker subtask create TREK-1 -t "Subtask title" [-d "desc"] [-p 0-5]
trekker subtask list TREK-1
trekker subtask update TREK-1-1 -s completed
trekker subtask delete TREK-1-1`}</CodeBlock>
        </SubSection>

        <SubSection title="Comments">
          <CodeBlock>{`trekker comment add TREK-1 -a "agent" -c "Progress note"
trekker comment list TREK-1
trekker comment update CMT-1 -c "Updated content"
trekker comment delete CMT-1`}</CodeBlock>
        </SubSection>

        <SubSection title="Dependencies">
          <CodeBlock>{`trekker dep add TREK-2 TREK-1      # TREK-2 depends on TREK-1
trekker dep remove TREK-2 TREK-1
trekker dep list TREK-1`}</CodeBlock>
        </SubSection>
      </Section>

      <Section title="Search" className="max-w-3xl">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Search across all tasks, epics, subtasks, and comments using FTS5.
        </p>
        <CodeBlock>{`trekker search "authentication"
trekker search "bug fix" --type task,subtask
trekker search "login" --type comment --status completed
trekker search "query" [--type types] [--status status] [--limit n] [--page n]`}</CodeBlock>
      </Section>

      <Section title="History" className="max-w-3xl">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          View an audit log of all changes.
        </p>
        <CodeBlock>{`trekker history
trekker history --entity TREK-1
trekker history --type task,epic --action create,update
trekker history --since 2024-01-01 --until 2024-12-31`}</CodeBlock>
      </Section>

      <Section title="Unified List View" className="max-w-3xl">
        <CodeBlock>{`trekker list
trekker list --type task,epic
trekker list --status todo,in_progress
trekker list --priority 0,1,2
trekker list --sort priority,created_at`}</CodeBlock>
      </Section>

      <Section title="Status & Priority" className="max-w-3xl">
        <SubSection title="Priority Scale">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left py-2 pr-4 font-semibold">
                    Priority
                  </th>
                  <th className="text-left py-2 font-semibold">Label</th>
                </tr>
              </thead>
              <tbody className="text-neutral-600 dark:text-neutral-400">
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 pr-4">0</td>
                  <td>Critical</td>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 pr-4">1</td>
                  <td>High</td>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 pr-4">2</td>
                  <td>Medium (default)</td>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 pr-4">3</td>
                  <td>Low</td>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 pr-4">4</td>
                  <td>Backlog</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">5</td>
                  <td>Someday</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="Status Values">
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">
            <strong className="text-neutral-900 dark:text-white">Tasks:</strong>{" "}
            <InlineCode>todo</InlineCode>, <InlineCode>in_progress</InlineCode>,{" "}
            <InlineCode>completed</InlineCode>,{" "}
            <InlineCode>wont_fix</InlineCode>, <InlineCode>archived</InlineCode>
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            <strong className="text-neutral-900 dark:text-white">Epics:</strong>{" "}
            <InlineCode>todo</InlineCode>, <InlineCode>in_progress</InlineCode>,{" "}
            <InlineCode>completed</InlineCode>,{" "}
            <InlineCode>archived</InlineCode>
          </p>
        </SubSection>

        <SubSection title="ID Formats">
          <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>
              Epics: <InlineCode>EPIC-1</InlineCode>,{" "}
              <InlineCode>EPIC-2</InlineCode>, ...
            </li>
            <li>
              Tasks: <InlineCode>TREK-1</InlineCode>,{" "}
              <InlineCode>TREK-2</InlineCode>, ...
            </li>
            <li>
              Comments: <InlineCode>CMT-1</InlineCode>,{" "}
              <InlineCode>CMT-2</InlineCode>, ...
            </li>
          </ul>
        </SubSection>
      </Section>

      <Section title="TOON Output Format" className="max-w-3xl">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Use the <InlineCode>--toon</InlineCode> flag to get structured output
          that uses fewer tokens.
        </p>
        <CodeBlock>{`trekker --toon task list
trekker --toon task show TREK-1`}</CodeBlock>
      </Section>

      <Section title="Dashboard" className="max-w-3xl">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          A kanban board that reads from your <InlineCode>.trekker</InlineCode>{" "}
          database.
        </p>
        <CodeBlock>{`npm install -g @obsfx/trekker-dashboard
trekker-dashboard -p 3000`}</CodeBlock>
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

      <Section title="Claude Code Integration" className="mt-12 max-w-3xl">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Install the plugin to give Claude Code direct access to Trekker. No
          CLI commands needed.
        </p>
        <CodeBlock>{`claude /plugin marketplace add obsfx/trekker-claude-code
claude /plugin install trekker`}</CodeBlock>
        <p className="text-neutral-600 dark:text-neutral-400 mt-4">
          The plugin includes 24 MCP tools, 13 slash commands, and a task agent.
        </p>
      </Section>

      <Section title="Data Storage" className="max-w-3xl">
        <p className="text-neutral-600 dark:text-neutral-400">
          Trekker creates a <InlineCode>.trekker</InlineCode> folder in your
          project root. Add it to <InlineCode>.gitignore</InlineCode> if you do
          not want to track it.
        </p>
      </Section>

      <Section title="AI Agent Workflow" className="max-w-3xl">
        <ol className="list-decimal list-inside text-neutral-600 dark:text-neutral-400 space-y-2 mb-4">
          <li>Install the Claude Code plugin</li>
          <li>Tell the agent to use Trekker in your prompt</li>
          <li>
            Point the agent to <InlineCode>trekker quickstart</InlineCode> for
            reference
          </li>
          <li>Open the dashboard to watch progress</li>
        </ol>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Example prompt:
        </p>
        <CodeBlock>{`Use trekker to track your work. Run \`trekker quickstart\` if you need to learn how it works.`}</CodeBlock>
      </Section>
    </div>
  );
}
