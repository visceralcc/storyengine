# Story Engine — Data Model Specification

**Systems Design & Data Architecture**

Version 0.1 | April 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial draft. All six entities defined: Project, Concept, ConceptType, ConceptVersion, Image, ChatMessage, Insight. ID strategy, relationship graph, serialization constraints. |

---

## 1. Overview

The data model defines every entity in Story Engine — the shapes of data that every other system reads, writes, and references.

**Design principle: Concept Types are the skeleton, everything else hangs on them.** The entire system is organized around Concept Types as the shared vocabulary. A Project is a container of Concepts. A Concept is an instance of a Concept Type. A ChatMessage produces Concepts. An Insight references Concepts. An Image attaches to a Concept. Every entity exists in relation to Concepts and their types.

**Consumer:** Every system in Story Engine reads from or writes to this data model. The Chat Engine creates Concepts and ChatMessages. The Builder UI renders Concepts as cards. The Insights Engine reads Concepts across Builders to generate Insights. The Export system serializes the full data model to .md and JSON. The MCP Server exposes it to external tools.

**Scope boundary — this spec does NOT:**
- Define how data is persisted to disk or loaded from disk (that's `Spec_DataPersistence.md`)
- Define how the AI extracts Concepts from natural language (that's `Spec_ChatEngine.md`)
- Define how the UI renders entities (that's `Spec_Builder_Design.md`)
- Define how Insights are generated (that's `Spec_InsightsEngine.md`)
- Define how images are generated or uploaded (that's `Spec_ImageGeneration.md`)

This spec defines **what the data looks like**. Other specs define what happens to it.

---

## 2. ID Strategy

Every entity gets a unique identifier. All IDs follow the same pattern:

```
format: [prefix]_[nanoid]
nanoid length: 21 characters (default nanoid output)
character set: A-Za-z0-9_-
```

| Entity | Prefix | Example |
|--------|--------|---------|
| Project | `proj` | `proj_V1StGnR4q8sMDc0hX3bYz` |
| Concept | `con` | `con_a8Kp2mNxR5tYwQ7vL9dJe` |
| ConceptType | `ctype` | `ctype_bR3fW8kLmN2pX5vY7qT9s` |
| ConceptVersion | `ver` | `ver_cQ4gH7jM1nP3sU6wZ8xB0` |
| Image | `img` | `img_dS5hK8lO2oR4tV7xA9yC1` |
| ChatMessage | `msg` | `msg_eT6iL9mP3pS5uW8yB0zA2` |
| Insight | `ins` | `ins_fU7jM0nQ4qT6vX9zC1aD3` |

**Why prefixed IDs:** When debugging, logging, or reading raw data, prefixed IDs instantly tell you what kind of entity you're looking at. `proj_abc123` is obviously a project. `con_xyz789` is obviously a concept. This matters when entities cross system boundaries (export, MCP Server, error logs).

**Generation:** Use the `nanoid` npm package. IDs are generated client-side at creation time. No server-side ID generation in v1 (local-first architecture).

---

## 3. Builder Enum

The three Builder sections are represented as a string enum used throughout the data model:

| Code Value | Display Label |
|------------|--------------|
| `WORLD` | World |
| `CHARACTER` | Character |
| `STORYLINE` | Storyline |

This enum appears in: Concept (§4), ConceptType (§5), ChatMessage (§7), and is used by Navigation (`Spec_Navigation.md`) to determine which Builder view to show.

---

## 4. Entity: Concept

A Concept is a single creative idea extracted from user input and categorized under a Concept Type. It's the core unit of content in Story Engine — every card on the dashboard is a Concept.

### Fields

```typescript
interface Concept {
  id: string;                    // con_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project this belongs to
  conceptTypeId: string;         // ctype_[nanoid] — which Concept Type this is an instance of
  builder: Builder;              // WORLD | CHARACTER | STORYLINE — which Builder section owns this
  currentVersionId: string;      // ver_[nanoid] — points to the active version
  versions: ConceptVersion[];    // all versions, ordered by versionNumber ascending
  relatedConceptIds: string[];   // con_[nanoid][] — links to concepts extracted from the same input
  sourceMessageId: string | null;// msg_[nanoid] — the chat message that created this (null if manually created)
  imageIds: string[];            // img_[nanoid][] — attached images, ordered by attachment time
  position: {                    // card position on the dashboard (user-controlled via drag-and-drop)
    x: number;                   // horizontal position in pixels
    y: number;                   // vertical position in pixels
  };
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp — updated on any change including version changes
}
```

### Key behaviors

- A Concept always belongs to exactly one Builder section. A concept cannot exist in multiple Builders simultaneously.
- The `currentVersionId` always points to one of the entries in the `versions` array.
- When the user revises a concept in-place, the current version's `value` field is updated directly (see §6).
- When the user creates a new version, a new ConceptVersion is added to `versions` and `currentVersionId` is updated to point to it.
- `relatedConceptIds` captures concepts that were co-extracted from the same chat message. This supports the "Show your work" principle — you can trace which concepts came from the same user input.
- `position` is entirely user-controlled. The system may suggest initial placement, but the stored position reflects wherever the user last dragged the card.
- A Concept with zero versions is invalid. Every Concept is created with at least one ConceptVersion.

### Cross-Builder concepts

The PRD notes that some concepts may span Builders (e.g., "Socioeconomic Class" could be both World and Character). In v1, this is handled by creating **separate Concept instances** in each relevant Builder, linked via `relatedConceptIds`. A single Concept entity always belongs to exactly one Builder — the cross-reference is the link, not a shared ownership.

**Why not shared ownership:** Shared ownership creates ambiguity about which Builder's dashboard shows the card, which chat history it traces to, and which version is "current" if versions diverge per Builder. Separate instances linked by `relatedConceptIds` is simpler and maps cleanly to the card-per-Builder UI.

---

## 5. Entity: ConceptType

A Concept Type is a labeled category representing a dimension of a World, Character, or Storyline. "Time Period", "Fashion Style", and "Story Arc" are all Concept Types.

### Fields

```typescript
interface ConceptType {
  id: string;                    // ctype_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project this belongs to
  label: string;                 // display name, Title Case with spaces (e.g., "Time Period")
  description: string;           // brief explanation of what this type captures
  builder: Builder;              // WORLD | CHARACTER | STORYLINE — which Builder this type belongs to
  isDefault: boolean;            // true if this is a built-in type, false if user/AI-created
  createdAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors

- **Default types are seeded per project.** When a new project is created, the default Concept Types for all three Builders are generated and stored in the project. These are listed in PRD §5.2 (World), §5.3 (Character), §5.4 (Storyline).
- **Default and custom types are identical in behavior.** The `isDefault` flag is metadata for potential future features (like a "reset to defaults" option). It does not affect how the type works — a custom type has the same capabilities as a default type. This enforces the HARD_RULES constraint: "Concept Types are first-class."
- **The label field is the display name.** It appears on card headers, in export files, and in MCP Server responses. Always Title Case with spaces.
- **Concept Types are scoped to a project.** Two different projects can each have a "Time Period" type — they are separate entities with separate IDs. This means projects are fully self-contained.
- **A Concept Type belongs to exactly one Builder.** The same label (e.g., "Fashion Style") could exist in both the World and Character Builders as separate ConceptType entities if the user or AI creates it in both places.
- **Labels are not required to be unique within a Builder,** but the Chat Engine should check for near-duplicates and surface them as an Insight (Conflict type) when two labels in the same Builder appear to describe the same thing. See PRD §13 Open Question #2.

### Default Concept Types

These are created when a new project is created. Full lists from PRD §5.2, §5.3, §5.4:

**World Builder defaults (11 types):**
Time Period, Location, Visual Style, Architecture — Exterior, Architecture — Interior, Natural Environment, Key Objects, Transportation, Technology Level, Social Structure, Atmosphere / Mood

**Character Builder defaults (13 types):**
Gender, Age, Physical Build, Facial Features, Fashion Style, Voice & Speech, Personality Trait, Behavioral Pattern, Knowledge & Education, Motivation, Fear / Weakness, Relationship Role, Background

**Storyline Builder defaults (11 types):**
Story Arc, Plot, Plot Twist, Sub-plot, Theme, Subtext, Conflict Type, Stakes, Tone, Pacing, Narrative POV

**Total default types per project:** 35

---

## 6. Entity: ConceptVersion

A version captures a specific state of a Concept's content at a point in time. Every Concept has at least one version. Users can create new versions for major rethinks while preserving history.

### Fields

```typescript
interface ConceptVersion {
  id: string;                    // ver_[nanoid] — unique identifier
  conceptId: string;             // con_[nanoid] — which Concept this version belongs to
  versionNumber: number;         // 1, 2, 3... — sequential, never reused
  value: string;                 // the actual content (e.g., "1820s", "Baroque opulence meets gritty realism")
  sourceMessageId: string | null;// msg_[nanoid] — the chat message that created or last modified this version
  createdAt: string;             // ISO 8601 timestamp — when this version was created
  updatedAt: string;             // ISO 8601 timestamp — updated on in-place edits
}
```

### Key behaviors

- **Two types of changes, one entity:**
  - **In-place edit** (refinement): The user tweaks wording or adjusts a detail. The existing version's `value` and `updatedAt` are updated directly. No new version is created. Example: "Make her taller" → the Physical Build version's value changes from "Average height, slender" to "Tall, slender."
  - **New version** (major rethink): The user fundamentally changes the concept. A new ConceptVersion is created with an incremented `versionNumber`. The Concept's `currentVersionId` updates to point to the new version. Example: "Actually, she's a warrior, not a painter" → Activity creates a new v2.
- **The user decides** which type of change to make. The system never auto-creates versions. (HARD_RULES: "Concept versioning is user-initiated.")
- **Version numbers are sequential and never reused.** If a Concept has versions 1, 2, 3, and the user deletes version 3, the next version created will be 4, not 3.
- **All versions are preserved.** There is no mechanism to delete individual versions in v1. The user can delete the entire Concept, but not selectively remove versions.
- **The `value` field is free-form text.** No character limit enforced by the data model. UI display limits are defined in `Spec_Builder_Design.md`.

### Worked example — version lifecycle

```
1. User says: "She's a painter who loves horses"
   → Concept created: Activity, v1, value: "Painting, horseback riding"
   → currentVersionId → ver_aaa (v1)

2. User says: "Actually, she only paints watercolors"
   → In-place edit: v1 value updated to "Watercolor painting, horseback riding"
   → currentVersionId still → ver_aaa (v1), updatedAt changes

3. User says: "Wait, scratch the painting entirely — she's a musician"
   → New version: v2 created, value: "Music (violin), horseback riding"
   → currentVersionId → ver_bbb (v2)
   → v1 still preserved and browsable
```

---

## 7. Entity: ChatMessage

A single message in the conversation between the user and the AI within a Builder.

### Fields

```typescript
interface ChatMessage {
  id: string;                    // msg_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project this belongs to
  builder: Builder;              // WORLD | CHARACTER | STORYLINE — which Builder's chat this message is in
  role: "user" | "assistant";    // who sent the message
  content: string;               // the message text
  conceptIds: string[];          // con_[nanoid][] — concepts created or modified by this message (empty for user messages, populated for assistant responses that extracted concepts)
  createdAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors

- **Each Builder has its own chat history.** When the user switches from World Builder to Character Builder, they see a different conversation. Chat messages are scoped to a specific Builder within a project.
- **The `conceptIds` field links messages to their output.** When the AI responds and extracts concepts, the assistant message stores references to the Concepts it created or modified. This supports the "Show your work" principle — you can follow the trail from any concept card back to the conversation that produced it.
- **User messages have empty `conceptIds`.** The linkage is on the assistant response, not the user input. (The user's input is already captured as `sourceMessageId` on the Concept and ConceptVersion entities.)
- **Messages are ordered by `createdAt`.** There is no explicit `order` or `sequence` field — chronological ordering by timestamp is sufficient.
- **Messages are append-only.** Chat history is never edited or deleted in v1. The conversation is a permanent log.

---

## 8. Entity: Image

A visual reference attached to a Concept. Can be AI-generated (via DALL-E) or uploaded by the user as found content.

### Fields

```typescript
interface Image {
  id: string;                    // img_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project this belongs to
  conceptId: string;             // con_[nanoid] — which Concept this image is attached to
  source: "GENERATED" | "UPLOADED"; // how this image was created
  generationPrompt: string | null;  // the prompt sent to DALL-E (null if uploaded)
  filePath: string;              // path to the image file relative to the project directory
  mimeType: string;              // e.g., "image/png", "image/jpeg", "image/webp"
  width: number;                 // image width in pixels
  height: number;                // image height in pixels
  createdAt: string;             // ISO 8601 timestamp
}
```

### Key behaviors

- **An Image always belongs to exactly one Concept.** Images are not shared across Concepts. If the same visual reference is needed for two Concepts, it is stored as two separate Image entities.
- **A Concept can have multiple Images.** They are ordered by `createdAt` (oldest first). The first image in the list is the "primary" image shown on the card; the user can browse additional images.
- **Image files are stored locally** in the project directory structure. The exact directory layout is defined in `Spec_DataPersistence.md`.
- **The `generationPrompt` field preserves the DALL-E prompt** so the user can regenerate or iterate on the image. For uploaded images, this field is null.
- **Deleting a Concept deletes its Images.** Images do not exist independently of their parent Concept.
- **Image format details** (resolution, quality settings, DALL-E model) are defined in `Spec_ImageGeneration.md`, not here. This entity only stores the resulting file reference.

---

## 9. Entity: Insight

An AI-generated observation surfaced in the Insights Panel. Insights identify relationships, enrichment opportunities, and contradictions across Concepts.

### Fields

```typescript
interface Insight {
  id: string;                    // ins_[nanoid] — unique identifier
  projectId: string;             // proj_[nanoid] — which project this belongs to
  type: "SUGGESTION" | "CONNECTION" | "CONFLICT"; // the category of insight
  title: string;                 // short summary shown as the insight card header
  description: string;           // the full explanation of the insight
  referencedConceptIds: string[];// con_[nanoid][] — which Concepts this insight relates to (at least 1)
  status: "PENDING" | "ACCEPTED" | "DISMISSED"; // user's response to this insight
  createdAt: string;             // ISO 8601 timestamp
  resolvedAt: string | null;     // ISO 8601 timestamp — when the user accepted or dismissed (null if pending)
}
```

### Insight types

| Code Value | Display Label | Purpose | Minimum Concepts Referenced |
|------------|--------------|---------|----------------------------|
| `SUGGESTION` | Suggestion | Ideas for enriching an existing concept | 1 |
| `CONNECTION` | Connection | Observed relationship between concepts across Builders | 2 |
| `CONFLICT` | Conflict | Contradiction between concepts that needs resolution or acknowledgement | 2 |

### Key behaviors

- **Insights are generated by the Insights Engine** (`Spec_InsightsEngine.md`). This spec only defines the data shape.
- **The `status` field tracks user response:**
  - `PENDING` — the user hasn't acted on this insight yet
  - `ACCEPTED` — the user chose to act on the insight (opened the relevant Builder/Concept to make changes)
  - `DISMISSED` — the user chose to ignore the insight
- **Insights are not editable.** The user can accept or dismiss them, but cannot modify their content. If the underlying Concepts change and the Insight is no longer relevant, the Insights Engine may mark it as stale (future consideration — not in v1).
- **An Insight always references at least one Concept.** Suggestions reference a single concept they're enriching. Connections and Conflicts reference at least two concepts (the ones being compared).
- **Insights are never auto-applied.** Accepting an Insight navigates the user to the relevant concept — it does not modify any data automatically. (HARD_RULES: "Suggest, don't dictate.")

### Insight status state machine

```
  ┌──────────┐
  │ PENDING  │ ← initial state when created
  └────┬─────┘
       │
       ├── user clicks "Act on this" ──→ ACCEPTED (resolvedAt set)
       │
       └── user clicks "Dismiss" ──→ DISMISSED (resolvedAt set)
```

No transitions back to PENDING. No transitions between ACCEPTED and DISMISSED. Once resolved, an Insight stays resolved.

---

## 10. Entity: Project

The top-level container. A Project holds everything — all three Builder sections with their Concepts, ConceptTypes, ChatMessages, Images, and Insights.

### Fields

```typescript
interface Project {
  id: string;                    // proj_[nanoid] — unique identifier
  name: string;                  // user-provided project name (e.g., "1820s France Story")
  description: string;           // optional brief description
  initialBuilder: Builder;       // WORLD | CHARACTER | STORYLINE — which Builder opened first
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp — updated on any change to any entity in the project
}
```

### Key behaviors

- **A Project always contains all three Builder sections.** Even if the user started with "Start New Character," the project has World and Storyline sections available immediately. (HARD_RULES: "One project = one container.")
- **The `initialBuilder` field records which Builder the user chose at creation time.** This determines which Builder opens first when the project is created, and may influence the UI (e.g., showing the initial Builder tab as selected). It does not restrict access to other Builders.
- **The `name` field is user-editable** at any time. No uniqueness constraint — the user can have two projects both named "My Story."
- **The `description` field is optional.** It can be empty string. It's shown in the project list on the Start Screen.
- **`updatedAt` cascades.** Any change to any entity within the project (new Concept, edited version, new chat message, new image, etc.) updates the Project's `updatedAt`. This is used for sorting the project list by "last modified."
- **Deleting a project deletes everything inside it:** all Concepts, ConceptTypes, ConceptVersions, ChatMessages, Images, and Insights. There is no "soft delete" or trash in v1.

### Project contains (summary of relationships)

A Project is the root container. Here's what it holds:

| Entity | Relationship | Typical Count |
|--------|-------------|---------------|
| ConceptType | Seeded on creation + user/AI additions | 35 defaults + custom |
| Concept | Created via chat or manually | 10s to 100s per project |
| ConceptVersion | At least 1 per Concept | 1–5 per Concept typically |
| ChatMessage | Appended during conversation | 10s to 100s per Builder |
| Image | Attached to Concepts | 0–3 per Concept typically |
| Insight | Generated by Insights Engine | 0–50 per project typically |

---

## 11. Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                          PROJECT                             │
│  id, name, description, initialBuilder                       │
│                                                              │
│  ┌─────────────┐     ┌─────────────────┐                    │
│  │ CONCEPT     │────▶│ CONCEPT TYPE    │                    │
│  │ TYPE        │     │                 │                    │
│  │             │     │ label           │                    │
│  │             │     │ builder         │                    │
│  │             │     │ isDefault       │                    │
│  └─────────────┘     └─────────────────┘                    │
│        │                                                     │
│        │ conceptTypeId                                       │
│        ▼                                                     │
│  ┌─────────────┐     ┌─────────────────┐                    │
│  │ CONCEPT     │────▶│ CONCEPT VERSION │                    │
│  │             │     │                 │                    │
│  │ builder     │     │ versionNumber   │                    │
│  │ position    │     │ value           │                    │
│  │             │     └─────────────────┘                    │
│  │             │                                             │
│  │             │────▶┌─────────────────┐                    │
│  │             │     │ IMAGE           │                    │
│  │             │     │                 │                    │
│  │             │     │ source          │                    │
│  │             │     │ filePath        │                    │
│  └──────┬──────┘     └─────────────────┘                    │
│         │                                                    │
│         │ sourceMessageId        relatedConceptIds           │
│         │                        (concept ↔ concept)         │
│         ▼                                                    │
│  ┌─────────────┐                                             │
│  │ CHAT        │                                             │
│  │ MESSAGE     │                                             │
│  │             │                                             │
│  │ builder     │                                             │
│  │ role        │                                             │
│  │ content     │                                             │
│  │ conceptIds  │ ── back-references to Concepts created      │
│  └─────────────┘                                             │
│                                                              │
│  ┌─────────────┐                                             │
│  │ INSIGHT     │                                             │
│  │             │                                             │
│  │ type        │                                             │
│  │ status      │                                             │
│  │ referenced  │ ── references 1+ Concepts                   │
│  │ ConceptIds  │                                             │
│  └─────────────┘                                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Relationship summary

| From | To | Type | Field | Meaning |
|------|----|------|-------|---------|
| Concept | Project | belongs to | `projectId` | Every concept lives in one project |
| Concept | ConceptType | is instance of | `conceptTypeId` | Every concept has a type |
| Concept | ConceptVersion | has many | `versions[]` | At least one, up to N |
| Concept | Concept | related to | `relatedConceptIds[]` | Co-extracted from same input |
| Concept | ChatMessage | created by | `sourceMessageId` | Traceability (nullable for manual) |
| Concept | Image | has many | `imageIds[]` | Visual references |
| ConceptVersion | Concept | belongs to | `conceptId` | Each version belongs to one concept |
| ConceptVersion | ChatMessage | modified by | `sourceMessageId` | Which message created/edited this version |
| ChatMessage | Project | belongs to | `projectId` | Scoped to a project |
| ChatMessage | Concept | created/modified | `conceptIds[]` | What this message produced |
| Image | Project | belongs to | `projectId` | Scoped to a project |
| Image | Concept | attached to | `conceptId` | One image, one concept |
| Insight | Project | belongs to | `projectId` | Scoped to a project |
| Insight | Concept | references | `referencedConceptIds[]` | Which concepts this insight is about |
| ConceptType | Project | belongs to | `projectId` | Scoped to a project |

---

## 12. Edge Cases & Rules

### Creation edge cases

- **Empty project:** A newly created project has 35 default ConceptTypes, zero Concepts, zero ChatMessages, zero Images, zero Insights. This is a valid state.
- **Concept with no image:** Valid and expected. Most concepts start without images. The `imageIds` array is empty.
- **Concept created manually (not via chat):** Valid. The `sourceMessageId` is null. The concept still has a ConceptType, at least one version, and a position.
- **ConceptType with no Concepts:** Valid. Default types exist even before the user creates any concepts of that type.

### Deletion rules

- **Deleting a Concept** deletes all its ConceptVersions and Images. It also removes the Concept's ID from:
  - `relatedConceptIds` on any related Concepts
  - `conceptIds` on any ChatMessages that reference it
  - `referencedConceptIds` on any Insights that reference it
- **Deleting a ConceptType** is only allowed if no Concepts of that type exist. If Concepts exist, the user must delete or reassign them first. (This prevents orphaned concepts.)
- **Deleting a Project** deletes everything: all ConceptTypes, Concepts, ConceptVersions, ChatMessages, Images, and Insights. Irreversible in v1.
- **ChatMessages cannot be deleted individually.** Chat history is append-only.
- **Insights can be dismissed but not deleted.** Dismissed insights remain in the data model with `status: DISMISSED`.

### Uniqueness constraints

- **Entity IDs are globally unique** across all projects (guaranteed by nanoid's collision resistance at 21 characters).
- **ConceptType labels are NOT required to be unique** within a Builder. Duplicate labels are allowed but should be flagged as a potential Conflict insight. See PRD §13, Open Question #2.
- **Project names are NOT required to be unique.** Users can have multiple projects with the same name.

### Timestamp rules

- All timestamps are ISO 8601 format with timezone: `2026-04-27T14:30:00.000Z`
- `createdAt` is set once at creation and never changes.
- `updatedAt` is updated on any modification to the entity or its children (for Project).

### Size boundaries (for reference, not enforced by data model)

These are guidelines for other specs to reference. The data model itself does not enforce them:

| Entity | Practical maximum per project | Notes |
|--------|------------------------------|-------|
| ConceptTypes | ~100 | 35 defaults + user/AI additions |
| Concepts | ~500 | Dashboard performance consideration |
| Versions per Concept | ~20 | UI browsability consideration |
| ChatMessages per Builder | ~1000 | Chat history scroll performance |
| Images per Concept | ~10 | Card display and storage consideration |
| Insights | ~200 | Insights Panel scroll performance |

These are not hard limits — they're estimates for other specs to design around. If a spec needs to set a real limit, it should define and enforce it.

---

## 13. Serialization Constraints

Because the data model is persisted locally as JSON (see `Spec_DataPersistence.md`), it must follow these rules:

- **No circular references.** Entities reference each other by ID (string), never by direct object reference. This ensures clean JSON serialization.
- **No class instances.** All entities are plain objects (interfaces, not classes). No methods, no prototypes. This keeps serialization trivial: `JSON.stringify` / `JSON.parse`.
- **No `undefined` values.** Use `null` for absent optional values. JSON does not support `undefined`.
- **All dates as ISO 8601 strings.** Not Date objects. Strings serialize cleanly; Date objects don't.
- **All IDs are strings.** Never numbers, never compound objects.

These constraints ensure that the entire project state can be saved to a JSON file and loaded back without any transformation layer. The data you save is the data you get back.

---

## 14. Relationship to Other Systems

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| `Spec_DataPersistence.md` | Reads and writes all entities to/from disk | §4–§10 (all entities) |
| `Spec_ChatEngine.md` | Creates Concepts, ConceptVersions, and ChatMessages | §4, §6, §7 |
| `Spec_Builder_Design.md` | Renders Concepts as cards, ConceptTypes as labels | §4, §5 |
| `Spec_InsightsEngine.md` | Reads Concepts across Builders, writes Insights | §4, §9 |
| `Spec_ImageGeneration.md` | Creates Image entities, attaches to Concepts | §8 |
| `Spec_Export.md` | Reads all entities for .md and JSON export | §4–§10 |
| `Spec_MCPServer.md` | Exposes entities as queryable resources | §4–§10 |
| `Spec_StartScreen_Design.md` | Reads Project entities for the project list | §10 |
| `Spec_Navigation.md` | Uses Builder enum and Project ID for routing | §3, §10 |

**No direct interaction:**
- `Spec_InsightsPanel_Design.md` — reads from the Insight entity but does not write to the data model (it calls the Insights Engine, which writes).

---

## 15. Data Model (Complete Reference)

All interfaces consolidated for quick reference:

```typescript
// --- Enums ---

type Builder = "WORLD" | "CHARACTER" | "STORYLINE";

// --- Entities ---

interface Project {
  id: string;
  name: string;
  description: string;
  initialBuilder: Builder;
  createdAt: string;
  updatedAt: string;
}

interface ConceptType {
  id: string;
  projectId: string;
  label: string;
  description: string;
  builder: Builder;
  isDefault: boolean;
  createdAt: string;
}

interface Concept {
  id: string;
  projectId: string;
  conceptTypeId: string;
  builder: Builder;
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
  builder: Builder;
  role: "user" | "assistant";
  content: string;
  conceptIds: string[];
  createdAt: string;
}

interface Image {
  id: string;
  projectId: string;
  conceptId: string;
  source: "GENERATED" | "UPLOADED";
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
  type: "SUGGESTION" | "CONNECTION" | "CONFLICT";
  title: string;
  description: string;
  referencedConceptIds: string[];
  status: "PENDING" | "ACCEPTED" | "DISMISSED";
  createdAt: string;
  resolvedAt: string | null;
}
```

---

## 16. Build Sequence (Preview)

### Phase 1 — Core types and factory functions

1. Define all TypeScript interfaces and the Builder enum
2. Create factory functions for each entity (e.g., `createConcept(...)`, `createProject(...)`) that handle ID generation and timestamp setting
3. Write unit tests for factory functions, verifying:
   - IDs use correct prefixes
   - Timestamps are valid ISO 8601
   - A new Concept always has exactly one ConceptVersion
   - A new Project has 35 default ConceptTypes

### Phase 2 — Relationship helpers

1. Create helper functions for relationship operations:
   - `addVersionToConcept(concept, version)` — appends version and updates `currentVersionId`
   - `attachImageToConcept(concept, image)` — appends image ID
   - `linkRelatedConcepts(conceptA, conceptB)` — adds IDs to each other's `relatedConceptIds`
2. Write unit tests for relationship integrity:
   - Adding a version increments `versionNumber` correctly
   - `relatedConceptIds` is symmetrical (if A references B, B references A)
   - Deleting a concept cleans up all references

### Phase 3 — Default ConceptType seeding

1. Create the default ConceptType data for all three Builders (35 types total)
2. Create a `seedDefaultConceptTypes(projectId)` function that generates all defaults
3. Write unit tests verifying correct count (11 World + 13 Character + 11 Storyline = 35)

---

## 17. Out of Scope

- **Persistence logic** — how entities are saved/loaded to disk. See `Spec_DataPersistence.md`.
- **Concept extraction logic** — how the AI determines which Concept Type to assign. See `Spec_ChatEngine.md`.
- **UI rendering** — how entities are displayed as cards, messages, or panels. See `Spec_Builder_Design.md`.
- **Insight generation logic** — how the system decides what Suggestions, Connections, and Conflicts to surface. See `Spec_InsightsEngine.md`.
- **Image generation logic** — how DALL-E prompts are constructed or how uploads are handled. See `Spec_ImageGeneration.md`.
- **User authentication** — no user entity exists. Local-first in v1 with no accounts. (PRD §11)
- **Concept Type merging** — flagged as a future consideration in PRD §13, not implemented in v1.
- **Undo/redo** — no undo system in v1. Versioning provides some history, but there is no general undo.
- **Soft delete / trash** — deletions are permanent in v1.

---

## 18. Open Questions

1. **Concept position persistence granularity:** Should card positions (`position.x`, `position.y`) be saved on every drag movement, or only when the user "drops" the card? Frequent saves could create performance issues. Likely resolved in `Spec_DataPersistence.md` (debounce/throttle strategy).

2. **Maximum `value` length:** The data model doesn't enforce a limit on ConceptVersion `value` strings. Should there be a soft limit surfaced in the UI (e.g., 2000 characters) to prevent unwieldy cards? To be resolved in `Spec_Builder_Design.md`.

3. **Image file cleanup on concept deletion:** When a Concept is deleted and its Images are removed from the data model, should the image files on disk be deleted immediately, or garbage-collected later? To be resolved in `Spec_DataPersistence.md`.

---

## 19. Files Affected (Summary)

| File Path | Change |
|-----------|--------|
| `src/models/types.ts` | All entity interfaces and Builder enum |
| `src/models/factories.ts` | Factory functions for creating entities with IDs and timestamps |
| `src/models/relationships.ts` | Helper functions for entity relationships |
| `src/models/defaults.ts` | Default ConceptType definitions for all three Builders |
| `src/models/__tests__/` | Unit tests for factories, relationships, and defaults |

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: [repo path] | Branch: main

Spec file: docs/foundation/Spec_DataModel.md
→ Read this spec for all entity definitions and constraints.

Also read before starting:
- docs/HARD_RULES.md (non-negotiable constraints)
- docs/OVERVIEW.md (project context)

Follow the Build Sequence in §16, phase by phase.

Key constraints:
- All IDs use prefixed nanoid format: proj_, con_, ctype_, ver_, img_, msg_, ins_ (§2)
- All entities are plain objects (interfaces, not classes) — no methods, no prototypes (§13)
- All timestamps are ISO 8601 strings, never Date objects (§13)
- No circular references — entities reference each other by ID string only (§13)
- A new Concept MUST always have exactly one ConceptVersion (§4)
- Use the nanoid npm package for ID generation

Start with: Phase 1 — define all TypeScript interfaces in src/models/types.ts
and factory functions in src/models/factories.ts, with unit tests.

Work phase by phase. After completing each phase, stop and check in before moving on.
Commit after each phase with a message like "feat(models): Phase 1 — entity interfaces and factories".
```

---

*This spec is referenced by every other spec in the project. Changes here cascade. Update the version history and notify dependent specs when modifying entity shapes.*
