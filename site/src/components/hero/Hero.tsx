import { HeroBrand } from "./HeroBrand";
import { HeroInstallSnippet } from "./HeroInstallSnippet";
import { HeroLinks } from "./HeroLinks";
import { HeroPreview } from "./HeroPreview";

export function Hero() {
  return (
    <>
      <header id="overview" className="hero">
        <HeroBrand />
        <div className="flex flex-col gap-4">
          <h1 className="hero-title">
            <span className="sketchy-underline">Task tracking</span> for{" "}
            <span className="pen-underline">agents.</span>
          </h1>
          <p className="tagline">
            Trekker turns agent work into persistent project state that Claude
            Code, Codex, or any other tool can search, update, and resume. Keep
            tasks, dependencies, and notes next to the code instead of inside
            chat history.
          </p>
          <HeroInstallSnippet />
          <HeroLinks />
        </div>
      </header>

      <HeroPreview />
    </>
  );
}
