# Trekker State Management

Technical documentation for state format, persistence, and conflict handling in the Trekker Claude Code plugin.

## State Definition

Trekker state consists of:

| Component | Location | Description |
|-----------|----------|-------------|
| Database | `.trekker/trekker.db` | SQLite database with all entities |
| Active Work | `tasks` table | Tasks with `status = 'in_progress'` |
| Context | `comments` table | Comments, especially checkpoints |
| History | `events` table | Audit log of all CRUD operations |

### What Counts as "State" for Context Recovery

1. **Active Issue**: Task ID currently `in_progress`
2. **Recent Comments**: Last 3-5 comments on active tasks (contain checkpoints)
3. **Current Workspace**: Determined by `.trekker/` directory location
4. **Recent History**: Last 5 events for awareness of recent changes

### State That Does NOT Need Restoration

- Completed tasks (archived in database)
- Backlog items (available via `task list --status todo`)
- Epic structure (static, queryable)

## Storage Architecture

```
project-root/
└── .trekker/
    ├── trekker.db        # Main SQLite database
    ├── trekker.db-wal    # Write-Ahead Log (during writes)
    └── trekker.db-shm    # Shared memory (during writes)
```

### SQLite Configuration

Trekker uses SQLite with these settings for multi-instance safety:

- **WAL mode**: Write-Ahead Logging for concurrent reads
- **Busy timeout**: 5000ms wait on lock contention
- **Journal mode**: WAL (not DELETE or TRUNCATE)

## Conflict Handling Strategy

### Read-Then-Write Pattern

Before any update, always read current state:

```bash
# Verify task exists and check current state
trekker task show TREK-1

# Only then update
trekker task update TREK-1 -s in_progress
```

### Comment-Based Coordination

Comments are append-only and conflict-free. Use them for:

1. **Claiming work**: "Starting work on this task"
2. **Progress updates**: "Completed X, working on Y"
3. **Handoff**: "Checkpoint: state saved, another agent can continue"

### Concurrent Access Scenarios

| Scenario | Handling |
|----------|----------|
| Two agents start same task | First write wins; second should check status first |
| Simultaneous comments | Both succeed (append-only) |
| Status update collision | Refresh state and retry |
| Database locked | Retry with exponential backoff (5s max) |

### Multi-Instance Best Practices

1. **Prefer additive operations**: Comments over status changes
2. **Short transactions**: Read-modify-write quickly
3. **Idempotent updates**: Same update twice = same result
4. **No deletion without confirmation**: Use `archived` status instead

## Context Recovery Flow

### Post-Compaction Recovery

After context compaction, the `session-start.sh` hook provides:

1. State summary (counts by status)
2. In-progress tasks with descriptions
3. Recent comments (including checkpoints)
4. Recent history events
5. Next steps guidance

### Checkpoint Comment Format

Standard checkpoint format for context recovery:

```
Checkpoint: [what's done]. Next: [what's next]. Files: [modified files]. State: [current state]
```

Example:
```
Checkpoint: Implemented user validation (steps 1-3). Next: Add error handling. Files: user.ts, validation.ts. State: Tests passing, ready for error handling.
```

### Recovery Without Checkpoint

If no checkpoint exists:

1. Read task description for goals
2. Check recent comments for any progress notes
3. Review history events for recent changes
4. Ask user for context if state is unclear

## Merge Strategy

### For Task Updates

```
Current in DB: { status: "in_progress", title: "Original" }
Agent A wants: { status: "completed" }
Agent B wants: { title: "Updated" }

Result: Last write wins (no automatic merge)
Strategy: Use comments for coordination, not concurrent updates
```

### For Comments (Append-Only)

```
Comments are never merged - they are simply appended.
Multiple agents can add comments simultaneously without conflict.
```

## Error States

| Error | Cause | Recovery |
|-------|-------|----------|
| "database is locked" | Concurrent write | Retry after 1-5 seconds |
| "no such task: TREK-n" | Invalid ID or deleted | Re-query task list |
| "Project not found" | Not initialized | Run `trekker init` |
| Stale checkpoint | Long time since update | Ask user for current state |

## Notes for Plugin Developers

### Adding New State Components

If extending what counts as "state":

1. Add to session-start.sh hook output
2. Add to pre-compact.sh hook output
3. Document recovery procedure
4. Test concurrent access behavior

### Testing Multi-Instance

```bash
# Terminal 1
trekker task update TREK-1 -s in_progress

# Terminal 2 (simultaneously)
trekker task update TREK-1 -s in_progress
# Should either succeed or report current state
```

### Debugging State Issues

```bash
# Check database integrity
sqlite3 .trekker/trekker.db "PRAGMA integrity_check;"

# View WAL status
sqlite3 .trekker/trekker.db "PRAGMA wal_checkpoint;"

# List recent events
trekker history --limit 20
```
