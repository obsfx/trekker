---
name: smart-query
description: Translate natural-language tracking questions into Trekker queries for status, history, blockers, and related work.
---

# Smart Query

Use this skill when the user asks questions about the state of work rather than requesting an immediate code change.

## Query Translations

- "What is in progress?" -> `trekker task list --status in_progress`
- "What is ready next?" -> `trekker ready`
- "What changed recently?" -> `trekker history --limit 10`
- "What is blocking TREK-12?" -> `trekker dep list TREK-12`
- "Show me everything related to auth" -> `trekker search "auth"` then `trekker search "login"`

## Notes

- Use `trekker search` for thematic discovery.
- Use `task list`, `ready`, and `history` for structural questions.
- Use `comment list` and `task show` when the user needs the detailed context on one task.
