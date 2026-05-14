# Story Engine — Data Model Specification

**Systems Design & Data Architecture**

Version 0.2 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial draft. 7 entities, 35 default ConceptTypes, Builder enum, ID strategy, relationship graph. |
| **0.2** | **May 2026** | **Revised for PRD v0.3 pipeline model. Builder enum replaced by Dimension enum + Phase enum. Two new entities: DiscoveryNote and PhaseState. Default ConceptTypes reorganized: 11 World + 13 Character + 9 Conflict + 8 Storyline (41 total, up from 35). ChatMessage scoped by phase instead of builder. Project entity updated: `initialBuilder` removed, `currentPhase` added.** |

---

## 1. Overview

The data model defines the shape of every entity in Story Engine — how creative ideas are represented, versioned, linked, and persisted.

**Design principle: Plain objects, no magic.** Every entity is a TypeScript interface — not a class, not a model with methods. Entities are pure data: no prototypes, no getters, no computed properties. This makes JSON serialization trivial (what you `JSON.stringify` is exactly what gets saved to disk) and eliminates hidden state. If you need to compute something from an entity, write a standalone function that takes the entity as input.

**Consumer:** Every other system in Story Engine reads or writes these entities. The Chat Engine creates Concepts. The Workspace renders them as cards. The Insights Engine analyzes relationships across them. The Persistence layer serializes them to disk. The MCP Server exposes them to external tools.

**Scope boundary — this system does NOT:**
- Define how entities are saved to disk (see `Spec_DataPersistence.md`)
- Define how entities are displayed in the UI (see `Spec_Workspace_Design.md`, `Spec_Discovery_Design.md`)
- Define how the AI extracts Concepts from natural language (see `Spec_ChatEngine.md`)
- Implement entity creation, deletion, or relationship management logic (those are standalone functions that operate on these interfaces)

---

## 2. ID Strategy

Every entity has a unique `id` field using a **prefixed nanoid** format:

| Entity | Prefix | Example |
|--------|--------|---------|
| Project | `proj_` | `proj_V1StGjHk7` |
| DiscoveryNote | `dnote_` | `dnote_m3Kp9xW2` |
| Concept | `con_` | `con_x7YmN2pQ` |
| ConceptType | `ctype_` | `ctype_Rk3nW8vL` |
| ConceptVersion | `ver_` | `ver_pQ9mX1kN` |
| ChatMessage | `msg_` | `msg_kL7nR3wV` |
| Image | `img_` | `img_W2pQ9mX1` |
| Insight | `ins_` | `ins_nR3wV7kL` |
| PhaseState | `phase_` | `phase_x2Lm7kR` |

**Why prefixed:** When debugging, logging, or reading raw JSON, you instantly know what kind of entity an ID refers to. `con_x7YmN2pQ` is a Concept; `msg_kL7nR3wV` is a ChatMessage. No ambiguity.

**Nanoid config:** Use the `nanoid` npm package with default alphabet (A-Za-z0-9_-) and length 8 (after prefix). This gives ~10^14 possible IDs per prefix — no collision risk at Story Engine's scale.

**IDs are immutable.** Once an entity is created, its ID never changes. References between entities use ID strings, never object references.

---

## 3. Enums

### Dimension

Replaces the v0.1 `Builder` enum. Represents which creative dimension a Concept or ConceptType belongs to.

```typescript
type Dimension = "WORLD" | "CHARACTER" | "CONFLICT" | "STORYLINE";
```

| Code Value | Display Label | Phase Context |
|------------|--------------|---------------|
| `WORLD` | World | Available in Development + Refinement |
| `CHARACTER` | Character | Available in Development + Refinement |
| `CONFLICT` | Conflict | Available in Development. In Refinement, Conflict concepts persist but new Storyline types are added. |
| `STORYLINE` | Storyline | Available in Refinement only. These types emerge when conflict gets shaped into narrative structure. |

**Why four values instead of three:** "Conflict" and "Storyline" represent different levels of structure on the same creative material. During Development, the user explores tensions and stakes (Conflict). During Refinement, those tensions get shaped into narrative arcs, beats, and pacing (Storyline). The data model distinguishes them so the workspace can show the right Concept Types at the right phase.

### Phase

Represents which phase of the creative pipeline a project is in.

```typescript
type Phase = "DISCOVERY" | "DEVELOPMENT" | "REFINEMENT" | "PRODUCTION";
```

| Code Value | Display Label | Primary Activity |
|------------|--------------|------------------|
| `DISCOVERY` | Discovery | Freeform ideation, note placement, consolidation |
| `DEVELOPMENT` | Development | Structured exploration, concept extraction, dimension development |
| `REFINEMENT` | Refinement | Narrative shaping, storyline structuring, consistency checking |
| `PRODUCTION` | Production Handoff | Export, MCP Server, readiness review |

### InsightType

```typescript
type InsightType = "SUGGESTION" | "CONNECTION" | "CONFLICT";
```

Note: `CONFLICT` as an InsightType (a contradiction between concepts) is different from `CONFLICT` as a Dimension (the creative dimension of tensions/stakes). Context always disambiguates — InsightType appears only on Insight entities, Dimension appears on Concepts and ConceptTypes.

### InsightStatus

```typescript
type InsightStatus = "PENDING" | "ACCEPTED" | "DISMISSED";
```

State machine: `PENDING` → `ACCEPTED` or `PENDING` → `DISMISSED`. One-way transitions only. An accepted or dismissed insight cannot return to pending.

### ImageSource

```typescript
type ImageSource = "GENERATED" | "UPLOADED";
```

### ChatRole

```typescript
type ChatRole = "user" | "assistant";
```

Lowercase to match the Anthropic API convention.

---

## 4. Entity: Project

The root container. Every entity in Story Engine belongs to exactly one Project.

### Fields

```typescript
interface Project {
  id: string;                    // proj_[nanoid] — unique identifier
  name: string;                  // user-facing project name (e.g., "1820s France Story")
  description: string;           // optional longer description, can be empty string
  currentPhase: Phase;           // which pipeline phase the project is currently in
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp — cascades from any child change
}
```

### Key behaviors

- **`name` is required, `description` is optional.** Name must be non-empty (minimum 1 character after trimming). Description can be empty string. Both are shown in the project list on the Start Screen.
- **`currentPhase` defaults to `DISCOVERY` on project creation.** This is always the starting phase — the user never picks a starting dimension (that was the v0.2 `initialBuilder` behavior, now removed).
- **`updatedAt` cascades.** Any change to any entity within the project (new Concept, new DiscoveryNote, edited version, new chat message, etc.) updates the Project's `updatedAt`. Used for sorting the project list by "last modified."
- **Deleting a project deletes everything inside it:** all DiscoveryNotes, Concepts, ConceptTypes, ConceptVersions, ChatMessages, Images, Insights, and PhaseState. No "soft delete" or trash in v1.

### Project contains (summary)

| Entity | Relationship | Typical Count |
|--------|-------------|---------------|
| PhaseState | One per project | 1 |
| DiscoveryNote | Created during Discovery | 10s to 100s |
| ConceptType | Seeded on creation + user/AI additions | 41 defaults + custom |
| Concept | Created via chat or manually | 10s to 100s |
| ConceptVersion | At least 1 per Concept | 1–5 per Concept |
| ChatMessage | Appended during conversation | 10s to 100s per phase |
| Image | Attached to Concepts or Discovery Notes | 0–3 per Concept |
| Insight | Generated by Insights Engine | 0–50 per project |

---

## 5. Entity: PhaseState

Tracks the current state of each pipeline phase within a project. This is where phase-specific metadata lives — what's been consolidated in Discovery, which dimension was last active in Development, etc.

### Fields

```typescript
interface PhaseState {
  id: string;                    // phase_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project
  discovery: {
    status: "IN_PROGRESS" | "CONSOLIDATED";
    clusters: DiscoveryCluster[];       // thematic groupings from consolidation
    creativeGravity: Dimension | null;  // detected primary dimension, null before consolidation
  };
  development: {
    lastActiveDimension: Dimension;     // which dimension the user was last working in
  };
  refinement: {
    // Placeholder for future Refinement-specific state (e.g., storyline completeness tracking)
  };
  production: {
    // Placeholder for future Production-specific state (e.g., export history)
  };
}

interface DiscoveryCluster {
  id: string;                    // cluster_[nanoid]
  label: string;                 // AI-generated or user-edited cluster name
  noteIds: string[];             // dnote_ IDs belonging to this cluster
}
```

### Key behaviors

- **One PhaseState per project.** Created when the project is created. Never deleted independently — only when the project is deleted.
- **`discovery.status` tracks consolidation.** Starts as `IN_PROGRESS`. Moves to `CONSOLIDATED` when the user completes the consolidation review. Can move back to `IN_PROGRESS` if the user returns to Discovery and adds new notes.
- **`discovery.creativeGravity` is set during consolidation.** The AI analyzes which dimension received the most energy and sets this. It can be `null` before consolidation or if no clear gravity is detected.
- **`development.lastActiveDimension` defaults to the creative gravity dimension** if one was detected, otherwise defaults to `CHARACTER` (as a reasonable starting point).

---

## 6. Entity: DiscoveryNote

A raw creative fragment placed on the Discovery canvas. Unstructured by design — no Concept Type, no dimension assignment, no version history.

### Fields

```typescript
interface DiscoveryNote {
  id: string;                    // dnote_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project
  content: string;               // the raw text of the note
  position: { x: number; y: number };  // canvas position for spatial layout
  imageId: string | null;        // optional image attachment (img_[nanoid] or null)
  clusterId: string | null;      // cluster assignment from consolidation (null before consolidation)
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors

- **Discovery Notes are not Concepts.** They have no Concept Type, no dimension, no version history. They are intentionally unstructured. This enforces the PRD principle: "Don't impose organization before the user is ready."
- **Discovery Notes do not become Concepts automatically.** When the user moves to Development, the AI may reference Discovery Note content when extracting Concepts, but the notes themselves remain as-is on the Discovery canvas. They are a record of the ideation phase.
- **Position is spatial.** Unlike Concept card positions (which are also spatial), Discovery Note positions represent placement on a freeform canvas — more like post-its on a wall than cards in a grid.
- **`clusterId` is assigned during consolidation.** Before consolidation, all notes have `clusterId: null`. The AI assigns cluster IDs during consolidation, and the user can reassign them during review.
- **Image attachment is optional.** A Discovery Note can have one image (a mood board reference, a visual spark). The Image entity (§10) is reused — same structure whether attached to a Concept or a DiscoveryNote.

---

## 7. Entity: ConceptType

A labeled category representing a dimension of a World, Character, Conflict, or Storyline. "Time Period", "Fashion Style", and "Central Conflict" are all Concept Types.

### Fields

```typescript
interface ConceptType {
  id: string;                    // ctype_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project
  label: string;                 // display name, Title Case with spaces (e.g., "Time Period")
  description: string;           // brief explanation of what this type captures
  dimension: Dimension;          // WORLD | CHARACTER | CONFLICT | STORYLINE
  isDefault: boolean;            // true if built-in, false if user/AI-created
  createdAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors

- **Default types are seeded per project.** When a new project is created, the default Concept Types for all four dimensions are generated and stored. See §14 for the full list.
- **Default and custom types are identical in behavior.** The `isDefault` flag is metadata for potential future features (like "reset to defaults"). It does not affect how the type works. This enforces HARD_RULES: "Concept Types are first-class."
- **The label field is the display name.** It appears on card headers, in export files, and in MCP Server responses. Always Title Case with spaces.
- **Concept Types are scoped to a project.** Two different projects can each have a "Time Period" type — they are separate entities with separate IDs.
- **A Concept Type belongs to exactly one dimension.** The same label could exist in multiple dimensions as separate ConceptType entities if relevant.
- **Deleting a ConceptType is only allowed if no Concepts of that type exist.** If Concepts exist, the user must delete or reassign them first.

---

## 8. Entity: Concept

A single extracted creative idea. This is what appears as a card in the workspace.

### Fields

```typescript
interface Concept {
  id: string;                    // con_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project
  conceptTypeId: string;         // ctype_[nanoid] — which ConceptType this is an instance of
  dimension: Dimension;          // WORLD | CHARACTER | CONFLICT | STORYLINE
  currentVersionId: string;      // ver_[nanoid] — points to the active version
  versions: ConceptVersion[];    // all versions, ordered by versionNumber ascending
  relatedConceptIds: string[];   // con_[nanoid] IDs of related concepts (co-extracted, cross-dimension links)
  sourceMessageId: string | null; // msg_[nanoid] of the chat message that created this concept (null if manual)
  imageIds: string[];            // img_[nanoid] IDs of attached images
  position: { x: number; y: number };  // workspace card position
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors

- **A Concept always has at least one ConceptVersion.** Creating a Concept and creating its first version is a single atomic operation. A Concept with zero versions is invalid.
- **`currentVersionId` points to the active version.** Typically the latest, but the user could browse to an older version and pin it as current.
- **`dimension` is denormalized.** It matches the `dimension` of the linked ConceptType. This redundancy allows filtering by dimension without joining to ConceptType on every render.
- **Position is workspace-relative.** Persisted on drag-end only (per `Spec_DataPersistence.md`).

### Cross-dimension concepts

Some concepts span dimensions (e.g., "Socioeconomic Class" could be both World and Character). In v1, this is handled by creating **separate Concept instances** in each relevant dimension, linked via `relatedConceptIds`. A single Concept entity always belongs to exactly one dimension.

**Why not shared ownership:** Shared ownership creates ambiguity about which dimension's workspace shows the card, which chat history it traces to, and how versions diverge per dimension. Separate instances linked by `relatedConceptIds` is simpler.

---

## 9. Entity: ConceptVersion

A snapshot of a concept's content at a point in time. Supports two change modes: in-place edits (updating the existing version) and new versions (creating a fresh version for major rethinks).

### Fields

```typescript
interface ConceptVersion {
  id: string;                    // ver_[nanoid] — unique identifier
  conceptId: string;             // con_[nanoid] — which concept this version belongs to
  versionNumber: number;         // sequential: 1, 2, 3, ... — never reused
  value: string;                 // the concept's content (e.g., "1820s" for a Time Period concept)
  sourceMessageId: string | null; // msg_[nanoid] of the message that created/edited this version
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors

- **Two change modes:**
  - **In-place edit:** Updates the `value` and `updatedAt` of the existing ConceptVersion. For small refinements ("make her taller"). Does not create a new version.
  - **New version:** Creates a new ConceptVersion with `versionNumber` incremented. For major rethinks ("actually, she's a warrior, not a painter"). The old version is preserved.
- **The user decides which mode.** The system never auto-creates versions. Per HARD_RULES: "Concept versioning is user-initiated."
- **Version numbers are sequential and never reused.** If v1, v2, v3 exist and v2 is deleted, the next version is v4 — not v2.
- **All versions are preserved and browsable.** The workspace shows the current version by default, with the ability to browse history.

---

## 10. Entity: Image

A visual reference attached to a Concept or a Discovery Note. Can be AI-generated or user-uploaded.

### Fields

```typescript
interface Image {
  id: string;                    // img_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project
  attachedToId: string;          // con_[nanoid] or dnote_[nanoid] — what this image is attached to
  attachedToType: "CONCEPT" | "DISCOVERY_NOTE";  // disambiguates the attachedToId
  source: ImageSource;           // GENERATED | UPLOADED
  generationPrompt: string | null; // the DALL-E prompt used (null for uploaded images)
  filePath: string;              // relative path within the project's images/ folder
  mimeType: string;              // e.g., "image/png", "image/jpeg"
  width: number;                 // pixels
  height: number;                // pixels
  createdAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors (v0.2 changes)

- **Images can now attach to Discovery Notes or Concepts.** In v0.1, images only attached to Concepts. The `attachedToId` + `attachedToType` pair replaces the old `conceptId` field.
- **One image can only be attached to one entity.** If the same visual reference is needed on two cards, it must be uploaded/generated twice as separate Image entities.
- **Image files live in the project folder.** Stored in the `images/` subfolder per `Spec_DataPersistence.md`.
- **Deleting the parent entity deletes its images.** Deleting a Concept deletes all its Images. Deleting a DiscoveryNote deletes its Image (if any).

---

## 11. Entity: ChatMessage

A single message in the conversation. Chat history is continuous within a project but tagged by phase.

### Fields

```typescript
interface ChatMessage {
  id: string;                    // msg_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project
  phase: Phase;                  // DISCOVERY | DEVELOPMENT | REFINEMENT | PRODUCTION
  role: ChatRole;                // "user" | "assistant"
  content: string;               // the message text
  conceptIds: string[];          // con_[nanoid] IDs of concepts created or modified by this message
  createdAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors (v0.2 changes)

- **Scoped by phase, not by dimension.** In v0.1, messages were scoped by Builder (WORLD, CHARACTER, STORYLINE). In v0.2, they are scoped by Phase. During Development, the user's chat may touch multiple dimensions in a single conversation — the chat is not split per dimension.
- **Chat history is append-only.** Messages are never edited or deleted in v1. The full conversation is a permanent record.
- **`conceptIds` supports traceability.** Every concept can be traced back to the chat message that created it. This enforces the design principle: "Show your work."
- **Discovery phase messages are brainstorming chat.** During Discovery, chat messages may exist if the user uses the AI brainstorming partner, but they don't generate Concepts (those only appear in Development).

---

## 12. Entity: Insight

An AI-generated observation surfaced in the Insights Panel. References one or more Concepts across dimensions.

### Fields

```typescript
interface Insight {
  id: string;                    // ins_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project
  type: InsightType;             // SUGGESTION | CONNECTION | CONFLICT
  title: string;                 // short summary shown in the Insights Panel
  description: string;           // detailed explanation
  referencedConceptIds: string[]; // con_[nanoid] IDs — which concepts this insight is about
  status: InsightStatus;         // PENDING | ACCEPTED | DISMISSED
  createdAt: string;             // ISO 8601 timestamp
  resolvedAt: string | null;     // ISO 8601 timestamp — when status changed from PENDING (null if still pending)
}
```

### Key behaviors

- **Insights reference Concepts, not Discovery Notes.** The Insights Panel is inactive during Discovery. It begins surfacing insights during Development and runs fully during Refinement.
- **Status is a one-way state machine.** `PENDING` → `ACCEPTED` or `PENDING` → `DISMISSED`. No going back. `resolvedAt` is set when the transition happens.
- **Dismissed insights remain in the data model.** They are not deleted — just hidden from the active Insights Panel view. This preserves the analytical history.

---

## 13. Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                          PROJECT                             │
│  id, name, description, currentPhase                         │
│                                                              │
│  ┌─────────────┐     ┌─────────────────┐                    │
│  │ PHASE       │     │ DISCOVERY       │                    │
│  │ STATE       │     │ NOTE            │                    │
│  │             │     │                 │                    │
│  │ discovery:  │     │ content         │                    │
│  │  clusters   │     │ position        │                    │
│  │  gravity    │     │ clusterId       │                    │
│  │ development:│     │ imageId ────────┼───┐                │
│  │  lastDim    │     └─────────────────┘   │                │
│  └─────────────┘                           │                │
│                                            ▼                │
│  ┌─────────────┐     ┌─────────────────┐ ┌──────────┐      │
│  │ CONCEPT     │     │ CONCEPT TYPE    │ │ IMAGE    │      │
│  │ TYPE        │────▶│                 │ │          │      │
│  │             │     │ label           │ │ source   │      │
│  │             │     │ dimension       │ │ filePath │      │
│  │             │     │ isDefault       │ └──────────┘      │
│  └─────────────┘     └─────────────────┘       ▲           │
│        │                                        │           │
│        │ conceptTypeId                          │           │
│        ▼                                        │           │
│  ┌─────────────┐     ┌─────────────────┐       │           │
│  │ CONCEPT     │────▶│ CONCEPT VERSION │       │           │
│  │             │     │                 │       │           │
│  │ dimension   │     │ versionNumber   │       │           │
│  │ position    │     │ value           │       │           │
│  │             │     └─────────────────┘       │           │
│  │ imageIds ───┼───────────────────────────────┘           │
│  │             │                                            │
│  │ relatedConceptIds ──▶ (other Concepts)                  │
│  │ sourceMessageId ──▶ ┌──────────────┐                    │
│  └─────────────┘       │ CHAT MESSAGE │                    │
│                        │              │                    │
│  ┌─────────────┐       │ phase        │                    │
│  │ INSIGHT     │       │ role         │                    │
│  │             │       │ conceptIds   │                    │
│  │ type        │       └──────────────┘                    │
│  │ status      │                                            │
│  │ referencedConceptIds ──▶ (Concepts)                     │
│  └─────────────┘                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 14. Default ConceptType Definitions

When a new project is created, the following default ConceptTypes are seeded. **41 defaults total:** 11 World + 13 Character + 9 Conflict + 8 Storyline.

### World Dimension (11 defaults)

| Label | Description | Code Key |
|-------|------------|----------|
| Time Period | When the world exists | `timePeriod` |
| Location | Where the world exists (macro and micro) | `location` |
| Visual Style | The overall aesthetic language | `visualStyle` |
| Architecture — Exterior | Building exteriors, cityscapes, skylines | `architectureExterior` |
| Architecture — Interior | Interior spaces, furnishing style | `architectureInterior` |
| Natural Environment | Landscape, climate, weather, flora, fauna | `naturalEnvironment` |
| Key Objects | Significant objects in the world | `keyObjects` |
| Transportation | How people and things move | `transportation` |
| Technology Level | What technology exists and how it's used | `technologyLevel` |
| Social Structure | How society is organized | `socialStructure` |
| Atmosphere / Mood | The emotional texture of the world | `atmosphereMood` |

### Character Dimension (13 defaults)

| Label | Description | Code Key |
|-------|------------|----------|
| Gender | Gender identity and presentation | `gender` |
| Age | Age or age range | `age` |
| Physical Build | Height, weight, body type | `physicalBuild` |
| Facial Features | Face shape, eyes, hair, distinguishing marks | `facialFeatures` |
| Fashion Style | Clothing, accessories, aesthetic | `fashionStyle` |
| Voice & Speech | How they sound and how they talk | `voiceSpeech` |
| Personality Trait | Psychological characteristics | `personalityTrait` |
| Behavioral Pattern | How they act in the world | `behavioralPattern` |
| Knowledge & Education | What they know and how they learned it | `knowledgeEducation` |
| Motivation | What drives them | `motivation` |
| Fear / Weakness | What limits or threatens them | `fearWeakness` |
| Relationship Role | How they relate to other characters | `relationshipRole` |
| Background | Origin story, key life events | `background` |

### Conflict Dimension (9 defaults)

These are available during Development and persist into Refinement.

| Label | Description | Code Key |
|-------|------------|----------|
| Central Conflict | The core tension driving the story | `centralConflict` |
| Internal Conflict | Tension within a character | `internalConflict` |
| Interpersonal Conflict | Tension between characters | `interpersonalConflict` |
| Societal Conflict | Tension between characters and the world | `societalConflict` |
| Stakes | What's at risk | `stakes` |
| Catalyst | What sets the conflict in motion | `catalyst` |
| Escalation | How tension increases over time | `escalation` |
| Theme | The abstract ideas the story explores | `theme` |
| Subtext | What's being said beneath the surface | `subtext` |

### Storyline Dimension (8 defaults)

These are added to the workspace when the user enters Refinement. They represent the narrative structure that shapes raw conflict into story.

| Label | Description | Code Key |
|-------|------------|----------|
| Story Arc | The macro shape of the narrative | `storyArc` |
| Plot | The sequence of major events | `plot` |
| Plot Twist | Surprising revelations or reversals | `plotTwist` |
| Sub-plot | Secondary narrative threads | `subPlot` |
| Conflict Type | The nature of the central tension (synthesis of Conflict dimension) | `conflictType` |
| Tone | The narrative voice and feel | `tone` |
| Pacing | How time moves in the story | `pacing` |
| Narrative POV | Whose perspective the story is told from | `narrativePov` |

---

## 15. Architectural Rules

These rules apply across the entire data model and cannot be overridden by individual entity behaviors:

1. **All entities are plain objects.** Interfaces, not classes. No methods, no prototypes, no getters/setters. Pure data.
2. **All timestamps are ISO 8601 strings.** Never `Date` objects. `"2026-05-13T14:30:00.000Z"` — always UTC, always millisecond precision.
3. **No circular references.** Entities reference each other by ID string only. The relationship graph is fully serializable as flat JSON.
4. **IDs are strings, always prefixed.** Never numeric, never UUID, never bare nanoid. The prefix is part of the ID.
5. **A new Concept must always have exactly one ConceptVersion.** Concept creation and first-version creation are atomic.
6. **Enum values use SCREAMING_SNAKE_CASE.** `WORLD`, `CHARACTER`, `CONFLICT`, `STORYLINE`, `DISCOVERY`, `DEVELOPMENT`, `REFINEMENT`, `PRODUCTION`, `SUGGESTION`, `CONNECTION`, `CONFLICT` (insight type), `PENDING`, `ACCEPTED`, `DISMISSED`, `GENERATED`, `UPLOADED`.
7. **Object keys use camelCase.** `projectId`, `conceptTypeId`, `versionNumber`, `relatedConceptIds`.

---

## 16. Edge Cases & Rules

### Creation edge cases

- **Empty project:** A newly created project has 41 default ConceptTypes, one PhaseState, zero DiscoveryNotes, zero Concepts, zero ChatMessages, zero Images, zero Insights. This is a valid state.
- **Concept with no image:** Valid and expected. Most concepts start without images.
- **Concept created manually (not via chat):** Valid. The `sourceMessageId` is null.
- **ConceptType with no Concepts:** Valid. Default types exist before any concepts are created.
- **Discovery Note with no cluster:** Valid before consolidation. All notes have `clusterId: null` initially.
- **Discovery Note with no image:** Valid and expected. Most notes are text-only.

### Deletion rules

- **Deleting a Concept** deletes all its ConceptVersions and Images. It also removes the Concept's ID from:
  - `relatedConceptIds` on any related Concepts
  - `conceptIds` on any ChatMessages that reference it
  - `referencedConceptIds` on any Insights that reference it
- **Deleting a ConceptType** is only allowed if no Concepts of that type exist.
- **Deleting a DiscoveryNote** deletes its Image (if any) and removes its ID from any DiscoveryCluster `noteIds`.
- **Deleting a Project** deletes everything. Irreversible in v1.
- **ChatMessages cannot be deleted individually.** Append-only.
- **Insights can be dismissed but not deleted.** `status: DISMISSED` hides them from the active panel.

### Phase-related rules

- **DiscoveryNotes are only created during the Discovery phase.** If the user returns to Discovery from Development, they can add new notes.
- **Concepts are only created during Development or Refinement.** The system never auto-creates Concepts from DiscoveryNotes — the AI references note content but concept creation is explicit.
- **Storyline ConceptTypes are only available in Refinement.** The workspace shows World + Character + Conflict types in Development, and adds Storyline types when the user enters Refinement.
- **Phase regression is allowed.** Moving backward from Development to Discovery, or from Refinement to Development, is a valid operation. The data from later phases is preserved — it's not deleted on regression.

---

## 17. Relationship to Other Systems

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| `Spec_DataPersistence.md` | Serializes all entities to `project.json` | §4–§12 (all entities) |
| `Spec_Navigation.md` | Uses Phase enum for phase transitions, Project entity for routing | §3, §4 |
| `Spec_DiscoveryEngine.md` | Creates DiscoveryNotes, populates DiscoveryClusters, sets creativeGravity | §5, §6 |
| `Spec_ChatEngine.md` | Creates Concepts, ConceptVersions, ChatMessages. References ConceptTypes. | §7–§9, §11 |
| `Spec_Workspace_Design.md` | Renders Concepts as cards, uses Dimension for filtering, uses Phase for behavior | §3, §8 |
| `Spec_InsightsEngine.md` | Creates Insights referencing Concepts | §12 |
| `Spec_ImageGeneration.md` | Creates Images attached to Concepts or DiscoveryNotes | §10 |
| `Spec_Export.md` | Reads all entities for export generation | §4–§12 |
| `Spec_MCPServer.md` | Exposes Concepts and ConceptTypes as queryable resources | §7, §8 |

**No direct interaction:**
- `Spec_StartScreen_Design.md` — reads Project list but doesn't interact with entity internals.
- `Spec_InsightsPanel_Design.md` — renders Insight entities but doesn't modify the data model.

---

## 18. Data Model (Complete Reference)

All interfaces consolidated for quick reference:

```typescript
// --- Enums ---

type Dimension = "WORLD" | "CHARACTER" | "CONFLICT" | "STORYLINE";
type Phase = "DISCOVERY" | "DEVELOPMENT" | "REFINEMENT" | "PRODUCTION";
type InsightType = "SUGGESTION" | "CONNECTION" | "CONFLICT";
type InsightStatus = "PENDING" | "ACCEPTED" | "DISMISSED";
type ImageSource = "GENERATED" | "UPLOADED";
type ChatRole = "user" | "assistant";

// --- Entities ---

interface Project {
  id: string;
  name: string;
  description: string;
  currentPhase: Phase;
  createdAt: string;
  updatedAt: string;
}

interface PhaseState {
  id: string;
  projectId: string;
  discovery: {
    status: "IN_PROGRESS" | "CONSOLIDATED";
    clusters: DiscoveryCluster[];
    creativeGravity: Dimension | null;
  };
  development: {
    lastActiveDimension: Dimension;
  };
  refinement: {};
  production: {};
}

interface DiscoveryCluster {
  id: string;
  label: string;
  noteIds: string[];
}

interface DiscoveryNote {
  id: string;
  projectId: string;
  content: string;
  position: { x: number; y: number };
  imageId: string | null;
  clusterId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConceptType {
  id: string;
  projectId: string;
  label: string;
  description: string;
  dimension: Dimension;
  isDefault: boolean;
  createdAt: string;
}

interface Concept {
  id: string;
  projectId: string;
  conceptTypeId: string;
  dimension: Dimension;
  currentVersionId: string;
  versions: ConceptVersion[];
  relatedConceptIds: string[];
  sourceMessageId: string | null;
  imageIds: string[];
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}

interface ConceptVersion {
  id: string;
  conceptId: string;
  versionNumber: number;
  value: string;
  sourceMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  projectId: string;
  phase: Phase;
  role: ChatRole;
  content: string;
  conceptIds: string[];
  createdAt: string;
}

interface Image {
  id: string;
  projectId: string;
  attachedToId: string;
  attachedToType: "CONCEPT" | "DISCOVERY_NOTE";
  source: ImageSource;
  generationPrompt: string | null;
  filePath: string;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
}

interface Insight {
  id: string;
  projectId: string;
  type: InsightType;
  title: string;
  description: string;
  referencedConceptIds: string[];
  status: InsightStatus;
  createdAt: string;
  resolvedAt: string | null;
}
```

---

## 19. Build Sequence (Preview)

### Phase 1 — Core types and factory functions

1. Define all TypeScript interfaces, enums, and the Dimension/Phase types
2. Create factory functions for each entity (e.g., `createConcept(...)`, `createProject(...)`, `createDiscoveryNote(...)`) that handle ID generation and timestamp setting
3. Write unit tests for factory functions, verifying:
   - IDs use correct prefixes (including new `dnote_` and `phase_` prefixes)
   - Timestamps are valid ISO 8601
   - A new Concept always has exactly one ConceptVersion
   - A new Project has 41 default ConceptTypes and one PhaseState with `currentPhase: DISCOVERY`

### Phase 2 — Relationship helpers

1. Create helper functions for relationship operations:
   - `addVersionToConcept(concept, version)` — appends version and updates `currentVersionId`
   - `attachImageToConcept(concept, image)` — appends image ID
   - `attachImageToNote(note, image)` — sets the image ID
   - `linkRelatedConcepts(conceptA, conceptB)` — adds IDs to each other's `relatedConceptIds`
   - `assignNoteToCluster(note, cluster)` — sets `clusterId` and adds to cluster's `noteIds`
2. Write unit tests for relationship integrity:
   - Adding a version increments `versionNumber` correctly
   - `relatedConceptIds` is symmetrical
   - Deleting a concept cleans up all references
   - Cluster assignment is bidirectional

### Phase 3 — Default ConceptType seeding

1. Create the default ConceptType data for all four dimensions (41 types total)
2. Implement `seedDefaultConceptTypes(projectId)` that generates all defaults
3. Write tests verifying: correct count per dimension (11+13+9+8), all labels unique within a dimension, all have `isDefault: true`

### Phase 4 — Phase state management

1. Implement `createPhaseState(projectId)` with sensible defaults
2. Implement phase transition helpers: `advancePhase(project)`, `regressPhase(project)`
3. Write tests: phase progression DISCOVERY→DEVELOPMENT→REFINEMENT→PRODUCTION, regression allowed, data preserved on regression

---

## 20. Open Questions

1. **Maximum `value` length:** Should ConceptVersion `value` strings have a soft limit (e.g., 2000 characters) to prevent unwieldy cards? To be resolved in `Spec_Workspace_Design.md`.

2. **Image file cleanup on concept/note deletion:** Resolved in v0.1 — immediate delete on entity deletion with `vacuumImages` on project open (per `Spec_DataPersistence.md`). Updated here to include DiscoveryNote deletion.

3. **DiscoveryCluster entity ownership:** Currently, clusters are nested inside PhaseState rather than being top-level entities. If consolidation becomes complex (dozens of clusters with metadata), this might warrant promoting DiscoveryCluster to a full entity with its own ID prefix. To be resolved when writing `Spec_DiscoveryEngine.md`.

4. **Conflict vs. CONFLICT namespace collision:** The `CONFLICT` value appears in both the Dimension enum and the InsightType enum. This is intentional and context always disambiguates, but if it causes confusion in implementation, one could be renamed (e.g., InsightType `CONTRADICTION`). To be resolved during implementation if needed.

---

## 21. Files Affected (Summary)

| File Path | Change |
|-----------|--------|
| `src/models/types.ts` | All entity interfaces, Dimension enum, Phase enum (replaces Builder enum) |
| `src/models/factories.ts` | Factory functions for all entities including DiscoveryNote and PhaseState |
| `src/models/relationships.ts` | Helper functions for entity relationships, cluster assignment |
| `src/models/defaults.ts` | Default ConceptType definitions for all four dimensions (41 total) |
| `src/models/__tests__/` | Unit tests for factories, relationships, defaults, phase management |

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: [repo path] | Branch: main

Spec file: docs/foundation/Spec_DataModel.md
→ Read this spec (v0.2) for all entity definitions and constraints.

Also read before starting:
- docs/HARD_RULES.md (non-negotiable constraints)
- docs/OVERVIEW.md (project context)

Follow the Build Sequence in §19, phase by phase.

Key constraints:
- All IDs use prefixed nanoid format: proj_, dnote_, con_, ctype_, ver_, img_, msg_, ins_, phase_ (§2)
- All entities are plain objects (interfaces, not classes) — no methods, no prototypes (§15)
- All timestamps are ISO 8601 strings, never Date objects (§15)
- No circular references — entities reference each other by ID string only (§15)
- A new Concept MUST always have exactly one ConceptVersion (§8)
- A new Project starts in DISCOVERY phase with 41 default ConceptTypes and one PhaseState (§4, §5)
- Use the nanoid npm package for ID generation

Start with: Phase 1 — define all TypeScript interfaces and enums in src/models/types.ts
and factory functions in src/models/factories.ts, with unit tests.

Work phase by phase. After completing each phase, stop and check in before moving on.
Commit after each phase with a message like "feat(models): Phase 1 — entity interfaces and factories".
```

---

*This spec is referenced by every other spec in the project. Changes here cascade. Update the version history and notify dependent specs when modifying entity shapes.*
