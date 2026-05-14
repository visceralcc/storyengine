# Story Engine — Discovery Engine Specification

**Systems Design & Data Architecture**

Version 0.1 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | May 2026 | Initial draft. Spatial canvas model, dual-input note creation, consolidation logic, creative gravity detection, gap analysis, re-consolidation flow. |

---

## 1. Overview

The Discovery Engine manages the freeform ideation phase of Story Engine — where raw creative ideas get captured, clustered, and analyzed before structured development begins.

**Design principle: Volume before structure.** Discovery exists to capture creative energy without filtering it. Every system in this engine is optimized for getting ideas out of the user's head, not organizing them. Organization happens exactly once (consolidation) and only when the user explicitly asks for it. Until that moment, the canvas is a judgment-free zone.

**Consumer:** The Discovery canvas screen (`Screen_DiscoveryCanvas.md`) renders the canvas and notes. The Chat Engine (`Spec_ChatEngine.md`) provides the AI brainstorming and stream-of-consciousness extraction behaviors. The Navigation system (`Spec_Navigation.md`) triggers phase transitions from Discovery to Development. The Development chat engine consumes the gap analysis output to guide its conversational strategy.

**Scope boundary — this system does NOT:**
- Create Concept cards or assign Concept Types (those emerge in Development — see `Spec_ChatEngine.md`)
- Render the canvas UI or note components (see `Spec_Discovery_Design.md`)
- Manage chat message persistence (see `Spec_DataPersistence.md`)
- Handle phase transitions (see `Spec_Navigation.md` §3.5)
- Generate images (see `Spec_ImageGeneration.md`)

---

## 2. Canvas Model

The Discovery canvas is a **spatial, unbounded 2D surface** where notes are placed at specific x/y coordinates. Notes can be placed anywhere, dragged to new positions, and overlap freely. There is no grid, no snap-to, no enforced alignment.

### 2.1 Coordinate System

The canvas uses a virtual coordinate space with the origin (0, 0) at the top-left corner. Coordinates are stored as integers (whole pixels). The canvas has no fixed boundaries — it extends in all directions as the user places notes.

**Viewport:** The user views the canvas through a viewport that can pan (scroll in any direction) and optionally zoom. The viewport position and zoom level are ephemeral UI state — not persisted to disk.

**Note positions are absolute.** A note's `position: { x, y }` represents its top-left corner in canvas coordinates. These positions are persisted (see `Spec_DataPersistence.md`).

### 2.2 Note Placement

Notes can be created through two input paths (see §3). Regardless of input path, the placement follows the same rules:

**Manual placement (traditional sticky note):**
1. User enters "placement mode" (taps an "Add Note" button or similar affordance)
2. A ghost preview (semi-transparent note outline) follows the cursor/pointer on the canvas
3. User taps/clicks a location on the canvas to place the note
4. The note is created at the tapped position and immediately enters edit mode (text cursor active, keyboard ready)
5. User types the note content and taps away or presses Enter/Escape to finish editing

**AI-generated placement (from stream-of-consciousness extraction):**
- Notes are placed at random positions within the current viewport bounds, with collision avoidance
- Collision avoidance: each new note checks for overlap with existing notes. If the random position overlaps, a new random position is generated (up to 10 attempts). If all 10 attempts collide, the note is placed at the last attempted position (some overlap is acceptable)
- Notes from a single extraction batch (multiple notes from one chat message) are scattered across the viewport — not clustered together

### 2.3 Note Interaction

**Drag:** Notes are freely draggable. Drag begins after a pointer-down hold exceeds a tap threshold (150ms hold or 5px movement). During drag, the note's z-index elevates above other notes. On drag-end, the new position is persisted.

**Tap:** Tapping a note (pointer-down + pointer-up within the tap threshold) enters edit mode for that note. The note's text becomes editable with a cursor.

**Edit:** In edit mode, the user can modify the note's content. Editing ends when the user taps outside the note, presses Escape, or the note loses focus. On edit-end, the updated content is persisted.

**Delete:** Notes can be deleted via an explicit delete action (e.g., a small × button visible on hover/focus, or a long-press context menu). Deletion is immediate — no undo in v1.

### 2.4 Z-Index Management

Notes stack visually. The most recently interacted-with note (placed, dragged, or edited) sits on top. Implementation: maintain a `zIndex` counter that increments on each interaction. This is ephemeral UI state, not persisted.

---

## 3. Dual Input Paths

Discovery supports two ways to create notes, reflecting two modes of creative thinking.

### 3.1 Manual Note Creation

The user places notes one at a time on the canvas, types content into each one. This is the "traditional sticky note" approach — deliberate, one idea per note.

**Rules:**
- One note per placement action
- Note content can be any length (no enforced limit in v1, though the Design Spec may impose visual constraints)
- Empty notes (no content after edit-end) are automatically deleted
- Notes are created as `DiscoveryNote` entities (see `Spec_DataModel.md` §6)

### 3.2 Stream-of-Consciousness Extraction

The user types freely into the chat panel — a paragraph, a rambling thought, a brain dump. The AI parses the input and creates multiple discrete notes from it, each representing a single idea or creative fragment.

**AI extraction rules:**
- Each extracted note should represent one discrete idea — a character detail, a world element, a mood, a conflict, a visual image, a relationship dynamic
- Notes are atomic: if an idea can be split into two independent ideas, it should be
- Notes preserve the user's language where possible — the AI doesn't rephrase or formalize. It extracts and separates, it doesn't rewrite
- The AI does not assign Concept Types, dimensions, or any structural labels to extracted notes. They are raw fragments, same as manually created notes
- If the user's input contains no extractable ideas (e.g., "I'm not sure what to write"), the AI responds conversationally in the chat but does not create any notes

**Extraction prompt pattern:**

The chat engine sends the user's message to the Anthropic API with a system prompt instructing it to:
1. Read the user's message as raw creative brainstorming
2. Identify discrete creative ideas, fragments, or sparks within it
3. Return each as a short note (typically 5–30 words)
4. Return them as a structured list (JSON array) so the system can create `DiscoveryNote` entities

**Response format from AI:**

```typescript
interface ExtractionResult {
  notes: string[];          // array of note content strings
  chatResponse: string;     // conversational response to show in the chat panel
}
```

The `chatResponse` is displayed in the chat as the AI's reply. The `notes` are created as `DiscoveryNote` entities and placed on the canvas per §2.2 placement rules.

**Worked example:**

User input:
> "I keep imagining this woman on a horse, riding away from a mansion, and she's angry but also relieved, and maybe there's a letter in her pocket that changes everything, and the whole landscape is golden like late afternoon in Provence"

AI extraction:
```json
{
  "notes": [
    "A woman riding a horse away from a mansion",
    "She's angry but also relieved — conflicted emotions",
    "A letter in her pocket that changes everything",
    "Golden late afternoon light in Provence",
    "The mansion she's leaving behind"
  ],
  "chatResponse": "I can feel the energy in this scene — the escape, the conflicting emotions, the mystery of the letter. I've captured five fragments from that. What else comes to mind about this moment?"
}
```

### 3.3 Chat Brainstorming (No Notes Created)

The user can also use the chat panel as a brainstorming partner without triggering note extraction. This happens when the user asks a question or requests ideas rather than dumping creative material.

**How to distinguish extraction from brainstorming:** The chat engine determines intent based on the user's message:
- **Extraction trigger:** The message contains creative content — descriptions, scenes, character details, world elements, moods, dialogue. The user is *expressing* ideas.
- **Brainstorming trigger:** The message is a question or request — "Give me ideas for...", "What if...", "Help me think about...", "What kind of conflict would work here?" The user is *requesting* ideas.

In brainstorming mode, the AI responds conversationally in the chat. No notes are created automatically. The user can manually create notes from any ideas that resonate.

**Edge case — ambiguous intent:** When the user's message could be either expression or request, the AI defaults to brainstorming (responds conversationally, no notes created). It's better to under-extract than to create unwanted notes. The user can always say "put those on the canvas" as a follow-up to trigger extraction from the AI's response.

---

## 4. Consolidation

Consolidation is the single structural moment in Discovery — when the AI reads all notes, identifies thematic patterns, and groups them into labeled clusters. It happens exactly once per consolidation action (but can be repeated if the user returns to Discovery and re-consolidates).

### 4.1 Trigger

Consolidation is **user-initiated only.** The user taps a "Consolidate Ideas" button. The system never auto-consolidates.

**Minimum note count:** Consolidation requires at least 3 notes on the canvas. If fewer than 3 notes exist when the user taps "Consolidate Ideas," the system shows a message: "Add a few more ideas before consolidating — you need at least 3 notes." The button is disabled (grayed out) when fewer than 3 notes exist.

### 4.2 Consolidation Process

When consolidation is triggered:

1. **Collect all notes.** Read every `DiscoveryNote` in the project. All notes are included — there is no filtering by session, date, or position.

2. **Send to AI for grouping.** The note contents (not positions or IDs) are sent to the Anthropic API with a consolidation prompt (see §4.3). The AI returns thematic clusters.

3. **Assign cluster IDs.** Each cluster gets a `cluster_[nanoid]` ID. Each note's `clusterId` field is updated to point to its assigned cluster.

4. **Rearrange notes on canvas.** Notes are physically repositioned into their cluster groups using the layout algorithm (§4.4). Each cluster is laid out as a grid of notes with a labeled border box around it.

5. **Detect creative gravity.** As a byproduct of clustering, the AI classifies each cluster by its dominant creative dimension (§5).

6. **Run gap analysis.** The AI maps cluster content against the 41 default Concept Types to identify what's represented and what's missing (§6).

7. **Update PhaseState.** Set `discovery.status` to `CONSOLIDATED`, populate `discovery.clusters` with the cluster data, set `discovery.creativeGravity` to the detected dimension (or null), and store the gap analysis results.

### 4.3 Consolidation Prompt

The consolidation prompt sent to the Anthropic API includes:

**Input:**
- All note contents as a numbered list
- Instructions to group notes by thematic similarity
- Instructions to label each group with a short descriptive name (2–6 words)
- Instructions to classify each group by dominant creative dimension (World, Character, or Conflict)
- Instructions to identify which of the 41 default Concept Types are represented across the notes (gap analysis)

**Output format:**

```typescript
interface ConsolidationResult {
  clusters: {
    label: string;                    // e.g., "Her relationship with the estate"
    noteIndices: number[];            // indices into the input note list
    dominantDimension: Dimension;     // WORLD | CHARACTER | CONFLICT
  }[];
  creativeGravity: Dimension | null;  // which dimension has the most energy overall
  gapAnalysis: GapAnalysis;           // see §6
}
```

**Clustering rules for the AI:**
- Every note must belong to exactly one cluster. No note is left unclustered.
- A cluster must contain at least 2 notes. If a note doesn't fit any thematic group, the AI creates a "Miscellaneous" or "Other Sparks" cluster for orphan notes.
- Labels should be descriptive and creative — "Her relationship with the estate" is better than "Group 1" or "Character notes."
- The AI should prefer fewer, broader clusters over many narrow ones. Target: 3–7 clusters for a typical Discovery session (10–40 notes). More notes may produce more clusters, but the AI should resist over-splitting.

### 4.4 Post-Consolidation Layout

After consolidation, notes are rearranged on the canvas into their cluster groups. The layout algorithm positions clusters as rectangular groups with clear spacing between them.

**Layout parameters:**

```typescript
const NOTE_WIDTH = 140;        // pixels — matches DiscoveryNote component width
const NOTE_HEIGHT = 140;       // pixels — matches DiscoveryNote component height
const NOTE_GAP = 16;           // pixels — gap between notes within a cluster
const MAX_CLUSTER_COLS = 4;    // maximum notes per row within a cluster
const CLUSTER_GAP = 80;        // pixels — gap between cluster groups
const BORDER_PAD = 20;         // pixels — padding inside the cluster border box
const LAYOUT_START_X = 100;    // pixels — left offset for the first cluster
const LAYOUT_START_Y = 100;    // pixels — top offset for the first cluster
const LAYOUT_MAX_WIDTH = 1400; // pixels — wraps clusters to next row after this width
```

**Algorithm (adapted from Velocity's `layoutGroups`):**

1. For each cluster, calculate the grid dimensions:
   - `cols = min(MAX_CLUSTER_COLS, noteCount)`
   - `rows = ceil(noteCount / MAX_CLUSTER_COLS)`
   - `contentWidth = cols * NOTE_WIDTH + (cols - 1) * NOTE_GAP`
   - `contentHeight = rows * NOTE_HEIGHT + (rows - 1) * NOTE_GAP`

2. Place clusters left-to-right, wrapping to a new row when `cursorX + contentWidth > LAYOUT_MAX_WIDTH`:
   - Each note within a cluster is positioned in a grid pattern
   - The cluster's border box extends `BORDER_PAD` pixels around the note grid on all sides
   - The cluster's label appears above the border box

3. Track the tallest cluster in each row to correctly position the next row's Y offset.

**Note:** The exact pixel values above are starting points. The Design Spec (`Spec_Discovery_Design.md`) may adjust these for visual reasons. The algorithm structure is the contract; the constants are tunable.

### 4.5 User Review

After consolidation, the user can adjust the results:

- **Rename a cluster label:** Tap the cluster label to edit it inline.
- **Drag a note between clusters:** Drag a note out of one cluster and into another. The note's `clusterId` updates to the new cluster. The border boxes resize accordingly.
- **Drag a note to ungrouped space:** Dragging a note away from all clusters sets its `clusterId` to `null`. Unclustered notes appear outside any border box.
- **The user cannot create new clusters manually.** If the user wants to split a cluster, they re-consolidate (§4.6) after rearranging notes.
- **The user cannot delete clusters.** A cluster disappears automatically when its last note is dragged out of it.

### 4.6 Re-Consolidation

If the user returns to Discovery from Development (phase regression — see `Spec_Navigation.md` §3.5), or simply wants to re-consolidate after adding more notes:

1. The user adds new notes (and/or edits existing ones)
2. The user taps "Consolidate Ideas" again
3. The system runs the full consolidation process (§4.2) on **all** notes — old and new
4. **Previous cluster assignments are replaced entirely.** The AI produces fresh clusters from the complete note pool. Old cluster IDs are discarded and new ones generated.
5. PhaseState is updated: `discovery.status` returns to `CONSOLIDATED` (it was set to `IN_PROGRESS` when the user returned to Discovery), clusters are replaced, creative gravity is re-detected, gap analysis is re-run.

**Why full re-consolidation instead of incremental:** Incremental grouping (adding new notes to existing clusters) produces worse results. The AI makes better clustering decisions when it sees the full picture. The cost is re-running the API call — acceptable for the note volumes Discovery produces (typically 10–100 notes).

---

## 5. Creative Gravity Detection

Creative gravity identifies which creative dimension is pulling the user's energy — are they primarily thinking about a character, a world, or a conflict?

### 5.1 Detection Mechanism

Creative gravity is a **byproduct of consolidation**, not a real-time process. During consolidation (§4.3), the AI classifies each cluster by its dominant dimension (World, Character, or Conflict). Creative gravity is then calculated from the cluster-level dimension assignments.

### 5.2 Calculation

```
gravityScore[dimension] = sum of (noteCount in clusters where dominantDimension == dimension)

creativeGravity = dimension with highest gravityScore
```

If two or more dimensions are tied (equal `gravityScore`), `creativeGravity` is `null` — no clear gravity detected.

**Worked example:**

After consolidation, 5 clusters exist:

| Cluster | Notes | Dominant Dimension |
|---------|-------|--------------------|
| "Her conflicted emotions" | 6 | CHARACTER |
| "The Provence estate" | 4 | WORLD |
| "The letter and its consequences" | 3 | CONFLICT |
| "Golden light and landscape" | 3 | WORLD |
| "Sister relationship" | 2 | CHARACTER |

Gravity scores:
- CHARACTER: 6 + 2 = 8
- WORLD: 4 + 3 = 7
- CONFLICT: 3

`creativeGravity = CHARACTER` (score 8 > 7 > 3)

### 5.3 How Creative Gravity Is Used

Creative gravity flows into the Development phase in two ways:

1. **Starting dimension:** `PhaseState.development.lastActiveDimension` defaults to the creative gravity dimension when the user first enters Development. If gravity is null, it defaults to `CHARACTER` (per `Spec_DataModel.md` §5).

2. **Chat engine priming:** The Development chat engine's opening message references the creative gravity. For character gravity: "Your Discovery notes had a lot of energy around a character — want to start exploring who she is?" For world gravity: "Your ideas paint a vivid world — want to start defining where and when this story lives?" This is a suggestion, not a requirement — the user can talk about whatever they want.

---

## 6. Gap Analysis

Gap analysis maps the user's Discovery notes against the 41 default Concept Types to identify which creative dimensions are represented and which have gaps.

### 6.1 Purpose

The gap analysis is **internal-only** — it is never shown to the user directly. It feeds into the Development chat engine's conversational strategy, giving the AI a prioritized understanding of what the user has already explored (don't re-ask) and what's unexplored (weave into conversation naturally).

### 6.2 Analysis Structure

```typescript
interface GapAnalysis {
  represented: ConceptTypeMapping[];    // Concept Types the notes touch on
  unrepresented: string[];              // codeKeys of default Concept Types with no note coverage
}

interface ConceptTypeMapping {
  conceptTypeCodeKey: string;           // e.g., "timePeriod", "motivation"
  dimension: Dimension;                 // which dimension this type belongs to
  confidence: "STRONG" | "PARTIAL";     // how clearly the notes address this type
  sourceNoteIds: string[];              // dnote_ IDs that contributed to this mapping
}
```

**Confidence levels:**
- `STRONG` — one or more notes directly address this concept type. Example: a note saying "Set in 1820s France" maps strongly to "Time Period."
- `PARTIAL` — one or more notes hint at this concept type but don't define it. Example: a note about "crumbling mansion" partially addresses "Architecture — Exterior" but doesn't fully define the world's architectural style.

### 6.3 How Gap Analysis Is Used

The Development chat engine (`Spec_ChatEngine.md`) reads the gap analysis to:

1. **Avoid redundancy.** If "Time Period" is `STRONG`, the AI doesn't ask "When does your story take place?" — the user already answered that.
2. **Explore partial coverage.** If "Architecture — Exterior" is `PARTIAL`, the AI might naturally say "You mentioned a crumbling mansion — tell me more about what the buildings look like in this world."
3. **Surface gaps organically.** If "Motivation" is unrepresented, the AI doesn't say "You haven't defined a motivation." Instead, during a character conversation, it might ask "What drives her? What does she want more than anything?"
4. **Prioritize by creative gravity.** Gaps in the dominant dimension are surfaced first. If gravity is Character, character-related gaps (Motivation, Fear/Weakness, Voice & Speech) are prioritized over World gaps.

### 6.4 Storage

The gap analysis is stored on the `PhaseState.discovery` object. This requires an addition to the Data Model:

```typescript
// Addition to PhaseState.discovery (see Spec_DataModel.md §5)
discovery: {
  status: "IN_PROGRESS" | "CONSOLIDATED";
  clusters: DiscoveryCluster[];
  creativeGravity: Dimension | null;
  gapAnalysis: GapAnalysis | null;       // null before consolidation
}
```

---

## 7. Discovery Chat Behavior

The chat panel during Discovery serves two purposes: stream-of-consciousness extraction (§3.2) and brainstorming partnership (§3.3). The chat engine's phase-adaptive behavior for Discovery is defined here; the full chat engine spec (`Spec_ChatEngine.md`) will reference this section.

### 7.1 Discovery System Prompt

The AI's system prompt during Discovery includes:

- **Role:** "You are a creative brainstorming partner. Your job is to help the user get ideas out of their head, not to organize or judge them."
- **Extraction behavior:** "When the user shares creative content (scenes, characters, settings, moods, conflicts), identify discrete ideas and return them as separate notes."
- **Brainstorming behavior:** "When the user asks questions or requests ideas, respond conversationally. Do not create notes from your own suggestions — only from the user's expressed ideas."
- **Tone:** Curious, encouraging, non-judgmental. Match the user's energy. Short responses preferred — the canvas is the star, not the chat.
- **Constraints:** "Do not use Concept Type labels. Do not mention 'World', 'Character', or 'Conflict' as categories. Do not impose any structure. Discovery is freeform."

### 7.2 Chat Message Scoping

All chat messages during Discovery are stored with `phase: DISCOVERY` on the `ChatMessage` entity (see `Spec_DataModel.md` §11). When the user is in Discovery, only Discovery-phase messages are shown in the chat panel. Development and Refinement messages are not visible.

### 7.3 Note References in Chat

When the AI extracts notes from a stream-of-consciousness message, the `ChatMessage` does not populate `conceptIds` (those are for Concepts, which don't exist in Discovery). Instead, the relationship between a chat message and the notes it generated is tracked via the notes' `createdAt` timestamps and the message's `createdAt` — they share the same timestamp within a reasonable tolerance (< 1 second).

**Future consideration:** If explicit message-to-note linking becomes necessary, a `noteIds: string[]` field could be added to `ChatMessage`. Deferred to avoid over-engineering in v1.

---

## 8. Edge Cases & Rules

### Note creation
- **Empty note on edit-end:** If a user places a note and then taps away without typing anything, the note is deleted automatically. Zero-content notes are never persisted.
- **Very long note content:** No enforced character limit in v1. The Design Spec may visually truncate with expand-on-tap. The data model stores the full content.
- **Rapid placement:** If the user places notes faster than the persistence layer can save, the save queue handles batching (per `Spec_DataPersistence.md` §3 — 500ms debounce).

### Stream-of-consciousness extraction
- **Very short input:** A message under 10 words is unlikely to contain multiple extractable ideas. The AI should respond conversationally (brainstorming mode) unless the short message is clearly a creative fragment (e.g., "A woman on a horse at sunset").
- **No extractable ideas:** If the user types something like "I don't know what to write" or "help me get started," the AI responds with brainstorming prompts — no notes created.
- **Duplicate ideas:** If the user's stream-of-consciousness repeats an idea already on a note, the AI should still extract it as a new note. Deduplication is the user's job during review, not the AI's during extraction. Over-extracting is better than missing ideas.

### Consolidation
- **Fewer than 3 notes:** Consolidation button is disabled. Message: "Add a few more ideas before consolidating."
- **Very large note count (100+):** The consolidation API call may take longer. The UI should show a loading state. The AI should still attempt full consolidation — no arbitrary cap on note count.
- **All notes are similar:** The AI may produce a single cluster. This is valid. Creative gravity for that cluster's dimension is the gravity.
- **Notes are wildly diverse:** The AI may produce many small clusters or a large "Miscellaneous" cluster. Both are valid. The user can re-consolidate after editing notes.
- **Re-consolidation with zero new notes:** If the user returns to Discovery, changes nothing, and re-consolidates, the results may differ slightly (AI non-determinism) but should be broadly similar. This is expected behavior.

### Phase interaction
- **Returning to Discovery from Development:** `PhaseState.discovery.status` reverts to `IN_PROGRESS`. Existing notes and cluster borders remain visible. The user can add new notes. Existing cluster assignments persist visually until the user re-consolidates.
- **Data from Development preserved:** Returning to Discovery does not delete any Concepts, ConceptVersions, or ChatMessages created during Development. Phase regression is non-destructive (per `Spec_DataModel.md` §16).

---

## 9. Relationship to Other Systems

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| `Spec_DataModel.md` | Reads/writes DiscoveryNote, PhaseState (discovery sub-object), ChatMessage entities | §2, §4, §5, §6 |
| `Spec_DataPersistence.md` | Persists notes on creation/edit/drag-end/deletion. Persists PhaseState after consolidation. | §2.2, §2.3, §4.2 |
| `Spec_Navigation.md` | Triggers phase transition from Discovery to Development after consolidation review. Handles regression from Development back to Discovery. | §4.6 |
| `Spec_ChatEngine.md` | Provides the AI extraction and brainstorming behaviors during Discovery. Consumes the Discovery system prompt (§7.1). Consumes gap analysis for Development chat strategy. | §3.2, §3.3, §6.3, §7 |
| `Spec_Discovery_Design.md` | Renders the canvas, notes, clusters, and chat panel. Consumes all layout constants (§4.4). | §2, §3, §4.4, §4.5 |
| `Spec_ImageGeneration.md` | Images can be attached to DiscoveryNotes (optional enrichment). | §2 (via DataModel §6) |

**No direct interaction:**
- `Spec_Workspace_Design.md` — The workspace consumes the *results* of Discovery (creative gravity, gap analysis) via PhaseState, but does not interact with the Discovery Engine directly.
- `Spec_InsightsEngine.md` — The Insights Panel is inactive during Discovery. No insights are generated from Discovery Notes.
- `Spec_Export.md` / `Spec_MCPServer.md` — Discovery Notes are not exported or exposed via MCP in v1. Only Concepts (created in Development) are exportable.

---

## 10. Data Model Additions

### Addition to PhaseState (extends `Spec_DataModel.md` §5)

```typescript
interface PhaseState {
  // ... existing fields ...
  discovery: {
    status: "IN_PROGRESS" | "CONSOLIDATED";
    clusters: DiscoveryCluster[];
    creativeGravity: Dimension | null;
    gapAnalysis: GapAnalysis | null;       // NEW — null before consolidation
  };
}

// NEW — Gap analysis types
interface GapAnalysis {
  represented: ConceptTypeMapping[];
  unrepresented: string[];                 // codeKeys of unrepresented default Concept Types
}

interface ConceptTypeMapping {
  conceptTypeCodeKey: string;
  dimension: Dimension;
  confidence: "STRONG" | "PARTIAL";
  sourceNoteIds: string[];                 // dnote_ IDs
}
```

### No new entities

The Discovery Engine does not introduce new entities. It operates on existing entities from `Spec_DataModel.md`:
- `DiscoveryNote` (§6) — created, edited, positioned, clustered
- `PhaseState` (§5) — updated during consolidation
- `ChatMessage` (§11) — created during chat interactions
- `DiscoveryCluster` (nested in PhaseState) — populated during consolidation

---

## 11. Build Sequence (Preview)

### Phase 1 — Canvas core (no AI)

1. Implement note creation: factory function creates `DiscoveryNote` with position and empty content
2. Implement note editing: update content on edit-end, delete if empty
3. Implement note dragging: update position on drag-end
4. Implement note deletion: remove note, clean up cluster references if any
5. Write unit tests: note creation with correct ID prefix (`dnote_`), empty note cleanup, position updates

### Phase 2 — Chat integration (AI extraction + brainstorming)

1. Define the Discovery system prompt (§7.1)
2. Implement stream-of-consciousness extraction: send user message to API, parse `ExtractionResult`, create notes at random viewport positions
3. Implement brainstorming mode: send user message to API, display response in chat, no notes created
4. Implement intent detection: extraction vs. brainstorming classification
5. Write tests: extraction produces correct note count, brainstorming produces zero notes, ambiguous input defaults to brainstorming

### Phase 3 — Consolidation

1. Implement consolidation prompt construction: collect all note contents, format as numbered list
2. Implement consolidation API call: send to Anthropic API, parse `ConsolidationResult`
3. Implement cluster assignment: update each note's `clusterId`, populate `PhaseState.discovery.clusters`
4. Implement post-consolidation layout algorithm (§4.4)
5. Implement creative gravity calculation (§5.2)
6. Write tests: minimum note count enforcement (3), all notes assigned to clusters, gravity calculation with worked examples

### Phase 4 — Gap analysis

1. Implement gap analysis prompt (or extend consolidation prompt to include gap analysis)
2. Parse gap analysis results into `GapAnalysis` structure
3. Store gap analysis on PhaseState
4. Write tests: all 41 default types accounted for (represented + unrepresented), confidence levels assigned

### Phase 5 — Re-consolidation and review

1. Implement cluster label editing
2. Implement note-to-cluster reassignment (drag between clusters)
3. Implement note unclustering (drag to open canvas)
4. Implement re-consolidation: clear old clusters, run full consolidation on all notes
5. Write tests: re-consolidation replaces old clusters, cluster disappears when last note removed, PhaseState updates correctly

---

## 12. Out of Scope

- **Concept card creation.** Discovery Notes do not become Concept cards. Concepts are created in Development via the Chat Engine.
- **Concept Type assignment.** Discovery Notes have no Concept Type. The gap analysis identifies types internally but never labels individual notes.
- **Insights generation.** The Insights Panel is inactive during Discovery. No Suggestions, Connections, or Conflicts are generated from Discovery Notes.
- **Image generation.** Users can attach images to Discovery Notes (via `Spec_ImageGeneration.md`), but the Discovery Engine itself does not trigger image generation.
- **Export of Discovery Notes.** Discovery Notes are not included in .md or JSON exports. Only Concepts (from Development) are exportable.
- **Undo/redo.** No undo for note deletion, position changes, or consolidation in v1.
- **Multi-select.** No selecting multiple notes at once for batch operations in v1.
- **Canvas zoom.** Zoom is a Design Spec decision. The engine supports any viewport transformation — it only stores absolute positions.
- **Note color or tagging.** Discovery Notes have no color or tag system in v1. All notes look the same (aside from cluster assignment after consolidation).
- **Offline consolidation.** Consolidation requires an API call to the Anthropic API. No offline fallback.

---

## 13. Open Questions

1. **Gap analysis as separate API call or combined with consolidation:** Should gap analysis be part of the consolidation prompt (one API call) or a separate follow-up call? Combining is more efficient but makes the prompt longer and the response more complex. Recommend combining — to be confirmed during implementation.

2. **DiscoveryCluster promotion:** `Spec_DataModel.md` Open Question #3 asks whether `DiscoveryCluster` should be promoted from a nested object inside PhaseState to a full entity with its own ID prefix. This spec uses the nested approach (clusters live inside `PhaseState.discovery.clusters`). If consolidation becomes more complex (metadata per cluster, user annotations), promotion may be warranted. Deferred to implementation.

3. **Note-to-message linking:** §7.3 defers explicit linking between ChatMessages and the DiscoveryNotes they generated. If traceability becomes important (e.g., "show me the chat message that created this note"), a `sourceMessageId` field on DiscoveryNote or a `noteIds` field on ChatMessage would resolve this. Deferred to v2.

4. **Canvas panning bounds:** Should the canvas have any outer bounds (maximum extent the user can pan to), or is it truly infinite? Recommend: practically unbounded with a soft limit (e.g., ±50,000px) to prevent numerical precision issues. Design Spec decides the UX.

---

## 14. Files Affected (Summary)

| File Path | Change |
|-----------|--------|
| `src/engine/discovery/canvasManager.ts` | Note creation, editing, positioning, deletion |
| `src/engine/discovery/consolidation.ts` | Consolidation logic, cluster assignment, layout algorithm |
| `src/engine/discovery/creativeGravity.ts` | Gravity calculation from cluster dimensions |
| `src/engine/discovery/gapAnalysis.ts` | Gap analysis parsing and storage |
| `src/engine/discovery/extractionParser.ts` | Parse AI extraction results into DiscoveryNote entities |
| `src/engine/discovery/prompts.ts` | Discovery system prompt, consolidation prompt, extraction prompt |
| `src/models/types.ts` | Add `GapAnalysis`, `ConceptTypeMapping` interfaces; extend `PhaseState.discovery` |
| `src/engine/discovery/__tests__/` | Unit tests for all above |

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: [repo path] | Branch: main

Spec file: docs/discovery/Spec_DiscoveryEngine.md
→ Read this spec (v0.1) for canvas model, consolidation, creative gravity, and gap analysis.

Also read before starting:
- docs/HARD_RULES.md (non-negotiable constraints)
- docs/OVERVIEW.md (project context)
- docs/foundation/Spec_DataModel.md (entity definitions — DiscoveryNote, PhaseState, ChatMessage)
- docs/foundation/Spec_DataPersistence.md (save queue, debounce, atomic writes)

Follow the Build Sequence in §11, phase by phase.

Key constraints:
- All entities are plain objects (interfaces, not classes) — no methods, no prototypes (DataModel §15)
- Discovery Notes use dnote_ ID prefix, clusters use cluster_ prefix (DataModel §2)
- Notes placed via AI extraction are scattered randomly in the viewport with collision avoidance (§2.2)
- Consolidation requires minimum 3 notes (§4.1)
- Gap analysis is internal-only — never shown to the user (§6.1)
- Do NOT create Concept cards or assign Concept Types — that's the Chat Engine's job in Development

Start with: Phase 1 — implement canvas core functions in src/engine/discovery/canvasManager.ts
(note creation, editing, positioning, deletion) with unit tests.

Work phase by phase. After completing each phase, stop and check in before moving on.
Commit after each phase with a message like "feat(discovery): Phase 1 — canvas core".
```

---

*This spec defines the Discovery Engine's logic and data flow. For the visual design of the Discovery canvas — layout, interaction affordances, states, and styling — see `Spec_Discovery_Design.md`.*
