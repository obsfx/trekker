---
name: trekker
description: Use Trekker as the persistent source of truth for tracked work in Codex. Search first, restore context, work one task at a time, and close tasks with summary comments.
---

# Trekker

## Overview

Use this skill when work should be tracked across sessions. Trekker is a CLI: run every read and write as a `trekker` command in the shell. This plugin ships no MCP tools.

Trekker is the durable system of record. `update_plan` is only short-lived session scaffolding.

## Calling the CLI

- Add `--toon` before the subcommand for compact, structured output: `trekker --toon task show TREK-12`
- Check flags with `trekker <command> --help` or `trekker quickstart` instead of guessing them
- Quote titles, descriptions, and comments: `trekker comment add TREK-12 -a "codex" -c "Summary: ..."`
- If `trekker` is not on PATH, ask the user to install it with `npm install -g @obsfx/trekker` (requires Bun)

## Core Rules

1. Search before any task action. Trekker uses FTS5, so start with one distinctive keyword at a time.
2. Restore context before changing anything. Read the task, comments, history, and dependencies first.
3. Keep one active task when practical. Set it to `in_progress` before doing the work.
4. Leave a `Checkpoint:` comment when pausing and a `Summary:` comment before marking work complete.
5. Prefer extending existing tasks over creating duplicates.

## Search-First Workflow

Run search before you create, start, or resume work:

```bash
trekker search "auth"
trekker search "migration"
trekker search "release"
```

Multi-word queries narrow results with AND logic. If the first search is weak, try two or three adjacent keywords separately instead of writing a sentence.

## Context Recovery

For existing work, inspect state in this order:

```bash
trekker task show TREK-12
trekker comment list TREK-12
trekker history --entity TREK-12
trekker dep list TREK-12
```

If `.trekker` does not exist and the user wants persistent tracking, ask before running `trekker init` because it changes project state.

## Working a Task

```bash
trekker task update TREK-12 -s in_progress
trekker comment add TREK-12 -a "codex" -c "Checkpoint: verified the failing path in src/auth.ts. Next: patch token refresh handling."
trekker comment add TREK-12 -a "codex" -c "Summary: fixed refresh-token validation in src/auth.ts and src/session.ts. Removed the duplicate fallback branch."
trekker task update TREK-12 -s completed
trekker ready
```

Use comments for discoveries, blockers, and handoff context. If a task is blocked by something outside the current scope, document why and leave it in a non-terminal state or mark it `wont_fix` with explanation.

## Planning and New Work

For larger features, create an epic first and then wire smaller tasks together with dependencies. Use `update_plan` only as a temporary mirror of what you are doing right now; Trekker remains the durable record.

## Common Mistakes

- Creating a new task before searching.
- Marking work complete without a summary comment.
- Treating `update_plan` as the system of record.
- Assuming Claude-only slash commands or TodoWrite behavior exist in Codex.
