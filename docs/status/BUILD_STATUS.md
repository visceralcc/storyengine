# Story Engine — Build Status

**Last updated:** May 12, 2026

---

## Current Phase: Speccing (Ideas-to-Code Process)

We are in the specification phase — no code has been written yet. This document tracks progress through the Ideas-to-Code process steps, and will later track implementation progress once we reach Step 6 (Handoff to Claude Code).

**⚠️ PRD v0.3 Rewrite Impact:** The PRD was rewritten from v0.2 to v0.3, replacing the three-Builder model with a four-phase creative pipeline. This changes the Structure Map significantly. Previously completed Phase A foundation specs (`Spec_DataModel.md`, `Spec_DataPersistence.md`, `Spec_Navigation.md`) will need revision to reflect the new pipeline model (Discovery Notes entity, Phase State entity, unified workspace navigation, phase transitions). The Templates document remains valid.

---

## Ideas-to-Code Progress

| Step | Document | Status | Notes |
|------|----------|--------|-------|
| 1 | PRD | ✅ Complete | `Spec_Story_Engine_PRD.md` — v0.3, four-phase pipeline model |
| 2 | Templates | ✅ Complete | `Templates_SpecDocs.md` — Tech Spec, Design Spec, Buildable Unit templates (still valid) |
| 3 | Structure Map | 🔴 Needs rewrite | `Structure_Map.md` — must be rewritten to reflect new pipeline model |
| 4 | Level 2 Specs | 🔴 Revision needed | 3 previously complete specs need updates for new model |
| 5 | Level 3 Buildable Units | ⬜ Not started | Anticipatory count will change with new Structure Map |
| 6 | Claude Code Handoff | ⬜ Not started | Implementation begins here |
| 7 | Spec Updates | ⬜ Not started | Ongoing as implementation reveals gaps |

---

## Level 2 Spec Status

### Previously completed specs (need revision for v0.3)

| Spec | Original Status | v0.3 Impact |
|------|----------------|-------------|
| `foundation/Spec_DataModel.md` | ✅ Complete (v0.1) | 🔴 Needs revision — add Discovery Note entity, Phase State entity, rename Builder references to Dimension, add Conflict dimension defaults |
| `foundation/Spec_DataPersistence.md` | ✅ Complete (v0.1) | 🟡 Minor revision — Discovery Notes persistence, Phase State persistence |
| `foundation/Spec_Navigation.md` | ✅ Complete (v0.1) | 🔴 Needs revision — Builder switching replaced by phase transitions and dimension tracking within unified workspace |

### New spec writing order (pending Structure Map rewrite)

The Structure Map must be rewritten before a new writing order can be established. Key changes anticipated:

- **New feature area: `discovery/`** — Discovery canvas, consolidation engine, note management
- **`builder/` becomes `workspace/`** — Unified workspace replacing three separate Builder screens
- **`chat-engine/` expands** — Phase-adaptive chat behavior (brainstorming in Discovery, extraction in Development, editor in Refinement)
- **Phase management** — New system for tracking and transitioning between pipeline phases
- **`start-screen/` simplifies** — Two options instead of four

---

## Key Decisions Log

| Decision | Detail | Made In |
|----------|--------|---------|
| Unified project model | One project contains all creative material across all phases | PRD v0.2, reaffirmed v0.3 |
| Image generation | DALL-E (OpenAI API) + user-uploaded found content | PRD v0.2 |
| Concept Types extensible | Default sets per dimension, AI and user can create new types | PRD v0.2, updated v0.3 (Builder → Dimension) |
| Local-first architecture | Local server for v1; cloud migration later | PRD v0.2 |
| Local MCP Server | Runs alongside app on user's machine for v1 | PRD v0.2 |
| Concept versioning | In-place edits for refinements; explicit v1/v2/v3 for major rethinks | PRD v0.2 |
| Free-form card layout | Drag-and-drop, user-controlled arrangement | PRD v0.2 |
| Insights Panel | Suggestions, Connections, Conflicts categories | PRD v0.2 |
| Online required | No offline mode in v1 | PRD v0.2 |
| Spec file naming | `Spec_[Name].md` (Tech), `Spec_[Name]_Design.md` (Design), `Screen_*.md`, `Component_*.md`, `Logic_*.md` | Templates v0.1 |
| Claude Code Handoff Prompt | Every spec includes a ready-to-paste session opener | Templates v0.1 |
| Feature folder naming | lowercase-kebab-case | Structure Map v0.1 |
| Prefixed nanoid IDs | All entities use prefix_nanoid format (proj_, con_, ctype_, ver_, img_, msg_, ins_) | DataModel v0.1 |
| Plain object entities | Interfaces not classes, no methods — clean JSON serialization | DataModel v0.1 |
| Chat history append-only | Messages never edited or deleted in v1 | DataModel v0.1 |
| **Four-phase creative pipeline** | **Discovery → Development → Refinement → Production Handoff replaces three-Builder model** | **PRD v0.3** |
| **Start Screen simplified** | **Two options: "Start New Story" and "Open Existing Project"** | **PRD v0.3** |
| **Unified workspace** | **Character/World/Conflict are dimensions, not separate screens** | **PRD v0.3** |
| **Conflict vs. Storyline** | **"Conflict" in Development, shapes into "Storyline" in Refinement** | **PRD v0.3** |
| **Phase-appropriate cards** | **No cards in Discovery; emerge in Development; primary surface in Refinement** | **PRD v0.3** |
| **Discovery canvas** | **Freeform ideation + AI consolidation, inspired by Velocity's Ideation pattern** | **PRD v0.3** |
| **Creative gravity** | **AI discovers user's creative center (character-first, world-first, conflict-first) during Discovery** | **PRD v0.3** |

---

## Documents Inventory

| File | Type | Status |
|------|------|--------|
| `Spec_Story_Engine_PRD.md` | PRD (Level 1) | ✅ Complete (v0.3) |
| `BUILD_STATUS.md` | Companion | ✅ Current file |
| `HARD_RULES.md` | Companion | ✅ Updated for v0.3 |
| `OVERVIEW.md` | Companion | 🟡 Needs update for pipeline model |
| `Templates_SpecDocs.md` | Templates | ✅ Complete (v0.1) — still valid |
| `Structure_Map.md` | Structure | 🔴 Needs rewrite for pipeline model |
| `foundation/Spec_DataModel.md` | Tech Spec (Level 2) | 🔴 Needs revision for v0.3 |
| `foundation/Spec_DataPersistence.md` | Tech Spec (Level 2) | 🟡 Needs minor revision for v0.3 |
| `foundation/Spec_Navigation.md` | Tech Spec (Level 2) | 🔴 Needs revision for v0.3 |

---

## What's Next

**Immediate next step:** Rewrite `Structure_Map.md` to reflect the new pipeline model. This is the prerequisite for knowing what specs to write (and revise) next.

**After that:** Revise the three foundation specs (`Spec_DataModel.md`, `Spec_DataPersistence.md`, `Spec_Navigation.md`) to incorporate Discovery Notes, Phase State, unified workspace navigation, and Builder → Dimension terminology.

**Then:** Resume the Level 2 spec writing process with the new feature areas (Discovery Engine, Workspace Design, phase-adaptive Chat Engine).
