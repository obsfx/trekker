import { GitBranchPlus, Github, Package } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-4 z-50 mx-auto max-w-4xl px-4 md:px-6 mb-6 md:mb-8">
      <div className="flex justify-between items-center px-4 py-3 rounded-full bg-white/10 backdrop-blur-sm">
        <a href="/trekker/" className="flex items-center gap-2 font-bold text-fluid-sm text-white hover:opacity-70 transition-opacity">
          <GitBranchPlus size={20} />
          trekker
        </a>
        <nav className="flex items-center gap-4 md:gap-6">
          <a href="#features" className="hidden sm:block text-fluid-sm font-medium text-white/70 hover:text-white transition-colors">
            Features
          </a>
          <a href="#installation" className="hidden sm:block text-fluid-sm font-medium text-white/70 hover:text-white transition-colors">
            Install
          </a>
          <a href="#commands" className="hidden sm:block text-fluid-sm font-medium text-white/70 hover:text-white transition-colors">
            Commands
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="pt-4 pb-12 md:pt-8 md:pb-16">

      {/* Hero Content - Asymmetric Layout */}
      <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-start">
        <div className="md:col-span-3">
          <h1 className="font-sans text-fluid-4xl font-bold text-white leading-tight mb-6">
            Task tracking for
            <br />
            <span className="text-white/70">AI agents</span>
          </h1>
        </div>

        <div className="md:col-span-2 md:pt-4">
          <p className="text-fluid-base text-white/70 mb-8 leading-relaxed">
            A CLI-based task manager that keeps AI coding agents on track. Tasks, epics, and dependencies—all in a local SQLite database.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/obsfx/trekker"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-[#001BB7] font-semibold rounded-full hover:bg-white/90 transition-colors text-sm"
            >
              <Github size={16} />
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@obsfx/trekker"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors text-sm"
            >
              <Package size={16} />
              npm
            </a>
            <a
              href="https://github.com/obsfx/trekker-claude-code"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors text-sm"
            >
              <img src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/claude-color.png" alt="Claude" className="w-4 h-4" />
              Claude Code
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
