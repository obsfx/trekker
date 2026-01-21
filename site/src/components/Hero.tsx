import { GitBranchPlus, Github, Package } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Hero() {
  return (
    <section className="py-8 md:py-12 max-w-3xl">
      <div className="flex justify-between items-center mb-8 md:mb-12">
        <span className="font-bold text-xl flex gap-2 items-center">
          <GitBranchPlus />
          trekker
        </span>
        <ThemeToggle />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
        CLI Task Tracker for AI Agents
      </h1>

      <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
        Track tasks, epics, and dependencies from your terminal. Everything
        stays in a local SQLite database.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="https://github.com/obsfx/trekker"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent dark:bg-accent-dark text-white font-medium rounded-full hover:opacity-90 transition-opacity"
        >
          <Github size={16} />
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/@obsfx/trekker"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium rounded-full border border-neutral-200 dark:border-neutral-700 hover:opacity-90 transition-opacity"
        >
          <Package size={16} />
          npm
        </a>
      </div>
    </section>
  );
}
