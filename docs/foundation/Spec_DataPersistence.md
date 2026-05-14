# Story Engine — Data Persistence Specification

**Systems Design & Data Architecture**

Version 0.2 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial draft. Project-as-folder format, atomic writes, save queue, image cleanup, local server API. |
| **0.2** | **May 2026** | **Revised for PRD v0.3 pipeline model. Added DiscoveryNote and PhaseState to project.json schema. Updated entity list and schema version. Builder references replaced with Dimension/Phase. Discovery-specific persistence notes added. Core persistence architecture (atomic writes, save queue, port selection) unchanged.** |

---

## 1. Overview

The data persistence layer defines how Story Engine projects are saved to and loaded from the user's local machine.

**Design principle: A project is a folder you can copy.** Every project is a self-contained folder with a single `project.json` file and an `images/` subfolder. To back up a project, copy the folder. To share it, zip the folder. To delete it, delete the folder. No database, no registry, no hidden state.

**Consumer:** Every system that reads or writes entities depends on this layer. The Chat Engine triggers saves when concepts are created. The workspace triggers saves on card drag-end. The persistence layer serializes the in-memory state to disk and deserializes it back on project open.

**Scope boundary — this system does NOT:**
- Define entity shapes or relationships (see `Spec_DataModel.md`)
- Define UI for save indicators, error messages, or file dialogs (see Design Specs)
- Handle cloud sync or multi-device persistence (out of scope for v1, per PRD §11)
- Manage the MCP Server's data access (see `Spec_MCPServer.md`)

---

## 2. Project Storage Format

### Folder structure

```
~/StoryEngine/
├── projects/
│   ├── proj_V1StGjHk7/                  ← one folder per project
│   │   ├── project.json                 ← all entity data
│   │   ├── project.json.bak             ← previous good save (rollback target)
│   │   └── images/                      ← image files
│   │       ├── img_W2pQ9mX1.png
│   │       └── img_kL7nR3wV.jpg
│   ├── proj_x7YmN2pQ/
│   │   ├── project.json
│   │   └── images/
│   └── ...
└── preferences.json                      ← app-level preferences (see §10)
```

### Why this format

| Alternative | Why rejected |
|-------------|-------------|
| SQLite | Requires a query layer, harder to inspect/debug, not "a folder you can copy" |
| IndexedDB | Browser-only, no file system access, can't be copied/shared |
| Per-entity JSON files | Too many files, atomic multi-entity updates are hard, file system overhead |
| Single flat file (no images folder) | Images are binary — embedding them as base64 in JSON bloats the file and kills diff readability |

---

## 3. project.json Schema

The `project.json` file contains the complete entity graph for one project. Pretty-printed JSON, 2-space indent.

```typescript
interface ProjectFile {
  schemaVersion: number;         // currently 2 (bumped from 1 for v0.3 pipeline model)
  project: Project;              // the root entity
  phaseState: PhaseState;        // pipeline phase tracking
  discoveryNotes: DiscoveryNote[]; // raw ideation fragments
  conceptTypes: ConceptType[];   // defaults + custom
  concepts: Concept[];           // all concepts with their versions embedded
  chatMessages: ChatMessage[];   // full conversation history across all phases
  images: Image[];               // image metadata (files live in images/ folder)
  insights: Insight[];           // AI-generated observations
}
```

### Schema version migration

- **Version 1** (v0.2 PRD): Original schema with `Builder` enum, no DiscoveryNote, no PhaseState.
- **Version 2** (v0.3 PRD): Current schema. Adds `phaseState`, `discoveryNotes`. Replaces `builder` fields with `dimension` on ConceptType and Concept. Replaces `builder` with `phase` on ChatMessage. Removes `initialBuilder` from Project, adds `currentPhase`.

On project open, if `schemaVersion < 2`, the system migrates in memory:
1. Add `phaseState` with default values and `discovery.status: CONSOLIDATED` (since no Discovery phase existed)
2. Add empty `discoveryNotes: []`
3. Map `builder` → `dimension` on all ConceptTypes and Concepts (`STORYLINE` → `STORYLINE` unchanged)
4. Map `builder` → `phase` on all ChatMessages (all become `DEVELOPMENT` since the old model had no phase concept)
5. Replace `initialBuilder` with `currentPhase: DEVELOPMENT` on Project
6. Set `schemaVersion: 2`
7. Save immediately to persist the migration

---

## 4. Atomic Writes

**Rule: `project.json` is never overwritten directly.** Every save follows this sequence:

1. Write the new data to `project.json.tmp` in the project folder
2. If `project.json` exists, rename it to `project.json.bak`
3. Rename `project.json.tmp` to `project.json`
4. Delete `project.json.tmp` if it still exists (cleanup from step 3)

**Recovery on corruption:**
- If `project.json` is missing or corrupt on open, check for `project.json.bak` and restore from it
- If both are missing/corrupt, the project is unrecoverable (show error in UI, don't silently create a new project)
- If `project.json.tmp` exists on open, a previous save was interrupted — delete the tmp file and proceed with `project.json` (or `.bak`)

---

## 5. Save Queue

All save operations go through a per-project FIFO queue. This prevents concurrent writes from corrupting the file.

### Save priority

| Trigger | Priority | Behavior |
|---------|----------|----------|
| Chat message sent (user) | `flush` | Bypasses debounce, saves immediately |
| AI response received | `flush` | Bypasses debounce, saves immediately |
| Concept created by AI | `flush` | Bypasses debounce, saves immediately |
| App close / tab close | `flush` | Bypasses debounce, saves immediately |
| Phase transition | `flush` | Bypasses debounce, saves immediately |
| Card drag-end | `debounce` | 500ms debounce window — coalesces with other pending saves |
| In-place concept edit | `debounce` | 500ms debounce |
| Discovery note created | `debounce` | 500ms debounce |
| Discovery note moved | `debounce` | 500ms debounce |
| Insight status change | `debounce` | 500ms debounce |

### Debounce logic

- A `debounce` save starts a 500ms timer. If another `debounce` save arrives within that window, the timer resets. When the timer fires, one save executes with the current in-memory state.
- A `flush` save cancels any pending debounce timer and executes immediately. The flush always saves the latest in-memory state.
- Only one write can be in progress at a time. If a save is in progress and a new one arrives (flush or debounce), the new one queues and executes after the current write completes.

---

## 6. Project Lifecycle Operations

### Create project

1. Generate `proj_[nanoid]` for the project ID
2. Create the project folder: `~/StoryEngine/projects/proj_[id]/`
3. Create the `images/` subfolder
4. Generate 41 default ConceptTypes (per `Spec_DataModel.md` §14)
5. Generate PhaseState with default values
6. Write `project.json` (atomic write per §4)
7. Return the Project entity to the caller

### Open project

1. Read `project.json` from the project folder
2. Parse JSON — if corrupt, attempt recovery from `.bak` (per §4)
3. Check `schemaVersion` — if < 2, run migration (per §3)
4. Run `vacuumImages` (per §8) to clean up orphaned image files
5. Load all entities into memory
6. Return the ProjectFile to the caller

### List projects

1. Read the `~/StoryEngine/projects/` directory
2. For each subfolder, read `project.json` and extract: `id`, `name`, `description`, `currentPhase`, `updatedAt`
3. Return the list sorted by `updatedAt` descending (most recent first)
4. If a project folder is corrupt (missing or unreadable `project.json`), skip it (don't crash the list)

### Delete project

1. Delete the entire project folder (including `project.json`, `.bak`, `.tmp`, and `images/`)
2. Remove the project's entry from `preferences.json` if present
3. This is irreversible — no trash, no undo in v1

### Close project

1. Trigger a `flush` save (cancel any pending debounce, write immediately)
2. Update `preferences.json` with the project's last active dimension (per §10)
3. Release the in-memory ProjectFile

---

## 7. Image File Management

### Saving images

- AI-generated images: the DALL-E response is saved to `images/img_[nanoid].[ext]` in the project folder. The Image entity's `filePath` stores the relative path (e.g., `images/img_W2pQ9mX1.png`).
- User-uploaded images: copied to the `images/` folder with a new `img_[nanoid]` filename. The original filename is not preserved.

### Deleting images

- When a Concept or DiscoveryNote is deleted, its Image files are deleted immediately from disk.
- The Image entity is removed from `project.json` on the next save.

### vacuumImages (orphan cleanup)

On project open, scan the `images/` folder and compare to the `images` array in `project.json`. Any file not referenced by an Image entity is deleted. This handles orphans from interrupted saves or failed deletions.

---

## 8. Local Server

The persistence layer runs as a lightweight HTTP server on the user's machine.

### Server config

| Property | Value |
|----------|-------|
| Host | `127.0.0.1` (loopback only — not accessible from other machines) |
| Port | `3737` (fallback: try 3738–3747 if 3737 is in use) |
| Auth | None (single-user, localhost-only) |
| CORS | Allow origin `http://localhost:*` (Expo dev server) |

### API surface

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/projects` | Create a new project |
| `GET` | `/projects` | List all projects (summary only) |
| `GET` | `/projects/:id` | Open/load a project (full ProjectFile) |
| `PUT` | `/projects/:id` | Save a project (full ProjectFile) |
| `DELETE` | `/projects/:id` | Delete a project and its folder |
| `POST` | `/projects/:id/images` | Upload an image file |
| `GET` | `/projects/:id/images/:imageId` | Serve an image file |
| `DELETE` | `/projects/:id/images/:imageId` | Delete an image file |

### Request/response format

- All requests and responses use `application/json` except image upload (`multipart/form-data`) and image serve (the image's `mimeType`).
- Error responses use a consistent shape: `{ "error": "message", "code": "ERROR_CODE" }`.
- The `PUT /projects/:id` endpoint accepts the full `ProjectFile` — the server writes it atomically per §4. The client always sends the complete state, never partial updates.

---

## 9. Error Handling

| Scenario | Behavior |
|----------|----------|
| `project.json` missing on open | Check for `.bak`, restore if found. If both missing, return error. |
| `project.json` corrupt (invalid JSON) | Check for `.bak`, restore if found. If both corrupt, return error. |
| Disk full during write | Atomic write fails at step 1 (writing `.tmp`). Original `.json` is untouched. Return error to client. |
| Image file missing on serve | Return 404. The Image entity may reference a file that was externally deleted. |
| Project folder externally deleted while open | Next save recreates the folder and writes fresh. In-memory state is preserved. |
| Port 3737 in use | Try 3738, 3739, ... up to 3747. If all taken, fail with clear error message. |

---

## 10. Preferences File

A lightweight app-level file for cross-project convenience data.

```typescript
interface AppPreferences {
  lastPhase: Record<string, Phase>;           // key: projectId, value: last active phase
  lastDimension: Record<string, Dimension>;   // key: projectId, value: last active dimension in workspace
}
```

**Location:** `~/StoryEngine/preferences.json`

**Rules:**
- Not critical — if missing or corrupt, all lookups fall back to defaults (DISCOVERY for phase, creative gravity or CHARACTER for dimension)
- No atomic write, no `.bak` file — this is a convenience optimization, not essential data
- Updated on project close and on phase/dimension transitions
- Pretty-printed JSON, 2-space indent

---

## 11. Edge Cases & Rules

### First launch

On first launch, `~/StoryEngine/` doesn't exist. The server creates:
- `~/StoryEngine/`
- `~/StoryEngine/projects/`
- `~/StoryEngine/preferences.json` (empty: `{ "lastPhase": {}, "lastDimension": {} }`)

### Empty projects folder

Valid state. The project list returns an empty array. The Start Screen shows the empty state.

### Very large projects

- `project.json` is read/written in full on every save. For v1, this is acceptable — a project with 200 concepts, 500 chat messages, and 100 discovery notes produces a JSON file under 2MB.
- If projects grow beyond expected bounds, the save queue ensures writes are serialized, preventing memory spikes from concurrent full-file writes.
- Image files are not embedded in JSON — they stay on disk, referenced by path. This keeps `project.json` manageable regardless of image count.

### Multiple browser tabs

Not supported in v1. If the user opens the same project in two tabs, each tab loads its own copy. Saves from one tab overwrite the other. Known limitation.

---

## 12. Relationship to Other Systems

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| `Spec_DataModel.md` | Defines all entity shapes serialized in `project.json` | §3 (schema) |
| `Spec_Navigation.md` | Calls `createProject`, `openProject`, `listProjects`, `closeProject` during transitions; calls `flush` on close | §6 |
| `Spec_DiscoveryEngine.md` | Creates DiscoveryNotes and updates PhaseState during Discovery; triggers debounce saves | §5 |
| `Spec_ChatEngine.md` | Creates Concepts and ChatMessages; triggers flush saves | §5 |
| `Spec_Workspace_Design.md` | Triggers debounce saves on card drag-end and in-place edits | §5 |
| `Spec_ImageGeneration.md` | Saves image files to `images/` folder; creates Image entities | §7 |
| `Spec_MCPServer.md` | Reads `project.json` (read-only access to project data) | §3 |

**No direct interaction:**
- `Spec_InsightsEngine.md` — Insights are created in memory and persisted through the normal save queue. No special persistence logic.
- `Spec_Export.md` — Export reads the in-memory ProjectFile. No direct disk interaction beyond the normal persistence layer.

---

## 13. Build Sequence (Preview)

### Phase 1 — File system operations

1. Implement directory creation: `~/StoryEngine/`, `projects/`, per-project folders
2. Implement `project.json` read/write with atomic write pattern (§4)
3. Implement `.bak` recovery logic
4. Write tests: create folder, write JSON, verify atomic rename, verify recovery from `.bak`

### Phase 2 — Project lifecycle

1. Implement create, open, list, delete, close operations (§6)
2. Implement schema version check and migration (§3)
3. Write tests: full lifecycle (create → open → modify → close → reopen → verify), migration from schema v1

### Phase 3 — Save queue

1. Implement the FIFO save queue with flush/debounce priority (§5)
2. Wire save triggers to the queue (chat, drag-end, phase transition, etc.)
3. Write tests: debounce coalesces, flush bypasses, queue serializes writes

### Phase 4 — Image management

1. Implement image save (AI-generated and user-uploaded)
2. Implement image delete (on entity deletion)
3. Implement `vacuumImages` (orphan cleanup on open)
4. Write tests: save/serve/delete images, vacuum removes orphans

### Phase 5 — Local server

1. Set up HTTP server with port selection logic (§8)
2. Implement all API endpoints
3. Wire CORS for Expo dev server
4. Write integration tests: full API surface

---

## 14. Out of Scope

- **Cloud sync or multi-device persistence** — out of scope for v1 (PRD §11)
- **Incremental/partial saves** — the full `ProjectFile` is written on every save. Partial updates are a future optimization.
- **Project import/export via UI** — the folder structure supports manual copy, but there's no import/export UI in v1
- **Encryption or access control** — no user accounts in v1 (PRD §11)
- **Database backend** — local JSON files only
- **File watching** — the server doesn't watch for external changes to project files

---

## 15. Open Questions

1. **Save indicator UX:** Should the workspace show a save indicator (saving/saved/error)? The persistence layer provides the state, but whether the UI shows it is a design decision. To be resolved in `Spec_Workspace_Design.md`.

2. **Project rename handling:** If the user renames a project, the folder name (which uses the project ID) doesn't change. This is by design (folder names are immutable IDs, display names are in `project.json`). But should the API support renaming the folder for readability? Deferred — not needed for v1.

---

## 16. Files Affected (Summary)

| File Path | Change |
|-----------|--------|
| `src/persistence/server.ts` | HTTP server setup, port selection |
| `src/persistence/projectStore.ts` | Create, open, list, delete, close operations |
| `src/persistence/saveQueue.ts` | FIFO queue with flush/debounce priority |
| `src/persistence/atomicWrite.ts` | tmp-then-rename write pattern with .bak recovery |
| `src/persistence/imageStore.ts` | Image file save, delete, vacuum |
| `src/persistence/migration.ts` | Schema version check and v1→v2 migration |
| `src/persistence/preferences.ts` | App preferences read/write |
| `src/persistence/__tests__/` | Unit and integration tests |

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: [repo path] | Branch: main

Spec file: docs/foundation/Spec_DataPersistence.md
→ Read this spec (v0.2) for all persistence rules.

Also read before starting:
- docs/foundation/Spec_DataModel.md (v0.2 — entity shapes serialized in project.json)
- docs/HARD_RULES.md (non-negotiable constraints)

Follow the Build Sequence in §13, phase by phase.

Key constraints:
- project.json is NEVER overwritten directly — always use atomic tmp-then-rename (§4)
- Save queue: flush bypasses 500ms debounce; only one write at a time (§5)
- Schema version is 2 — include v1→v2 migration logic (§3)
- Images stay as files in images/ folder — never embedded in JSON (§7)
- Port 3737 with fallback 3738–3747, loopback only (§8)
- vacuumImages runs on every project open (§7)

Start with: Phase 1 — implement the atomic write pattern (tmp → bak → rename)
with .bak recovery, in src/persistence/atomicWrite.ts with unit tests.

Work phase by phase. After completing each phase, stop and check in before moving on.
Commit after each phase with a message like "feat(persistence): Phase 1 — atomic writes".
```

---

*Core persistence architecture is stable from v0.1. The v0.2 revision adds new entities to the schema but doesn't change the fundamental save/load patterns.*
