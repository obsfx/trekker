import { Check, Copy } from "lucide-react";
import { useState } from "react";

const INSTALL_COMMAND = "bun install -g @obsfx/trekker";

export function HeroInstallSnippet() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      className="install-snippet"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      <code>{INSTALL_COMMAND}</code>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
