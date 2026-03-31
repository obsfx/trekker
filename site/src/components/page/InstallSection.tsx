import { InlineCode } from "../InlineCode";
import { CommandBlockList } from "../shared/CommandBlockList";
import { ContentSection } from "./ContentSection";

const MACOS_INSTALL = [`curl -fsSL https://bun.sh/install | bash`];
const WINDOWS_INSTALL = [`powershell -c "irm bun.sh/install.ps1 | iex"`];
const NPM_BUN_INSTALL = [`npm install -g bun`];
const TREKKER_BUN_INSTALL = [`bun install -g @obsfx/trekker`];
const TREKKER_NPM_INSTALL = [`npm install -g @obsfx/trekker`];
const TREKKER_INIT = [`trekker init`];

export function InstallSection() {
  return (
    <ContentSection id="install" title="Install">
      <h3>Prerequisites</h3>
      <p>
        You need the Bun runtime. Trekker uses <InlineCode>bun:sqlite</InlineCode>{" "}
        for database operations. This makes every command respond instantly.
      </p>

      <h3>macOS/Linux</h3>
      <CommandBlockList commands={MACOS_INSTALL} />

      <h3>Windows</h3>
      <CommandBlockList commands={WINDOWS_INSTALL} />

      <h3>Via npm</h3>
      <CommandBlockList commands={NPM_BUN_INSTALL} />

      <h3>Installation</h3>
      <p>Using bun (recommended)</p>
      <CommandBlockList commands={TREKKER_BUN_INSTALL} />

      <p>Using npm</p>
      <CommandBlockList commands={TREKKER_NPM_INSTALL} />

      <h3>Initialize the repo</h3>
      <CommandBlockList commands={TREKKER_INIT} />
    </ContentSection>
  );
}
