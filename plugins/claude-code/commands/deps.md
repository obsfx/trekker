---
name: trekker:deps
description: Manage task dependencies
---

Add, remove, or list dependencies between tasks.

**IMPORTANT**: `/trekker:deps` is a skill (invoke via Skill tool), NOT a bash command. Use `trekker dep` CLI commands as shown below.

## Subcommands

Ask the user what they want to do:
- **add**: Add a dependency (task A depends on task B)
- **remove**: Remove a dependency
- **list**: List dependencies for a task

## Add Dependency

"TREK-2 depends on TREK-1" means TREK-1 must be completed before TREK-2.

```bash
trekker dep add <task-id> <depends-on-task-id>
```

## Remove Dependency

```bash
trekker dep remove <task-id> <depends-on-task-id>
```

## List Dependencies

```bash
trekker dep list <task-id>
```
