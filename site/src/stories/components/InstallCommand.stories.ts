import InstallCommand from "@/src/components/InstallCommand.astro";

export default {
  title: "Components/InstallCommand",
  component: InstallCommand,
};

export const Bun = { args: { command: "bun install -g @obsfx/trekker" } };
