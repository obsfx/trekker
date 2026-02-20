import { Section, SubSection } from "../Section";
import { CodeBlock } from "../CodeBlock";

export function CommandReference() {
  return (
    <>
      <Section title="Quick Start">
        <p className="text-fluid-sm text-white/50 mb-2">Initialize your project</p>
        <CodeBlock>{`trekker init`}</CodeBlock>

        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Create an epic</p>
        <CodeBlock>{`trekker epic create -t "User Authentication" -d "JWT-based auth"`}</CodeBlock>

        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Add tasks to the epic</p>
        <div className="space-y-2">
          <CodeBlock>{`trekker task create -t "Create user model" -e EPIC-1`}</CodeBlock>
          <CodeBlock>{`trekker task create -t "Build login endpoint" -e EPIC-1`}</CodeBlock>
        </div>

        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Establish dependencies (TREK-2 depends on TREK-1)</p>
        <CodeBlock>{`trekker dep add TREK-2 TREK-1`}</CodeBlock>

        <p className="text-fluid-sm text-white/50 mb-2 mt-4">Update task status</p>
        <div className="space-y-2">
          <CodeBlock>{`trekker task update TREK-1 -s in_progress`}</CodeBlock>
          <CodeBlock>{`trekker task update TREK-1 -s completed`}</CodeBlock>
        </div>
      </Section>

      <Section title="Commands" id="commands">
        <SubSection title="Project Management">
          <div className="space-y-2">
            <CodeBlock>{`trekker init`}</CodeBlock>
            <CodeBlock>{`trekker wipe`}</CodeBlock>
            <CodeBlock>{`trekker quickstart`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Epics">
          <div className="space-y-2">
            <CodeBlock>{`trekker epic create -t "Epic title" [-d "description"] [-p 0-5]`}</CodeBlock>
            <CodeBlock>{`trekker epic list [--status todo|in_progress|completed|archived]`}</CodeBlock>
            <CodeBlock>{`trekker epic show EPIC-1`}</CodeBlock>
            <CodeBlock>{`trekker epic update EPIC-1 -s in_progress`}</CodeBlock>
            <CodeBlock>{`trekker epic complete EPIC-1`}</CodeBlock>
            <CodeBlock>{`trekker epic delete EPIC-1`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Tasks">
          <div className="space-y-2">
            <CodeBlock>{`trekker task create -t "Task title" [-d "desc"] [-p 0-5] [-e EPIC-1] [--tags "tag1,tag2"]`}</CodeBlock>
            <CodeBlock>{`trekker task list [--status todo|in_progress|completed|wont_fix|archived] [--epic EPIC-1]`}</CodeBlock>
            <CodeBlock>{`trekker task show TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker task update TREK-1 -s in_progress`}</CodeBlock>
            <CodeBlock>{`trekker task delete TREK-1`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Subtasks">
          <div className="space-y-2">
            <CodeBlock>{`trekker subtask create TREK-1 -t "Subtask title" [-d "desc"] [-p 0-5]`}</CodeBlock>
            <CodeBlock>{`trekker subtask list TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker subtask update TREK-1-1 -s completed`}</CodeBlock>
            <CodeBlock>{`trekker subtask delete TREK-1-1`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Comments">
          <div className="space-y-2">
            <CodeBlock>{`trekker comment add TREK-1 -a "agent" -c "Progress note"`}</CodeBlock>
            <CodeBlock>{`trekker comment list TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker comment update CMT-1 -c "Updated content"`}</CodeBlock>
            <CodeBlock>{`trekker comment delete CMT-1`}</CodeBlock>
          </div>
        </SubSection>

        <SubSection title="Dependencies">
          <div className="space-y-2">
            <CodeBlock>{`trekker dep add TREK-2 TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker dep remove TREK-2 TREK-1`}</CodeBlock>
            <CodeBlock>{`trekker dep list TREK-1`}</CodeBlock>
          </div>
        </SubSection>
      </Section>
    </>
  );
}
