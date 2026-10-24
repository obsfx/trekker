# Trekker Skill Maintenance Guide

This document provides guidance for maintaining the trekker skill.

## File Roles

| File | Purpose |
|------|---------|
| SKILL.md | Entry point for Claude - workflow and commands |
| README.md | Human-readable documentation |
| CLAUDE.md | This maintenance guide |

## Key Principle: DRY via trekker quickstart

Avoid duplicating CLI reference in SKILL.md. Instead:
- Use `trekker --toon quickstart` for full command reference
- SKILL.md focuses on workflow patterns, not exhaustive command docs

## Updating the Skill

When trekker releases new versions:

1. Check for new commands or changed flags
2. Update SKILL.md if workflow patterns change
3. Keep README.md in sync with high-level concepts
4. Test that `trekker quickstart` still works

## What Belongs Where

| Content | Location |
|---------|----------|
| Workflow patterns | SKILL.md |
| Decision frameworks | SKILL.md |
| CLI syntax details | `trekker quickstart` |
| Conceptual overview | README.md |
| Installation | README.md |

## Testing Changes

1. Verify SKILL.md is 400-600 words (focused)
2. Check all commands work: `trekker --help`
3. Confirm quickstart is current: `trekker quickstart`
