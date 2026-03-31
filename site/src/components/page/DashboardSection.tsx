import { CommandBlockList } from "../shared/CommandBlockList";
import { ImagePreview } from "../shared/ImagePreview";
import { ContentSection } from "./ContentSection";

const DASHBOARD_INSTALL = [
  `npm install -g @obsfx/trekker-dashboard`,
  `trekker-dashboard -p 3000`,
];

export function DashboardSection() {
  return (
    <ContentSection id="dashboard" title="Dashboard">
      <p>
        When you want a visual board, the dashboard package reads the same
        local database and renders the current task flow.
      </p>
      <CommandBlockList commands={DASHBOARD_INSTALL} />

      <div className="section-preview">
        <ImagePreview
          src="/trekker/images/dashboard-task.png"
          alt="Trekker dashboard task detail"
          compact
        />
      </div>
    </ContentSection>
  );
}
