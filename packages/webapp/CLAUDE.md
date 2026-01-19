# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the webapp component of Trekker - a kanban board interface that connects to the same SQLite database as the CLI. It provides board and list views with full CRUD operations and real-time updates via Server-Sent Events.

## Commands

```bash
bun run dev       # Start Next.js dev server (port 3000, uses bun runtime)
bun run build     # Production build (outputs standalone)
bun run start     # Run production server
```

## Database Connection

The webapp requires `TREKKER_DB_PATH` environment variable pointing to the CLI's database file (typically `.trekker/trekker.db`). The CLI's `trekker serve` command sets this automatically.

Uses `bun:sqlite` with Drizzle ORM (same as CLI).

## Architecture

### Directory Structure
```
src/
├── app/
│   ├── page.tsx              # Kanban board view (main)
│   ├── tasks/page.tsx        # List view
│   ├── layout.tsx            # Root layout with providers
│   └── api/
│       ├── project/route.ts  # GET project info
│       ├── epics/
│       │   ├── route.ts      # GET/POST epics
│       │   └── [id]/route.ts # GET/PUT/DELETE epic
│       ├── tasks/
│       │   ├── route.ts      # GET/POST tasks
│       │   └── [id]/route.ts # GET/PUT/DELETE task
│       ├── dependencies/route.ts # POST/DELETE dependencies
│       └── events/route.ts   # SSE endpoint for live updates
├── lib/
│   ├── db.ts                 # Drizzle client (imports schema from @trekker/shared)
│   ├── id-generator.ts       # TREK-n, EPIC-n ID generation
│   ├── constants.ts          # Re-exports from @trekker/shared
│   └── utils.ts              # cn() utility for Tailwind
├── hooks/
│   └── use-task-events.ts    # SSE hook with toast notifications
└── components/
    ├── ui/                   # shadcn/ui components (dialog, input, select, etc.)
    ├── task-detail-modal.tsx # View/edit task modal
    ├── epic-detail-modal.tsx # View/edit epic modal
    ├── create-modal.tsx      # Create epic/task/subtask modal
    ├── status-badge.tsx      # Colored status pill
    └── priority-badge.tsx    # P0-P5 priority indicator
```

### Key Patterns

**Shared Code**: Schema, types, and constants are imported from `@trekker/shared`. No more duplication between CLI and webapp.

**Full CRUD**: The webapp supports creating, reading, updating, and deleting epics, tasks, and subtasks. API routes mirror CLI service logic.

**ID Generation**: Uses the same `id_counters` table as CLI for generating TREK-n and EPIC-n IDs. Now synchronous since we use bun:sqlite.

**SSE Live Updates**: The `/api/events` endpoint polls the database every 2 seconds for task status changes and streams them to connected clients.

**Modal-based Editing**: Clicking cards/rows opens detail modals. "New" buttons and column "+" buttons open the create modal.

**Visual Indicators**:
- Left border colors: purple (epic), blue (task), gray (subtask)
- Status badges: gray (todo), blue (in_progress), green (completed), amber (wont_fix)

### Path Aliases

- `@/*` maps to `./src/*`
