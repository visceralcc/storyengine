# Story Engine — Data Persistence Specification

**Systems Design & Data Architecture**

Version 0.1 | April 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial draft. Project file format (folder + JSON), atomic save semantics, lifecycle operations, position/image edge cases. Resolves PRD Open Question #3 and DataModel Open Questions #1 and #3. |

---

## 1. Overview

Data Persistence is the layer that saves and loads every entity defined in `Spec_DataModel.md` to and from the local disk. It owns the project file format, the directory layout, save/load semantics, and recovery behavior. It does **not** own what the data means — only how it is stored.

**Design principle: A project is a folder you can copy.** Every project lives in a single self-contained folder with a human-readable JSON file at its root and any image files alongside. There is no database, no opaque blob, no separate metadata store. A user can copy a project folder to a USB stick, email it, drop it back, and the project loads exactly as it was. This shapes every downstream decision: format choice (JSON not SQLite), image storage (real files not base64), atomic writes (the folder is always in a valid state), and the absence of cross-project state.

**Consumer:** Every system that reads or writes entities goes through this layer. The Start Screen lists projects via the persistence API. The Builder UI saves edits as the user works. The Chat Engine writes new ChatMessages and Concepts. The Image system writes image files. The Export and MCP Server systems read project files. No system reads or writes the filesystem directly except through this layer.

**Scope boundary — this system does NOT:**
- Define what entities exist or what their fields mean (that's `Spec_DataModel.md`)
- Define the user-facing workflow for creating/opening/deleting projects (that's `Logic_ProjectManager.md`, downstream of this spec)
- Define how data flows from the chat to the model (that's `Spec_ChatEngine.md`)
- Define how images are generated or sourced (that's `Spec_ImageGeneration.md`)
- Handle network sync, cloud backup, or multi-device replication (out of scope for v1, see §17)
- Handle concurrent editors or merge conflicts (single-user, single-device in v1)

---

## 2. Storage Location

All Story Engine data lives in a single root directory under the user's home folder:

| Platform | Path |
|----------|------|
| macOS / Linux | `~/StoryEngine/` |
| Windows | `%USERPROFILE%/StoryEngine/` |

Resolution is via Node.js `os.homedir()`. The directory is created on first run if it does not exist.

**Why the home directory and not a platform-specific app data path:** Visibility. The user can navigate to `~/StoryEngine/` in their file manager, see their projects, copy them, back them up. A hidden Application Support / AppData path would technically be more "correct" by OS convention, but it would hide the data from the user. The "folder you can copy" principle requires the user can find the folder.

**The root path is configurable** at runtime via the `STORYENGINE_HOME` environment variable. This is for development and testing — production users get the default.

---

## 3. Filesystem Layout

```
~/StoryEngine/
└── projects/
    ├── proj_V1StGnR4q8sMDc0hX3bYz/
    │   ├── project.json              ← whole entity graph
    │   ├── project.json.bak          ← previous save (rollback)
    │   └── images/
    │       ├── img_dS5hK8lO2oR4tV7xA9yC1.png
    │       ├── img_eT6iL9mP3pS5uW8yB0zA2.jpg
    │       └── ...
    ├── proj_aB3cD4eF5gH6iJ7kL8mNo/
    │   ├── project.json
    │   ├── project.json.bak
    │   └── images/
    └── proj_xYz7wQ2nM5kT8jH3pR9sB/
        └── ...
```

### Layout rules

- **One folder per project.** The folder name is the project ID (e.g., `proj_V1StGnR4q8sMDc0hX3bYz`). The ID is generated at project creation time and never changes.
- **One JSON file per project.** All entity data — Project, ConceptTypes, Concepts, ConceptVersions, ChatMessages, Images, Insights — is serialized into a single `project.json` file. Images entity records (metadata) live in this JSON; the actual image bytes live as separate files in `images/`.
- **One images subfolder per project.** Image files are named by their Image entity ID, with the extension matching `mimeType` (e.g., `img_dS5hK8lO2oR4tV7xA9yC1.png`).
- **One backup file per project.** `project.json.bak` is the previous successful save (see §7 for recovery use).
- **No top-level index.** The Start Screen lists projects by reading the `projects/` directory and loading each `project.json` (see §6.1). For v1 with up to ~100 projects, this is fast enough. A separate index file is a future optimization (§18).

### Why this layout, not alternatives

| Alternative | Why rejected |
|-------------|-------------|
| Single SQLite database | Opaque to the user, can't be inspected or edited by hand, recovery from corruption is hard, defeats "folder you can copy". |
| One JSON file per entity (concepts.json, messages.json, etc.) | Multiple files mean partial-write hazards (one file saved, others not), need a manifest to know what's there. Single file is simpler. |
| IndexedDB / browser storage | Web app runs in a browser but the persistence layer is a Node.js local server (§12). IndexedDB doesn't survive browser cache clears, isn't user-visible, and can't share data with the MCP Server. |
| Base64-encoded images inside project.json | Inflates JSON size 4×, makes it slow to parse, makes images impossible to preview from the file manager. |

---

## 4. Project File Format (project.json)

Every `project.json` is a single JSON document with this top-level shape:

```typescript
interface ProjectFile {
  schemaVersion: number;          // currently 1; bumped on breaking format changes
  project: Project;               // the Project entity (one)
  conceptTypes: ConceptType[];    // all ConceptTypes in this project
  concepts: Concept[];            // all Concepts (each contains its versions[])
  chatMessages: ChatMessage[];    // all ChatMessages (across all three Builders)
  images: Image[];                // all Image metadata records
  insights: Insight[];            // all Insights
}
```

### Format rules

- **UTF-8 encoded.** No BOM.
- **Pretty-printed** with 2-space indentation (`JSON.stringify(obj, null, 2)`). Trades file size for human-readability — projects are small (KB to low MB) so the cost is negligible.
- **Trailing newline** at end of file.
- **Entity arrays are unordered on disk.** Consumers that need ordering (e.g., chat messages by timestamp, versions by `versionNumber`) sort on read.
- **No nested entity duplication.** ConceptVersions live inside their Concept's `versions[]` array (see DataModel §4) — they are not also in a top-level `conceptVersions[]` array. Every other entity has exactly one home in the top-level structure.

### Worked example — minimal new project

A project created via "Start New World" with no concepts yet:

```json
{
  "schemaVersion": 1,
  "project": {
    "id": "proj_V1StGnR4q8sMDc0hX3bYz",
    "name": "Untitled Project",
    "description": "",
    "initialBuilder": "WORLD",
    "createdAt": "2026-04-27T14:30:00.000Z",
    "updatedAt": "2026-04-27T14:30:00.000Z"
  },
  "conceptTypes": [
    {
      "id": "ctype_aaa...",
      "projectId": "proj_V1StGnR4q8sMDc0hX3bYz",
      "label": "Time Period",
      "description": "When the world exists",
      "builder": "WORLD",
      "isDefault": true,
      "createdAt": "2026-04-27T14:30:00.000Z"
    }
    // ...34 more default ConceptTypes (35 total per DataModel §5)
  ],
  "concepts": [],
  "chatMessages": [],
  "images": [],
  "insights": []
}
```

### Worked example — project with one Concept and one Image

```json
{
  "schemaVersion": 1,
  "project": {
    "id": "proj_V1StGnR4q8sMDc0hX3bYz",
    "name": "1820s France Story",
    "description": "Coming-of-age story on a rural estate.",
    "initialBuilder": "WORLD",
    "createdAt": "2026-04-27T14:30:00.000Z",
    "updatedAt": "2026-04-27T15:12:44.812Z"
  },
  "conceptTypes": [ /* ... 35 defaults ... */ ],
  "concepts": [
    {
      "id": "con_a8Kp2mNxR5tYwQ7vL9dJe",
      "projectId": "proj_V1StGnR4q8sMDc0hX3bYz",
      "conceptTypeId": "ctype_timeperiod...",
      "builder": "WORLD",
      "currentVersionId": "ver_cQ4gH7jM1nP3sU6wZ8xB0",
      "versions": [
        {
          "id": "ver_cQ4gH7jM1nP3sU6wZ8xB0",
          "conceptId": "con_a8Kp2mNxR5tYwQ7vL9dJe",
          "versionNumber": 1,
          "value": "1820s",
          "sourceMessageId": "msg_eT6iL9mP3pS5uW8yB0zA2",
          "createdAt": "2026-04-27T15:10:00.000Z",
          "updatedAt": "2026-04-27T15:10:00.000Z"
        }
      ],
      "relatedConceptIds": [],
      "sourceMessageId": "msg_eT6iL9mP3pS5uW8yB0zA2",
      "imageIds": ["img_dS5hK8lO2oR4tV7xA9yC1"],
      "position": { "x": 120, "y": 240 },
      "createdAt": "2026-04-27T15:10:00.000Z",
      "updatedAt": "2026-04-27T15:12:44.812Z"
    }
  ],
  "chatMessages": [
    {
      "id": "msg_eT6iL9mP3pS5uW8yB0zA2",
      "projectId": "proj_V1StGnR4q8sMDc0hX3bYz",
      "builder": "WORLD",
      "role": "user",
      "content": "Set this in 1820s France.",
      "conceptIds": [],
      "createdAt": "2026-04-27T15:10:00.000Z"
    }
  ],
  "images": [
    {
      "id": "img_dS5hK8lO2oR4tV7xA9yC1",
      "projectId": "proj_V1StGnR4q8sMDc0hX3bYz",
      "conceptId": "con_a8Kp2mNxR5tYwQ7vL9dJe",
      "source": "GENERATED",
      "generationPrompt": "1820s Paris cityscape, Haussmann era, oil painting style",
      "filePath": "images/img_dS5hK8lO2oR4tV7xA9yC1.png",
      "mimeType": "image/png",
      "width": 1024,
      "height": 1024,
      "createdAt": "2026-04-27T15:11:30.000Z"
    }
  ],
  "insights": []
}
```

---

## 5. Image File Storage

Image bytes are stored as actual files in the project's `images/` subfolder. Image entity metadata (everything except the bytes) lives in `project.json`.

### Naming

```
[image-id].[extension]
```

Where:
- `image-id` is the full Image entity ID, including the `img_` prefix
- `extension` is derived from `mimeType`: `image/png` → `.png`, `image/jpeg` → `.jpg`, `image/webp` → `.webp`

Example: `images/img_dS5hK8lO2oR4tV7xA9yC1.png`

### Image filePath field convention

The Image entity's `filePath` field (defined in DataModel §8) stores the path **relative to the project folder**, e.g. `images/img_dS5hK8lO2oR4tV7xA9yC1.png`. Consumers resolve to absolute paths by joining with the project folder path. Storing relative paths preserves the "folder you can copy" property — moving a project folder doesn't break image references.

### Supported MIME types (v1)

| MIME type | Extension | Source |
|-----------|-----------|--------|
| `image/png` | `.png` | DALL-E generated, user uploads |
| `image/jpeg` | `.jpg` | User uploads |
| `image/webp` | `.webp` | User uploads |

GIF, SVG, BMP, TIFF, HEIC are explicitly not supported in v1. Uploads of unsupported types are rejected at the API boundary with a clear error.

### Maximum image size

- Per-image: **20 MB**. Exceeding this rejects the upload at the API boundary.
- Per-project: no enforced limit, but warned in UI past 1 GB total.

These limits are persistence-layer guardrails; the UI may surface friendlier limits earlier (e.g. warn at 10 MB per image). Image generation parameters (DALL-E resolution, quality) are defined in `Spec_ImageGeneration.md`.

---

## 6. Persistence API (Logical Operations)

These are the logical operations the persistence layer exposes. The transport (HTTP API of the local server) is defined in §12; this section defines the operations independent of how they're invoked.

| Operation | Inputs | Output | Notes |
|-----------|--------|--------|-------|
| `listProjects()` | — | `ProjectMetadata[]` | Returns lightweight metadata only; does not load full project graphs. |
| `createProject(name, description, initialBuilder)` | `string`, `string`, `Builder` | `ProjectFile` | Creates folder, seeds 35 default ConceptTypes, writes initial `project.json`. |
| `openProject(projectId)` | `string` | `ProjectFile` | Reads and parses `project.json`. Returns the full entity graph. |
| `saveProject(projectFile)` | `ProjectFile` | `void` | Atomic write. See §7. |
| `deleteProject(projectId)` | `string` | `void` | Removes the entire project folder, including images. Irreversible. |
| `renameProject(projectId, newName)` | `string`, `string` | `void` | Updates `project.name` and `updatedAt`. Project folder name (the ID) is unchanged. |
| `saveImage(projectId, imageId, fileBuffer, mimeType)` | `string`, `string`, `Buffer`, `string` | `string` (filePath) | Writes image bytes to `images/`. Returns the relative `filePath` to store on the Image entity. |
| `loadImage(projectId, imageId)` | `string`, `string` | `Buffer` | Reads image bytes from `images/`. |
| `deleteImage(projectId, imageId)` | `string`, `string` | `void` | Deletes the image file from `images/`. Idempotent — succeeds if file already absent. |
| `vacuumImages(projectId, validImageIds)` | `string`, `string[]` | `string[]` (deleted file paths) | Deletes any image files in `images/` whose ID is not in `validImageIds`. Run on project open. See §11. |

### 6.1 Project metadata for the list view

`listProjects()` returns a lightweight shape — the full entity graph is not loaded for the Start Screen list:

```typescript
interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  initialBuilder: Builder;
  createdAt: string;
  updatedAt: string;
  conceptCount: number;       // for display: "12 concepts"
}
```

Implementation: read each `project.json` in the `projects/` directory, extract `project` + `concepts.length`, return without holding the full parsed graph in memory. With ~100 projects of small JSON, this completes in under 100ms on cold disk.

---

## 7. Save Semantics

Saves are **atomic, debounced, and prioritized**. The persistence layer never blocks the UI, never corrupts a project file, and coalesces rapid edits into single writes.

### 7.1 Atomic write sequence

Every `saveProject` follows this sequence to guarantee `project.json` is never torn:

```
1. Serialize ProjectFile → JSON string
2. Write JSON to project.json.tmp
3. fsync project.json.tmp
4. Rename project.json → project.json.bak    (replaces previous .bak)
5. Rename project.json.tmp → project.json
6. fsync the project folder
```

If any step fails, the previous `project.json` remains intact (steps 1–3 leave it unmodified; step 4 makes the .bak the live file until step 5 completes). On Linux/macOS, `rename` is atomic. On Windows, use `MoveFileExW` with `MOVEFILE_REPLACE_EXISTING`.

### 7.2 Save priority

Two priorities:

| Priority | When used | Behavior |
|----------|-----------|----------|
| `flush` | New chat message sent; AI response received; explicit user "Save"; project close | Bypass debounce, write immediately. User input must never be lost on crash. |
| `debounce` | Card position drag-end; concept value in-place edit; insight dismissed; default for everything else | Schedule a save 500ms after the last change. Coalesces rapid-fire edits. |

The debounced save is canceled if `flush` fires within the window — the flush includes any pending changes.

### 7.3 Write queue

All saves serialize through a single in-memory FIFO queue per project. A new save request waits for the previous one to complete. This prevents two concurrent atomic writes from racing on the same project folder.

If a save is queued while another save is pending and a third request arrives, the second is replaced by the third (no point writing an interim state when the latest already supersedes it). Effectively: at most one in-flight save and one pending save per project.

### 7.4 Worked example — drag a card

```
t=0ms     User starts dragging card. Position updates in-memory only.
t=120ms   User still dragging. Position updates in-memory only.
t=600ms   User releases (drop). Trigger debounced save.
t=1100ms  500ms after drop: save fires. Atomic write completes ~30ms later.
```

If the user drags again at t=900ms, the t=1100ms save is canceled and rescheduled to t=400ms after the new drop.

### 7.5 Worked example — chat message

```
t=0ms     User sends "She's a painter from Paris."
          → User ChatMessage created in memory.
          → flush save fires immediately.
          → Atomic write completes ~30ms later.

t=200ms   Anthropic API call begins.
t=2400ms  API returns. Two new Concepts and an assistant ChatMessage created.
          → flush save fires.
          → Atomic write completes ~30ms later.
```

User input is durable before the API call starts. If the API fails or the app crashes mid-call, the user message is preserved.

---

## 8. Load Semantics & Recovery

### 8.1 Normal load

```
1. Read project.json from the project folder
2. JSON.parse
3. Validate schemaVersion
4. Return ProjectFile
```

### 8.2 Recovery from corrupt or missing project.json

If step 1 or 2 fails:

```
1. Attempt to read project.json.bak
2. If .bak exists and parses: return it, log a warning, copy .bak → project.json on next save
3. If .bak also fails: return a recoverable error to the caller; do not modify any files
```

The user-facing handling of an unrecoverable load is the responsibility of `Logic_ProjectManager.md` (it shows an error UI). The persistence layer's job is to surface the failure cleanly and never make things worse.

### 8.3 Schema version mismatch

If `schemaVersion` is higher than the running app supports, the load returns a clear error. The user is told their project was created by a newer Story Engine version and the app refuses to open it (rather than silently corrupting it). Migration of older versions to newer is handled in §11.

### 8.4 Vacuum on open

After a successful load, the persistence layer runs `vacuumImages(projectId, validImageIds)` where `validImageIds` is the set of all `Image.id` values from the loaded `images[]` array. Any orphaned image files in `images/` are deleted. See §11 for the rationale.

---

## 9. Project Lifecycle Operations

This section defines the persistence-layer behavior for each lifecycle operation. The UI orchestration (confirmation dialogs, error handling) lives in `Logic_ProjectManager.md`.

### 9.1 Create

```
1. Generate project ID: proj_[nanoid]
2. Build the initial Project entity (createdAt = updatedAt = now, name = caller-provided)
3. Generate the 35 default ConceptTypes (per DataModel §5) — each gets a fresh ctype_[nanoid] ID
4. Create the project folder: ~/StoryEngine/projects/[projectId]/
5. Create the images subfolder: ~/StoryEngine/projects/[projectId]/images/
6. Atomic-write the initial project.json (per §7.1)
7. Return the full ProjectFile
```

The folder is created before the file write. If folder creation fails (disk full, permissions), no partial state remains.

### 9.2 Open

Already covered in §8.

### 9.3 Save

Already covered in §7.

### 9.4 Delete

```
1. Verify the project folder exists (no-op if already gone — idempotent)
2. Remove the entire project folder recursively (project.json, project.json.bak, images/)
3. Cancel any pending debounced save for this project
```

There is no trash / soft delete in v1. Deletion is immediate and irreversible. (HARD_RULES: no soft-delete.)

### 9.5 Rename

```
1. Load the current project.json
2. Update project.name and project.updatedAt
3. Atomic-write project.json
```

The folder name (the project ID) is **not** changed. Renaming is purely a content operation. This means folder paths are stable across renames and external references (e.g., shortcuts, MCP Server URLs) keep working.

---

## 10. Concept Position Persistence

**Resolves DataModel Open Question #1.**

Card positions are saved on **drag-end (drop)**, not during drag.

### Rule

| Event | In-memory state | Disk |
|-------|-----------------|------|
| Drag start | Position locks for the dragged card | No write |
| Drag move | Position updated continuously for smooth rendering | No write |
| Drag end (drop) | Final position recorded | Schedule debounced save (per §7.2) |

### Why drag-end, not throttled-during-drag

A throttled-during-drag save (e.g., once per 100ms) would generate dozens of disk writes for a single drag operation, with most of those writes immediately superseded by the next position. Drag-end produces one write per drag, which is correct: the only position that matters is the final one.

### Edge case — app crashes mid-drag

If the app crashes during a drag (before drop), the card's last persisted position is the start position, not the position at the moment of crash. This is acceptable: the user did not commit to a new position. They can drag again on next open.

### Edge case — drag ends but user closes the app before debounce fires

The 500ms debounce window is short enough that this is rare, but to defend against it: the persistence layer flushes any pending debounced saves on app close (treats close as a `flush` event per §7.2). The local server's shutdown handler awaits all pending saves before exiting.

---

## 11. Image Cleanup

**Resolves DataModel Open Question #3.**

When a Concept is deleted, its image files are deleted **immediately**, in the same operation. There is no garbage collection queue.

### Rule

When the application calls `deleteConcept(conceptId)` (logic owned by `Logic_ProjectManager.md`):

```
1. For each imageId in concept.imageIds:
   a. Look up the Image entity to get its filePath
   b. Call deleteImage(projectId, imageId) → removes the file
   c. Remove the Image entity from project.images[]
2. Remove the Concept and its versions from project.concepts[]
3. Clean up references (per DataModel §12 deletion rules):
   - Remove conceptId from any other Concept's relatedConceptIds[]
   - Remove conceptId from any ChatMessage's conceptIds[]
   - Remove conceptId from any Insight's referencedConceptIds[]
4. Trigger a flush save
```

### Failure mode — file delete fails mid-way

If step 1.b fails for some images (e.g., a permission error or file lock), the Concept and Image entities are still removed from `project.json` on the save. The image files become orphans on disk.

This is a known, bounded failure mode. The vacuum mechanism (§8.4) handles it: on the next project open, `vacuumImages` scans `images/` against the loaded `images[]` and deletes any file whose ID isn't in the live set. Orphaned files are never permanent.

### Why immediate delete and not a deferred GC

Three reasons:
1. **Predictability.** Disk reflects the state of the project. Users who copy the project folder don't carry "deleted" image files.
2. **Simplicity.** No GC queue to maintain, no "tombstone" tracking.
3. **Cost.** Image files are small (KB to a few MB). Deferring saves nothing meaningful.

---

## 12. Schema Versioning

`project.json` includes a `schemaVersion: number` field. v1 is `schemaVersion: 1`.

### Rules

- A project with `schemaVersion` higher than the running app refuses to open (§8.3).
- A project with `schemaVersion` lower than the running app is migrated forward in memory on open. Migrated state is written back on next save.
- Migration functions live in `src/persistence/migrations/v[from]_to_v[to].ts`. Each migration takes a `ProjectFile` of the old shape and returns a `ProjectFile` of the new shape.
- v1 has no migration functions (it's the initial version).

### When to bump the version

Only on **breaking format changes** — adding a required field that older projects don't have, removing a field, renaming a field, changing the meaning of a value. Adding an optional field with a default does not require a version bump.

Migrations are out of scope for v1 implementation but the version field is reserved now to avoid a painful retrofit later.

---

## 13. Local Server (Transport)

The persistence layer runs in a Node.js process — the **Story Engine local server** — that exposes the operations in §6 over a small HTTP API on `localhost`.

### Why a local server and not direct filesystem access from the web app

Story Engine's frontend is React Native / Expo targeting web. Web apps run in a browser and cannot access the user's filesystem. A small Node.js process bridges the gap. The same process also runs the MCP Server (`Spec_MCPServer.md`) — both the web app and external MCP clients talk to the same local server.

### Server identity

| Property | Value |
|----------|-------|
| Default host | `127.0.0.1` (loopback only — never bind to `0.0.0.0`) |
| Default port | `3737` |
| Port conflict | If `3737` is unavailable, fall back to next free port in `3737–3747`. Web app reads the actual port from a known file: `~/StoryEngine/server.port` |
| Auth | None in v1 (loopback-only access; single user) |
| CORS | Allow only `http://localhost:*` origins |

### HTTP API surface (v1)

| Method | Path | Operation |
|--------|------|-----------|
| `GET` | `/projects` | `listProjects()` |
| `POST` | `/projects` | `createProject(name, description, initialBuilder)` |
| `GET` | `/projects/:id` | `openProject(projectId)` |
| `PUT` | `/projects/:id` | `saveProject(projectFile)` |
| `DELETE` | `/projects/:id` | `deleteProject(projectId)` |
| `PATCH` | `/projects/:id` | `renameProject(projectId, newName)` (body: `{ name }`) |
| `POST` | `/projects/:id/images/:imageId` | `saveImage(...)` (multipart upload) |
| `GET` | `/projects/:id/images/:imageId` | `loadImage(...)` |
| `DELETE` | `/projects/:id/images/:imageId` | `deleteImage(...)` |

Responses are JSON. Errors use standard HTTP status codes (`404` for missing project, `409` for schema mismatch, `413` for image too large, `500` for I/O failure) with a JSON body `{ error: string, code: string }`.

### Out of transport scope

- TLS (loopback-only, not needed in v1)
- Authentication (single-user, single-device)
- Rate limiting (single client)
- WebSocket / streaming responses (full ProjectFile loads are small enough for HTTP)

If the MCP Server adds transport requirements, those are defined in `Spec_MCPServer.md`, not here.

---

## 14. Edge Cases & Rules

### Disk full
Save fails with a clear error. The atomic-write sequence (§7.1) ensures the previous `project.json` is unchanged. The pending save remains in the queue and retries on the next save trigger. The UI must surface the error to the user (handled in `Logic_ProjectManager.md`).

### Permissions error on save
Same as disk full: atomic-write protects the previous state, error surfaces, save is retried on next trigger.

### Project folder deleted externally while open
On next save, `mkdirp` recreates the folder. The user's in-memory state is preserved. The `.bak` is lost; only the next save's content survives.

### project.json.bak missing during recovery
If `project.json` is corrupt and `.bak` does not exist, return a clear "unrecoverable" error. Never auto-create an empty project to "recover" — that would silently destroy user data.

### Image file present in `images/` but not in `images[]` array
Orphaned. Cleaned up by `vacuumImages` on next open (§8.4).

### Image entity in `images[]` array but file missing in `images/`
This is bad — the data model references a file that doesn't exist. The Image entity is preserved in memory, but `loadImage` returns a 404. Card UI should show a "missing image" placeholder. Vacuum does **not** remove these entities; that's a destructive action and only the user can decide. Logged for diagnostics.

### Two app instances open simultaneously
Not supported in v1. Behavior is undefined. The local server should detect a port collision and refuse to start a second instance (it's the same Node.js process; second launch fails fast).

### Project IDs collide
nanoid at 21 characters has astronomical collision resistance (~149 trillion years to a 1% collision chance at 1000 IDs/second). The persistence layer does not check for collision — the data model guarantees uniqueness.

### Move project folder to a different name
Not supported. The folder name is the project ID. Renaming the folder breaks the contract that `folder name === project.id`. The user-facing rename operation (§9.5) updates the `name` field, not the folder name.

### Symlinks inside the project folder
Treated as regular files. A user-created symlink in `images/` would be read/written through. Not a supported workflow but doesn't break.

### Images named in non-canonical format
If a file in `images/` is not named `[image-id].[extension]`, it is treated as orphaned by vacuum and deleted on next open.

### Concept versioning + persistence
Every version edit (in-place or new version) updates `Concept.updatedAt` and triggers a debounced save. This is unconditional — there's no "draft" state where an edit isn't persisted.

### Append-only chat messages
ChatMessages are never deleted at the persistence layer (DataModel §7). The persistence layer enforces this by not exposing a `deleteChatMessage` operation. The full `chatMessages[]` array is rewritten on every save, but messages are only ever appended, never removed.

### updatedAt cascade
Project's `updatedAt` is updated by the **caller** before invoking `saveProject` — the persistence layer does not modify the data it receives. (Why: the persistence layer is format-agnostic per design principle. Touching `updatedAt` would be domain logic.)

---

## 15. Relationship to Other Systems

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| `Spec_DataModel.md` | Persists every entity defined there; depends on serialization constraints | DataModel §13 |
| `Logic_ProjectManager.md` | Calls every operation in §6; orchestrates user-facing lifecycle | §6, §9 |
| `Spec_StartScreen_Design.md` | Reads project metadata via `listProjects()` | §6.1 |
| `Spec_ChatEngine.md` | Triggers `flush` saves on user message and AI response | §7.2 |
| `Spec_Builder_Design.md` | Triggers `debounce` saves on card drag-end and concept edits | §7.2, §10 |
| `Spec_ImageGeneration.md` | Calls `saveImage` after DALL-E response or upload | §6 |
| `Spec_Export.md` | Reads `ProjectFile` via `openProject` to generate exports | §6 |
| `Spec_MCPServer.md` | Reads `ProjectFile` (read-only) to serve queries; shares the local server process | §13 |

**No direct interaction:**
- `Spec_Navigation.md` — routing happens in the web app, not in the persistence layer.
- `Spec_InsightsEngine.md` — writes Insights to the in-memory state, then the standard save flow persists them. The Insights Engine doesn't talk to persistence directly.
- `Spec_InsightsPanel_Design.md` — same reason.

---

## 16. Data Model (Preview)

This spec introduces no new entities, but defines two new types that wrap the existing data model:

```typescript
// The on-disk shape of a project file
interface ProjectFile {
  schemaVersion: number;          // 1 in v1
  project: Project;
  conceptTypes: ConceptType[];
  concepts: Concept[];
  chatMessages: ChatMessage[];
  images: Image[];
  insights: Insight[];
}

// The lightweight shape returned by listProjects()
interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  initialBuilder: Builder;
  createdAt: string;
  updatedAt: string;
  conceptCount: number;
}
```

All entity types (`Project`, `ConceptType`, `Concept`, `ChatMessage`, `Image`, `Insight`) are defined in `Spec_DataModel.md` §15.

---

## 17. Build Sequence (Preview)

### Phase 1 — Filesystem core

1. Implement storage location resolution (`os.homedir() + /StoryEngine`, env override)
2. Implement folder operations: ensure project root exists, create project folder, delete project folder
3. Implement atomic write helper (write-tmp → fsync → rename → fsync-dir)
4. Write unit tests for atomic write under simulated failure (kill-mid-rename, disk full)

### Phase 2 — Project file read/write

1. Implement `ProjectFile` JSON serialization and parsing
2. Implement `openProject` (with .bak fallback)
3. Implement `saveProject` (atomic, no debouncing yet)
4. Implement `createProject` including default ConceptType seeding (delegates to data model factories)
5. Implement `deleteProject` and `renameProject`
6. Write unit tests for round-trip: create → save → open returns identical state

### Phase 3 — Image storage

1. Implement `saveImage`, `loadImage`, `deleteImage`
2. Implement `vacuumImages` and wire it to `openProject`
3. Write unit tests for vacuum (orphan deletion, missing-file handling)

### Phase 4 — Save semantics

1. Implement the in-memory write queue (one in-flight + one pending per project)
2. Implement debounced save (500ms default, configurable)
3. Implement `flush` priority that bypasses debounce
4. Implement on-shutdown flush (await pending saves before exit)
5. Write unit tests for debounce coalescing, flush bypass, and shutdown flush

### Phase 5 — Local server

1. Implement Express HTTP API per §13
2. Bind to loopback only, fall back through ports 3737–3747
3. Write `~/StoryEngine/server.port` so the web app finds it
4. Wire CORS for `http://localhost:*`
5. Write integration tests for each endpoint

### Phase 6 — Failure surfaces

1. Define error response shape (`{ error, code }`)
2. Implement error handling for: disk full, permissions, missing project, schema mismatch, corrupt JSON, .bak fallback, image too large, unsupported MIME
3. Write integration tests covering each error path

---

## 18. Out of Scope

- **Cloud sync, backup, or remote storage** — local-only in v1 (HARD_RULES). A user putting `~/StoryEngine` inside a Dropbox/iCloud folder may incidentally get sync, but it is unsupported and undefined.
- **Multi-user editing or conflict resolution** — single-user, single-device in v1 (PRD §11).
- **Multi-instance launches** — only one Story Engine app runs per user at a time. Second-instance behavior is undefined.
- **Schema migration logic for v1** — the version field exists, but no migrations are written. They will be added when `schemaVersion: 2` ships.
- **Encryption at rest** — files are stored in plaintext. Consider in a future spec if user demand emerges.
- **Compression** — `project.json` is uncompressed. Project sizes are too small to benefit.
- **Streaming or partial loads** — every `openProject` loads the full graph into memory. Acceptable for v1 size estimates (DataModel §12).
- **Full-text search of project content** — the persistence layer only reads/writes; search lives elsewhere.
- **Trash / undo across project deletions** — deletions are permanent (HARD_RULES).
- **Soft-delete of any entity** — entities are either present in `project.json` or absent.
- **Filesystem watching for external changes** — if the user edits `project.json` by hand while the app is open, behavior is undefined. The user is expected to close the app, edit, then reopen.
- **Top-level project index file** — see §3, future optimization.
- **Authentication on the local server** — loopback-only single-user (§13).
- **Image format conversion** — the bytes the user uploads or DALL-E returns are stored as-is. No re-encoding, no resizing.
- **Selective save of subsets of the project** — `saveProject` always writes the full `ProjectFile`. There is no "save just this concept" optimization in v1.

---

## 19. Open Questions

None — all questions resolved.

The following were considered and are noted only as future-considerations:

- **Top-level index file** for fast project listing. v1 reads each `project.json` for the list view (§6.1). A pre-computed `projects/index.json` could be added if listing becomes slow at scale.
- **Selective save** (write only changed entities). Whole-file write is fine for v1 sizes; a delta-save scheme could be added if files grow large.
- **Schema migration framework** beyond the version field. Will be designed when the first breaking change is needed.

---

## 20. Files Affected (Summary)

| File Path | Change |
|-----------|--------|
| `src/persistence/storage.ts` | Storage location resolution, folder management |
| `src/persistence/atomicWrite.ts` | Atomic write helper (tmp → fsync → rename) |
| `src/persistence/projectFile.ts` | `ProjectFile` serialization and parsing |
| `src/persistence/operations.ts` | Logical operations: `listProjects`, `createProject`, `openProject`, `saveProject`, `deleteProject`, `renameProject` |
| `src/persistence/images.ts` | `saveImage`, `loadImage`, `deleteImage`, `vacuumImages` |
| `src/persistence/saveQueue.ts` | In-memory write queue, debounce, flush priority |
| `src/persistence/server.ts` | Local HTTP server (Express), endpoint handlers, port management |
| `src/persistence/migrations/index.ts` | Schema version registry (no migrations in v1) |
| `src/persistence/__tests__/` | Unit and integration tests for all of the above |

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: [repo path] | Branch: main

Spec file: docs/foundation/Spec_DataPersistence.md
→ Read this spec for the full file format, save semantics, and API surface.

Also read before starting:
- docs/foundation/Spec_DataModel.md (entity definitions — referenced throughout)
- docs/HARD_RULES.md (local-first, no cloud, no auth in v1)
- docs/OVERVIEW.md (project context)

Follow the Build Sequence in §17, phase by phase.

Key constraints:
- Atomic writes are mandatory: write-tmp → fsync → rename → fsync-dir (§7.1).
  Never overwrite project.json directly.
- One project = one folder named by project ID. Folder name never changes (§9.5).
- Image bytes are real files in images/, not base64 in project.json (§5).
- Local server binds to 127.0.0.1 only, never 0.0.0.0 (§13).
- Persistence layer is format-agnostic: it does NOT modify updatedAt or any other
  entity field on save — the caller is responsible for that (§14).
- ChatMessages are append-only — do not expose a deleteChatMessage operation (§14).
- schemaVersion: 1 for v1. Refuse to open higher versions (§8.3).

Start with: Phase 1 — Filesystem core. Implement src/persistence/storage.ts and
src/persistence/atomicWrite.ts with unit tests for the atomic write under simulated
failure (kill-mid-rename, disk full simulation via mock fs).

Work phase by phase. After completing each phase, stop and check in before moving on.
Commit after each phase with a message like "feat(persistence): Phase 1 — filesystem core".
```

---

*This spec resolves PRD §13 Open Question #3 (project file format), DataModel §18 Open Question #1 (position save granularity), and DataModel §18 Open Question #3 (image cleanup on concept deletion). It is referenced by every system that reads or writes project data. Update the version history and notify dependents on changes to the file format or API surface.*
