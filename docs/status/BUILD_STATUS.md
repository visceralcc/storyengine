# Story Engine — Build Status

**Last updated:** May 18, 2026 (Chat Engine Phase 3 complete)

---

## Current Phase: Implementing (Chat Engine Phase 3 complete)

Implementation has begun. Project scaffolded (Expo SDK 52 + TypeScript + Jest). DataModel Phase 1, Discovery Engine Phase 1, DataPersistence Phases 1–2, and Chat Engine Phases 1–3 are complete with passing unit tests. The full entry flow UI (Splash → Project Chooser → Step Menu) is built and committed. The Discovery Screen UI shell is complete end-to-end and now persisted: notes, clusters, and chat messages load from disk on mount and save back on every change via `projectStore`. The Project Chooser saves new projects and lists saved ones inline. The Chat Engine has a streaming Anthropic API client (Phase 1), phase-adaptive system prompts + context assembly (Phase 2), and a Discovery response parser + viewport-placement extraction (Phase 3). Wiring the Discovery chat UI to the engine — and Development chat integration (Phase 4) — are next.

---

## Ideas-to-Code Progress

| Step | Document | Status | Notes |
|------|----------|--------|-------|
| 1 | PRD | ✅ Complete | `Spec_Story_Engine_PRD.md` — v0.3, four-phase pipeline model |
| 2 | Templates | ✅ Complete | `Templates_SpecDocs.md` — Tech Spec, Design Spec, Buildable Unit templates |
| 3 | Structure Map | ✅ Complete | `Structure_Map.md` — v0.2, rewritten for pipeline model. 8 feature folders, 13 Level 2 specs. |
| 4 | Level 2 Specs | 🟡 In progress | 9 of 15 complete |
| 5 | Level 3 Buildable Units | ⬜ Not started | ~22 anticipated, depends on Level 2 |
| 6 | Claude Code Handoff | 🟡 In progress | Entry flow implemented; Discovery UI next |
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
| B — Discovery | 5 | `Spec_Discovery_Design.md` | ✅ Complete (v0.1) |
| C — Core Engine | 6 | `Spec_ChatEngine.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7 | `Spec_SplashScreen_Design.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7b | `Spec_ProjectChooser_Design.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7c | `Spec_StepMenu_Design.md` | ✅ Complete (v0.1) |
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
| Note colors in v1 | 6-color palette (Blue, Green, Purple, Gold, Pink, Gray) for Discovery Notes. Purely visual — AI ignores color during consolidation. Adds `color: NoteColor` to DiscoveryNote entity. | Discovery_Design v0.1 |
| Entry flow is three screens | Splash → Project Chooser → Step Menu (replaces single "Start Screen" concept) | SplashScreen_Design v0.1, ProjectChooser_Design v0.1, StepMenu_Design v0.1 |
| Splash is tap-anywhere-to-continue | No buttons on splash — full-bleed video + centered title, any tap/key advances | SplashScreen_Design v0.1 |
| Phase locking on Step Menu | Phases unlock sequentially — only completed + next phase are tappable | StepMenu_Design v0.1 |
| Project List is separate screen | "Open existing Story" navigates to a dedicated Project List screen/overlay | ProjectChooser_Design v0.1 |
| Entry flow typography exceptions | 260pt (Splash), 96pt (Step Menu), 40pt (Chooser) intentionally exceed 36pt HARD_RULES max | SplashScreen_Design v0.1 |
| Body font: Aleo | Aleo (Google Fonts slab serif) is the canonical body/content font. Replaces Noto Serif (original) → Noticia Text → Domine → Aleo. Has Regular, Italic, and Bold variants. | Discovery_Design v0.1, updated in implementation |
| Chat panel label: "Assistant" | Chat panel labeled "Assistant" across all phases. Placeholder name — can be changed later. | Discovery_Design v0.1 |
| Anthropic API: Sonnet 4 | claude-sonnet-4-20250514, max_tokens 4096, temperature 0.7, streaming enabled | ChatEngine v0.1 |
| Embedded JSON for structured output | Response format: conversational text + optional fenced JSON block (no tool use in v1) | ChatEngine v0.1 |
| Phase-adaptive system prompts | One pipeline, four personalities — prompt changes by phase, mechanics stay the same | ChatEngine v0.1 |
| RETHINK requires confirmation | Major concept version changes (RETHINK) trigger user confirmation; REFINE applies automatically | ChatEngine v0.1 |
| Context caps | 40 message history cap, 50 Discovery note cap in context | ChatEngine v0.1 |

---

## Data Model Additions Pending

The Discovery Engine spec (v0.1) introduces `GapAnalysis` and `ConceptTypeMapping` interfaces and extends `PhaseState.discovery` with a `gapAnalysis` field. The Discovery Design spec (v0.1) introduces `NoteColor` type and adds `color: NoteColor` to the `DiscoveryNote` interface. Both additions need to be incorporated into `Spec_DataModel.md` in a v0.3 revision.

---

## Companion Doc Updates Pending

_None._ Body font Noto Serif → Noticia Text → Domine → Aleo (final) has been propagated across HARD_RULES.md, DESIGN.md, and all codebase fontFamily references. Aleo ships with Regular, Italic, and Bold variants — no italic fallback needed.

---

## Documents Inventory

| File | Type | Status |
|------|------|--------|
| `Spec_Story_Engine_PRD.md` | PRD (Level 1) | ✅ Complete (v0.3) |
| `status/BUILD_STATUS.md` | Companion | ✅ Current file |
| `HARD_RULES.md` | Companion | ✅ Updated for v0.3 — pending font update |
| `OVERVIEW.md` | Companion | ✅ Updated for v0.3 |
| `Templates_SpecDocs.md` | Templates | ✅ Complete (v0.1) |
| `Structure_Map.md` | Structure | ✅ Complete (v0.2) |
| `foundation/Spec_DataModel.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) — needs v0.3 for GapAnalysis + NoteColor additions |
| `foundation/Spec_DataPersistence.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) |
| `foundation/Spec_Navigation.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) |
| `discovery/Spec_DiscoveryEngine.md` | Tech Spec (Level 2) | ✅ Complete (v0.1) |
| `discovery/Spec_Discovery_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.1) |
| `chat-engine/Spec_ChatEngine.md` | Tech Spec (Level 2) | ✅ Complete (v0.1) |
| `start-screen/Spec_SplashScreen_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.1) |
| `start-screen/Spec_ProjectChooser_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.1) |
| `start-screen/Spec_StepMenu_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.1) |

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
| DataPersistence | 2 — Project lifecycle | ✅ Complete | `src/persistence/storage.ts`, `src/persistence/projectStore.ts`; wired into `app/choose.tsx` + `app/project/[projectId]/discovery.tsx` |
| DataPersistence | 3 — Save queue | ⬜ | `src/persistence/saveQueue.ts` |
| DataPersistence | 4 — Image management | ⬜ | `src/persistence/imageStore.ts` |
| DataPersistence | 5 — Local server | ⬜ | `src/persistence/server.ts` |
| Discovery Engine | 1 — Canvas core | ✅ Complete | `src/engine/discovery/canvasManager.ts` |
| Discovery Engine | 2 — Chat integration | ⬜ | not started |
| Discovery Engine | 3 — Consolidation | ⬜ | not started |
| Discovery Engine | 4 — Gap analysis | ⬜ | not started |
| Discovery Engine | 5 — Re-consolidation + review | ⬜ | not started |
| **Entry Flow UI** | **Splash Screen** | **✅ Complete** | **`app/index.tsx`** |
| **Entry Flow UI** | **Project Chooser** | **✅ Complete** | **`app/choose.tsx`** |
| **Entry Flow UI** | **Step Menu** | **✅ Complete** | **`app/project/[projectId]/steps.tsx`** |
| **Entry Flow UI** | **Font loading** | **✅ Complete** | **`app/_layout.tsx` (Barlow_100Thin, Barlow_500Medium, Aleo_400Regular, Aleo_400Regular_Italic, Aleo_700Bold)** |
| **Entry Flow UI** | **Real project IDs** | **✅ Complete** | **`app/choose.tsx` uses initializeProject** |
| **Discovery UI** | **Data model additions (NoteColor)** | **✅ Complete** | **`src/models/types.ts`, `src/models/noteColors.ts`, `src/models/factories.ts`** |
| **Discovery UI** | **Phase 1 — Screen shell + header** | **✅ Complete** | **`app/project/[projectId]/discovery.tsx`** |
| **Discovery UI** | **Phase 2 — Chat panel (local-only)** | **✅ Complete** | **`app/project/[projectId]/discovery.tsx`** |
| **Discovery UI** | **Phase 3 — Note color picker + placement toggle** | **✅ Complete** | **`app/project/[projectId]/discovery.tsx`, `assets/buttons/`** |
| **Discovery UI** | **Phase 4 — Canvas + note placement / edit / drag / delete** | **✅ Complete** | **`app/project/[projectId]/discovery.tsx`** |
| **Discovery UI** | **Phase 5 — Consolidate Ideas button (UI stub)** | **✅ Complete** | **`app/project/[projectId]/discovery.tsx`** |
| **Discovery UI** | **Phase 6 — Trackpad pan + flow verification** | **✅ Complete** | **`app/project/[projectId]/discovery.tsx`** |
| Chat Engine | 1 — API client + streaming | ✅ Complete | `src/engine/chat/types.ts`, `src/engine/chat/client.ts` |
| Chat Engine | 2 — Context assembly | ✅ Complete | `src/engine/chat/prompts.ts`, `src/engine/chat/context.ts` |
| Chat Engine | 3 — Discovery chat integration | ✅ Complete | `src/engine/chat/parser.ts`, `src/engine/chat/extraction.ts` |
| Chat Engine | 4 — Development chat integration | ⬜ | not started |
| Chat Engine | 5 — Custom ConceptType creation | ⬜ | not started |
| Chat Engine | 6 — Gap-aware conversation | ⬜ | not started |
| Chat Engine | 7 — Refinement chat integration | ⬜ | not started |

Tests: 128 passing (20 model, 16 canvas, 28 persistence, 64 chat).

---

## What's Next

**Immediate next step:** Chat Engine Phase 4 — Development chat integration. Add `parseExtractionResponse` (concepts / updatedConcepts / suggestedNewTypes per §5.2) reusing the `extractJsonBlock` splitter, plus Concept + ConceptVersion entity creation and REFINE / RETHINK follow-up refinement logic with ConceptType validation. Wiring the Discovery chat panel UI to send/stream/parse via the engine is also a near-term task (the engine is ready). `Spec_Workspace_Design.md` (Phase D, Order 8) is the next pending Design Spec.

**Companion doc updates still pending:** DataModel needs v0.3 revision to roll up the in-code NoteColor type and the GapAnalysis interfaces from Discovery_Design v0.1 / DiscoveryEngine v0.1.

**Navigation spec update needed:** `Spec_Navigation.md` (v0.2) defines `/` as a single "Start Screen" route. The entry flow is now three screens (Splash → Project Chooser → Step Menu) at routes `/`, `/choose`, and `/project/:projectId/steps`. The nav spec needs a v0.3 revision to reflect these routes.
