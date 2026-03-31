import { Github, Package } from "lucide-react";

const HERO_LINKS = [
  {
    href: "https://github.com/obsfx/trekker",
    label: "GitHub repo",
    icon: <Github size={15} />,
  },
  {
    href: "https://www.npmjs.com/package/@obsfx/trekker",
    label: "npm",
    icon: <Package size={15} />,
  },
  {
    href: "https://github.com/obsfx/trekker-claude-code",
    label: "Claude Code plugin",
    icon: (
      <img
        src="/trekker/images/claude-color.png"
        alt=""
        aria-hidden="true"
        className="hero-link-image"
      />
    ),
  },
  {
    href: "https://github.com/obsfx/trekker-codex",
    label: "Codex plugin",
    icon: (
      <img
        src="/trekker/images/openai-black-monoblossom.svg"
        alt=""
        aria-hidden="true"
        className="hero-link-image hero-link-image-codex"
      />
    ),
  },
];

export function HeroLinks() {
  return (
    <div className="hero-links" aria-label="Project links">
      {HERO_LINKS.map((link) => (
        <a key={link.label} href={link.href} className="hero-link">
          {link.icon}
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  );
}
