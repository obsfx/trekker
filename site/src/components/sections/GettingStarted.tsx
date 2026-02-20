import { Section } from "../Section";
import { CodeBlock, InlineCode } from "../CodeBlock";

export function GettingStarted() {
  return (
    <>
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
    </>
  );
}
