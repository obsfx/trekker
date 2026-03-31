import { CommandBlockList } from "../shared/CommandBlockList";
import { ContentSection } from "./ContentSection";

const COMMAND_FLOW = [
  `trekker epic create -t "Agent UX polish"`,
  `trekker task create -t "Tighten page typography" -e EPIC-1`,
  `trekker task update TREK-1 -s in_progress`,
  `trekker comment add TREK-1 -a "agent" -c "Adjusted hero layout to match the reference"`,
  `trekker task update TREK-1 -s completed`,
];

const SEARCH_AND_HISTORY = [
  `trekker search "typography"`,
  `trekker history --entity TREK-1`,
  `trekker --toon task show TREK-1`,
];

export function CommandsSection() {
  return (
    <ContentSection id="commands" title="Commands">
      <p>Typical task flow inside a repository:</p>
      <CommandBlockList commands={COMMAND_FLOW} />

      <p>
        Search and history stay available when the next session needs to
        reconstruct context:
      </p>
      <CommandBlockList commands={SEARCH_AND_HISTORY} />
    </ContentSection>
  );
}
