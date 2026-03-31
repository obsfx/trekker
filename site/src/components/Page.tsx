import { Hero } from "./hero/Hero";
import { AgentsSection } from "./page/AgentsSection";
import { CommandsSection } from "./page/CommandsSection";
import { DashboardSection } from "./page/DashboardSection";
import { FeaturesSection } from "./page/FeaturesSection";
import { HowAgentsUseItSection } from "./page/HowAgentsUseItSection";
import { InstallSection } from "./page/InstallSection";

export function Page() {
  return (
    <main id="main-content" className="main-content">
      <div className="h-8 bg-gradient-to-t from-transparent to-indigo-600/10" />
      <article className="article">
        <Hero />
        <HowAgentsUseItSection />
        <InstallSection />
        <FeaturesSection />
        <AgentsSection />
        <CommandsSection />
        <DashboardSection />
      </article>
      <div className="h-32 bg-gradient-to-b from-transparent to-indigo-600/10" />
    </main>
  );
}
