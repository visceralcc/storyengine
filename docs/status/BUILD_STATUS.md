# Story Engine — Build Status

**Last updated:** May 14, 2026

---

## Current Phase: Implementing (Phase B — Discovery)

Implementation has begun. Project scaffolded (Expo SDK 52 + TypeScript + Jest). DataModel Phase 1 and Discovery Engine Phase 1 are complete with passing unit tests. This document tracks the Ideas-to-Code process steps and current implementation progress.

---

## Ideas-to-Code Progress

| Step | Document | Status | Notes |
|------|----------|--------|-------|
| 1 | PRD | ✅ Complete | `Spec_Story_Engine_PRD.md` — v0.3, four-phase pipeline model |
| 2 | Templates | ✅ Complete | `Templates_SpecDocs.md` — Tech Spec, Design Spec, Buildable Unit templates |
| 3 | Structure Map | ✅ Complete | `Structure_Map.md` — v0.2, rewritten for pipeline model. 8 feature folders, 13 Level 2 specs. |
| 4 | Level 2 Specs | 🟡 In progress | 4 of 13 complete |
| 5 | Level 3 Buildable Units | ⬜ Not started | ~22 anticipated, depends on Level 2 |
| 6 | Claude Code Handoff | ⬜ Not started | Implementation begins here |
| 7 | Spec Updates | ⬜ Not started | Ongoing as implementation reveals gaps |

---

## Level 2 Spec Writing Order

From `Structure_Map.md` §6. Write in this order, build after each phase.

| Phase | Order | Spec | Status |
|-------|-------|------|--------|
| A — Foundation | 1 | `Spec_DataModel.md` | ✅ Complete (v0.2) |
| A — Foundation | 2 | `Spec_DataPersistence.md` | ✅ Complete (v0.2) |
| A — Foundation | 3 | `Spec_Navigation.md` | ✅ Complete (v0.2) |
| B — Discovery | 4 | `Spec_DiscoveryEngine.md` | ✅ Complete (v0.1) |
| B — Discovery | 5 | `Spec_Discovery_Design.md` | ⬜ Next up |
| C — Core Engine | 6 | `Spec_ChatEngine.md` | ⬜ |
| D — Surfaces | 7 | `Spec_StartScreen_Design.md` | ⬜ |
| D — Surfaces | 8 | `Spec_Workspace_Design.md` | ⬜ |
| E — Enrichment | 9 | `Spec_InsightsEngine.md` | ⬜ |
| E — Enrichment | 10 | `Spec_InsightsPanel_Design.md` | ⬜ |
| E — Enrichment | 11 | `Spec_ImageGeneration.md` | ⬜ |
| F — Output | 12 | `Spec_Export.md` | ⬜ |
| F — Output | 13 | `Spec_MCPServer.md` | ⬜ |

---

## Key Decisions Log

| Decision | Detail | Made In |
|----------|--------|---------|
| Unified project model | One project contains all creative material across all phases | PRD v0.2, reaffirmed v0.3 |
| Image generation | DALL-E (OpenAI API) + user-uploaded found content | PRD v0.2 |
| Concept Types extensible | Default sets per dimension, AI and user can create new types | PRD v0.2, updated v0.3 |
| Local-first architecture | Local server for v1; cloud migration later | PRD v0.2 |
| Local MCP Server | Runs alongside app on user's machine for v1 | PRD v0.2 |
| Concept versioning | In-place edits for refinements; explicit v1/v2/v3 for major rethinks | PRD v0.2 |
| Free-form card layout | Drag-and-drop, user-controlled arrangement | PRD v0.2 |
| Insights Panel | Suggestions, Connections, Conflicts categories | PRD v0.2 |
| Online required | No offline mode in v1 | PRD v0.2 |
| Spec file naming | `Spec_[Name].md` (Tech), `Spec_[Name]_Design.md` (Design), `Screen_*.md`, `Component_*.md`, `Logic_*.md` | Templates v0.1 |
| Claude Code Handoff Prompt | Every spec includes a ready-to-paste session opener | Templates v0.1 |
| Feature folder naming | lowercase-kebab-case | Structure Map v0.1 |
| Prefixed nanoid IDs | All entities use prefix_nanoid format (proj_, dnote_, con_, ctype_, ver_, img_, msg_, ins_, phase_) | DataModel v0.1, updated v0.2 |
| Plain object entities | Interfaces not classes, no methods — clean JSON serialization | DataModel v0.1 |
| Chat history append-only | Messages never edited or deleted in v1 | DataModel v0.1 |
| Four-phase creative pipeline | Discovery → Development → Refinement → Production Handoff replaces three-Builder model | PRD v0.3 |
| Start Screen simplified | Two options: "Start New Story" and "Open Existing Project" | PRD v0.3 |
| Unified workspace | Character/World/Conflict are dimensions, not separate screens | PRD v0.3 |
| Conflict vs. Storyline | "Conflict" in Development, shapes into "Storyline" in Refinement | PRD v0.3 |
| Phase-appropriate cards | No cards in Discovery; emerge in Development; primary surface in Refinement | PRD v0.3 |
| 41 default ConceptTypes | 11 World + 13 Character + 9 Conflict + 8 Storyline, seeded per project | DataModel v0.2 |
| Spatial Discovery canvas | Unbounded 2D canvas, notes placed at x/y coordinates, no grid | DiscoveryEngine v0.1 |
| Dual input paths | Manual note placement + AI stream-of-consciousness extraction | DiscoveryEngine v0.1 |
| User-initiated consolidation | "Consolidate Ideas" button, minimum 3 notes, AI groups into labeled clusters | DiscoveryEngine v0.1 |
| Consolidation is on-canvas | Clusters displayed as border-boxed groups on the canvas, not a separate screen | DiscoveryEngine v0.1 |
| Creative gravity as consolidation byproduct | AI classifies clusters by dimension, gravity = dimension with most notes | DiscoveryEngine v0.1 |
| Gap analysis (internal-only) | Maps notes against 41 default Concept Types, feeds Development chat strategy | DiscoveryEngine v0.1 |
| Full re-consolidation | Returning to Discovery + re-consolidating replaces all clusters from full note pool | DiscoveryEngine v0.1 |
| Discovery chat included | Chat panel on Discovery canvas for brainstorming + stream-of-consciousness extraction | DiscoveryEngine v0.1 |
| Narrative UI for gap filling | Development AI surfaces gaps through natural conversation, not checklists | DiscoveryEngine v0.1 (§6.3) |

---

## Data Model Additions Pending

The Discovery Engine spec (v0.1) introduces `GapAnalysis` and `ConceptTypeMapping` interfaces and extends `PhaseState.discovery` with a `gapAnalysis` field. These additions need to be incorporated into `Spec_DataModel.md` in a v0.3 revision.

---

## Documents Inventory

| File | Type | Status |
|------|------|--------|
| `Spec_Story_Engine_PRD.md` | PRD (Level 1) | ✅ Complete (v0.3) |
| `status/BUILD_STATUS.md` | Companion | ✅ Current file |
| `HARD_RULES.md` | Companion | ✅ Updated for v0.3 |
| `OVERVIEW.md` | Companion | ✅ Updated for v0.3 |
| `Templates_SpecDocs.md` | Templates | ✅ Complete (v0.1) |
| `Structure_Map.md` | Structure | ✅ Complete (v0.2) |
| `foundation/Spec_DataModel.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) — needs v0.3 for GapAnalysis addition |
| `foundation/Spec_DataPersistence.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) |
| `foundation/Spec_Navigation.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) |
| `discovery/Spec_DiscoveryEngine.md` | Tech Spec (Level 2) | ✅ Complete (v0.1) |

---

## Implementation Progress

| Area | Phase | Status | Files |
|------|-------|--------|-------|
| Infrastructure | Scaffold | ✅ Complete | `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`, `App.tsx` |
| DataModel | 1 — Types + factories | ✅ Complete | `src/models/types.ts`, `src/models/defaults.ts`, `src/models/factories.ts` |
| DataModel | 2 — Relationship helpers | ⬜ | `src/models/relationships.ts` |
| DataModel | 3 — Default ConceptType seeding | ✅ Complete (rolled into Phase 1) | `src/models/defaults.ts` |
| DataModel | 4 — Phase state management | ⬜ | TBD |
| DataPersistence | 1 — Atomic writes + recovery | ✅ Complete | `src/persistence/paths.ts`, `src/persistence/atomicWrite.ts` |
| DataPersistence | 2 — Project lifecycle | ⬜ | `src/persistence/projectStore.ts` |
| DataPersistence | 3 — Save queue | ⬜ | `src/persistence/saveQueue.ts` |
| DataPersistence | 4 — Image management | ⬜ | `src/persistence/imageStore.ts` |
| DataPersistence | 5 — Local server | ⬜ | `src/persistence/server.ts` |
| Discovery Engine | 1 — Canvas core | ✅ Complete | `src/engine/discovery/canvasManager.ts` |
| Discovery Engine | 2 — Chat integration | ⬜ | not started |
| Discovery Engine | 3 — Consolidation | ⬜ | not started |
| Discovery Engine | 4 — Gap analysis | ⬜ | not started |
| Discovery Engine | 5 — Re-consolidation + review | ⬜ | not started |

Tests: 50 passing (19 model, 16 canvas, 15 persistence).

---

## What's Next

**Immediate next step:** DataPersistence Phase 2 — project lifecycle operations (create, open, list, delete, close) composing the Phase 1 primitives with `initializeProject` from the models layer. After that, Phase 3 wires the save queue so canvas edits actually flow to disk.

**Parallel option:** DataModel Phase 2 (relationship helpers) and Phase 4 (phase-state transitions) can be picked up alongside DataPersistence — they don't block each other.

**Specs still pending:** `Spec_Discovery_Design.md` (Phase B, Order 5), `Spec_ChatEngine.md` (Phase C, Order 6). Both need to be drafted before Discovery Engine Phase 2 (chat extraction + brainstorming) can begin.
