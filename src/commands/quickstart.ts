import { Command } from "commander";

const QUICKSTART_TEXT = `# Trekker Quickstart

Issue tracker for AI agents. Data stored in \`.trekker/trekker.db\`.

## Setup
trekker init                    # Initialize
trekker wipe -y                 # Remove all data

## Core Rules
1. Set status to \`in_progress\` when starting, \`completed\` when done
2. Add summary comment before marking task complete
3. Use \`--toon\` flag for token-efficient output

## Commands

### Epics (features/milestones)
trekker epic create -t "Title" [-d "desc"] [-p 0-5] [-e EPIC-1]
trekker epic list [--status <status>]
trekker epic show EPIC-1
trekker epic update EPIC-1 [-t "Title"] [-d "desc"] [-p 0-5] [-s <status>]
trekker epic delete EPIC-1

### Tasks
trekker task create -t "Title" [-d "desc"] [-p 0-5] [-e EPIC-1] [--tags "a,b"]
trekker task list [--status <status>] [--epic EPIC-1]
trekker task show TREK-1
trekker task update TREK-1 [-t "Title"] [-d "desc"] [-p 0-5] [-s <status>] [--tags "a,b"] [-e EPIC-1] [--no-epic]
trekker task delete TREK-1

### Subtasks
trekker subtask create TREK-1 -t "Title" [-d "desc"] [-p 0-5]
trekker subtask list TREK-1
trekker subtask update TREK-2 [-t "Title"] [-d "desc"] [-p 0-5] [-s <status>]
trekker subtask delete TREK-2

### Comments (external memory)
trekker comment add TREK-1 -a "agent" -c "content"
trekker comment list TREK-1
trekker comment update CMT-1 -c "new content"
trekker comment delete CMT-1

### Dependencies
trekker dep add TREK-2 TREK-1   # TREK-2 depends on TREK-1
trekker dep remove TREK-2 TREK-1
trekker dep list TREK-1

## Status Values
Tasks: todo, in_progress, completed, wont_fix, archived
Epics: todo, in_progress, completed, archived

## Priority Scale
0=critical, 1=high, 2=medium (default), 3=low, 4=backlog, 5=someday

## Workflow

### Session Start
trekker --toon task list --status in_progress
trekker --toon comment list TREK-1

### Working
trekker task update TREK-1 -s in_progress
trekker comment add TREK-1 -a "agent" -c "Analysis: ..."
# ... do work ...
trekker comment add TREK-1 -a "agent" -c "Summary: implemented X in files A, B"
trekker task update TREK-1 -s completed

### Before Context Reset
trekker comment add TREK-1 -a "agent" -c "Checkpoint: done A,B. Next: C. Files: x.ts, y.ts"
`;

export const quickstartCommand = new Command("quickstart")
  .description("Show quick reference for AI agents")
  .action(() => {
    console.log(QUICKSTART_TEXT);
  });
