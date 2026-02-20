import { Header, Hero } from "./Hero";
import { GettingStarted } from "./sections/GettingStarted";
import { FeaturesSection } from "./sections/FeaturesSection";
import { ClaudeCodePlugin } from "./sections/ClaudeCodePlugin";
import { CommandReference } from "./sections/CommandReference";
import { StatusAndPriority } from "./sections/StatusAndPriority";
import { AdditionalFeatures } from "./sections/AdditionalFeatures";
import { WorkflowAndFooter } from "./sections/WorkflowAndFooter";

export function Page() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header />

      <div className="px-4 md:px-6 max-w-4xl mx-auto pb-8">
        <Hero />

        <main id="main-content">
          <div className="border-t border-white/20 my-4" />
          <GettingStarted />
          <FeaturesSection />
          <ClaudeCodePlugin />
          <CommandReference />
          <StatusAndPriority />
          <AdditionalFeatures />
          <WorkflowAndFooter />
        </main>
      </div>
    </>
  );
}
