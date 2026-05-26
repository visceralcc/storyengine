# Story Engine — Build Status

**Last updated:** May 26, 2026

---

## Current Phase: Implementing (Discovery UI shipped, Development UI Phases 1–3 shipped, Chat Engine wired into both screens)

Discovery UI is feature-complete for v1: canvas with note placement, editing, dragging, deletion, pan, 6-color picker, Consolidate Ideas button (UI only — engine stub), back/forward header nav, splash video background, project persistence, and chat panel wired to the Anthropic API with stream-of-consciousness extraction. Development UI Phases 1–3 are shipped: three-pillar canvas, Story Element Detail View, Compare View + comparison-mode flow, chat wired to Anthropic with concept extraction. The full Chat Engine (Phases 1–7) is built. DataPersistence Phase 2 (projectStore via localStorage) is built. Step Menu now unlocks Discovery + Development.

---

## Ideas-to-Code Progress

| Step | Document | Status | Notes |
|------|----------|--------|-------|
| 1 | PRD | ✅ Complete | `Spec_Story_Engine_PRD.md` — v0.3, four-phase pipeline model |
| 2 | Templates | ✅ Complete | `Templates_SpecDocs.md` — Tech Spec, Design Spec, Buildable Unit templates |
| 3 | Structure Map | ✅ Complete | `Structure_Map.md` — v0.2, rewritten for pipeline model |
| 4 | Level 2 Specs | 🟡 In progress | 10 of 15 complete (Chat Engine + Development Design added) |
| 5 | Level 3 Buildable Units | ⬜ Not started | ~22 anticipated, depends on Level 2 |
| 6 | Claude Code Handoff | 🟡 In progress | Entry flow, Discovery, Development Phases 1–3, Chat Engine, Persistence Phase 2 all shipped |
| 7 | Spec Updates | 🟡 In progress | Several pending — see "Pending Doc Updates" below |

---

## Level 2 Spec Writing Order

From `Structure_Map.md` §6. Write in this order, build after each phase.

| Phase | Order | Spec | Status |
|-------|-------|------|--------|
| A — Foundation | 1 | `Spec_DataModel.md` | ✅ Complete (v0.4) — needs follow-up for NoteColor + GapAnalysis roll-up |
| A — Foundation | 2 | `Spec_DataPersistence.md` | ✅ Complete (v0.2) |
| A — Foundation | 3 | `Spec_Navigation.md` | ✅ Complete (v0.2) — needs v0.3 for three-route entry flow |
| B — Discovery | 4 | `Spec_DiscoveryEngine.md` | ✅ Complete (v0.1) |
| B — Discovery | 5 | `Spec_Discovery_Design.md` | ✅ Complete (v0.1) — needs font references updated to Aleo |
| C — Core Engine | 6 | `Spec_ChatEngine.md` | ✅ Complete (v0.2) |
| D — Surfaces | 7 | `Spec_SplashScreen_Design.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7b | `Spec_ProjectChooser_Design.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7c | `Spec_StepMenu_Design.md` | ✅ Complete (v0.1) |
| D — Surfaces | 8 | `Spec_Development_Design.md` | ✅ Complete (v0.2) — supersedes the placeholder `Spec_Workspace_Design.md` slot |
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
| Prefixed nanoid IDs | All entities use prefix_nanoid format (proj_, dnote_, con_, ctype_, ver_, img_, msg_, ins_, phase_, cluster_) | DataModel v0.1, updated v0.2 |
| Plain object entities | Interfaces not classes, no methods — clean JSON serialization | DataModel v0.1 |
| Chat history append-only | Messages never edited or deleted in v1 | DataModel v0.1 |
| Four-phase creative pipeline | Discovery → Development → Refinement → Production Handoff replaces three-Builder model | PRD v0.3 |
| Start Screen simplified | Two options: "Start New Story" and "Open Existing Project" | PRD v0.3 |
| Unified workspace | Character/World/Conflict are dimensions, not separate screens | PRD v0.3 |
| Dimension rename | Conflict → Theme; Storyline dimension removed. Three-dimension model: WORLD / CHARACTER / THEME | DataModel v0.3, ChatEngine v0.2 |
| Phase-appropriate cards | No cards in Discovery; emerge in Development; primary surface in Refinement | PRD v0.3 |
| 29 default ConceptTypes | 11 World + 13 Character + 5 Theme, seeded per project (down from 41 in v0.2) | DataModel v0.3 |
| CreativeTag on Concepts | `CORE | EVOLVE | SET_ASIDE` curation tag drives the ui_eval bar in Development. Concept gains `creativeTag` (default CORE) and `definition: string | null` (Development-authored expanded definition) | DataModel v0.4, Development_Design v0.2 §6.1 |
| Spatial Discovery canvas | Unbounded 2D canvas, notes placed at x/y coordinates, no grid | DiscoveryEngine v0.1 |
| Dual input paths | Manual note placement + AI stream-of-consciousness extraction | DiscoveryEngine v0.1 |
| User-initiated consolidation | "Consolidate Ideas" button, minimum 3 notes, AI groups into labeled clusters | DiscoveryEngine v0.1 |
| Consolidation is on-canvas | Clusters displayed as border-boxed groups on the canvas, not a separate screen | DiscoveryEngine v0.1 |
| Creative gravity as consolidation byproduct | AI classifies clusters by dimension, gravity = dimension with most notes | DiscoveryEngine v0.1 |
| Gap analysis (internal-only) | Maps notes against 29 default Concept Types, feeds Development chat strategy | DiscoveryEngine v0.1 |
| Full re-consolidation | Returning to Discovery + re-consolidating replaces all clusters from full note pool | DiscoveryEngine v0.1 |
| Discovery chat included | Chat panel on Discovery canvas for brainstorming + stream-of-consciousness extraction | DiscoveryEngine v0.1 |
| Narrative UI for gap filling | Development AI surfaces gaps through natural conversation, not checklists | DiscoveryEngine v0.1 (§6.3) |
| Note colors in v1 | 6-color palette (Blue, Green, Purple, Gold, Pink, Gray). Purely visual — AI ignores color during consolidation. | Discovery_Design v0.1 |
| Entry flow is three screens | Splash → Project Chooser → Step Menu | SplashScreen_Design v0.1, ProjectChooser_Design v0.1, StepMenu_Design v0.1 |
| Splash is tap-anywhere-to-continue | No buttons on splash — full-bleed looping video + centered title, any tap/key advances | SplashScreen_Design v0.1 |
| Phase locking on Step Menu | Phases unlock sequentially — Discovery + Development currently unlocked; Refinement locked. | StepMenu_Design v0.1 |
| Project List is separate screen | "Open existing Story" navigates to a dedicated Project List screen (currently rendered inline on `/choose`) | ProjectChooser_Design v0.1 |
| Entry flow typography exceptions | 260pt (Splash), 96pt (Step Menu), 40pt (Chooser) intentionally exceed 36pt HARD_RULES max | SplashScreen_Design v0.1 |
| Body font: Aleo | Aleo (Google Fonts slab serif) is the body/content font. Replaced Noticia Text → Domine → Aleo over the May 18 session. HARD_RULES.md and DESIGN.md still reference older fonts. | session 2026-05-18 |
| Chat panel label: "Assistant" | Chat panel labeled "Assistant" across all phases. Placeholder name — can be changed later. | Discovery_Design v0.1 |
| Chat Engine: Claude Sonnet 4 | v1 uses `claude-sonnet-4-20250514`, max_tokens 4096, temperature 0.7. API key read from `EXPO_PUBLIC_ANTHROPIC_API_KEY`. | ChatEngine v0.1 §2.1 |
| Chat history sent: phase-scoped, capped at 40 | API call sends only the active phase's messages, last 40 max. Leading assistant messages are stripped (Anthropic requires user-first). | ChatEngine v0.1 §3.3, fix `2fbaf8e` |
| REFINE auto-applied; RETHINK confirmed | Concept edits classed REFINE apply automatically (low risk); RETHINK requires user confirmation via chat. | ChatEngine v0.1 §6.1 |
| Development opening message | Dimension-keyed greeting (CHARACTER / WORLD / THEME / mixed) generated once per project on first Development entry. | ChatEngine v0.1 §9.1 |
| Persistence Phase 2 backend | localStorage via the `KvStorage` abstraction (web only). No `project.json.bak`, no per-project folder, no save queue — all deferred to Phase 5 when a real local server arrives. | DataPersistence Phase 2 implementation note |
| Sample story-element dataset | Development Canvas falls back to a Ready Player One sample dataset when the project has no Concepts yet. Real Concepts take over automatically once consolidation lands. | Development_Design v0.2 §5; `src/development/storyElements.ts` |

---

## Documents Inventory

| File | Type | Status |
|------|------|--------|
| `Spec_Story_Engine_PRD.md` | PRD (Level 1) | ✅ Complete (v0.3) |
| `status/BUILD_STATUS.md` | Companion | ✅ Current file |
| `HARD_RULES.md` | Companion | 🟡 Body font row references an older font — pending Aleo update |
| `OVERVIEW.md` | Companion | ✅ Updated for v0.3 |
| `design/DESIGN.md` | Companion | 🟡 Font references pending Aleo update |
| `Phase_Architecture.md` | Companion | ✅ Present (rationale for Conflict→Theme + Storyline removal) |
| `Templates_SpecDocs.md` | Templates | ✅ Complete (v0.1) |
| `Structure_Map.md` | Structure | ✅ Complete (v0.2) |
| `foundation/Spec_DataModel.md` | Tech Spec (L2) | ✅ Complete (v0.4) — needs a future revision to fold in NoteColor + GapAnalysis |
| `foundation/Spec_DataPersistence.md` | Tech Spec (L2) | ✅ Complete (v0.2) |
| `foundation/Spec_Navigation.md` | Tech Spec (L2) | 🟡 v0.2 — needs v0.3 for three-route entry flow |
| `discovery/Spec_DiscoveryEngine.md` | Tech Spec (L2) | ✅ Complete (v0.1) |
| `discovery/Spec_Discovery_Design.md` | Design Spec (L2) | 🟡 v0.1 — font references (Domine / Noticia Text) need updating to Aleo |
| `chat-engine/Spec_ChatEngine.md` | Tech Spec (L2) | ✅ Complete (v0.2) |
| `development/Spec_Development_Design.md` | Design Spec (L2) | ✅ Complete (v0.2) |
| `start-screen/Spec_SplashScreen_Design.md` | Design Spec (L2) | ✅ Complete (v0.1) |
| `start-screen/Spec_ProjectChooser_Design.md` | Design Spec (L2) | ✅ Complete (v0.1) |
| `start-screen/Spec_StepMenu_Design.md` | Design Spec (L2) | ✅ Complete (v0.1) |

---

## Implementation Progress

| Area | Phase | Status | Files |
|------|-------|--------|-------|
| Infrastructure | Scaffold | ✅ Complete | `package.json`, `tsconfig.json`, `app.json`, `babel.config.js` |
| DataModel | 1 — Types + factories | ✅ Complete | `src/models/types.ts`, `src/models/defaults.ts`, `src/models/factories.ts` |
| DataModel | NoteColor type + DiscoveryNote.color | ✅ Complete | `src/models/noteColors.ts`, `src/models/types.ts`, `src/models/factories.ts` |
| DataModel | Dimension v0.3 (Conflict→Theme, Storyline removed, 29 defaults) | ✅ Complete | `src/models/types.ts`, `src/models/defaults.ts` |
| DataModel | v0.4 — CreativeTag + Concept.definition + Concept.creativeTag | ✅ Complete | `src/models/types.ts`, `src/models/factories.ts` |
| DataModel | createInitialProjectFile bundle | ✅ Complete | `src/models/factories.ts` |
| DataModel | 2 — Relationship helpers | ⬜ | `src/models/relationships.ts` |
| DataModel | 4 — Phase state management | ⬜ | TBD |
| DataPersistence | 1 — Atomic writes + recovery | ✅ Complete | `src/persistence/paths.ts`, `src/persistence/atomicWrite.ts` |
| DataPersistence | 2 — Project lifecycle (localStorage backend) | ✅ Complete | `src/persistence/projectStore.ts`, `src/persistence/storage.ts` |
| DataPersistence | 3 — Save queue | ⬜ | `src/persistence/saveQueue.ts` |
| DataPersistence | 4 — Image management | ⬜ | `src/persistence/imageStore.ts` |
| DataPersistence | 5 — Local server (replaces localStorage backend) | ⬜ | `src/persistence/server.ts` |
| Discovery Engine | 1 — Canvas core | ✅ Complete | `src/engine/discovery/canvasManager.ts` |
| Discovery Engine | 2 — Chat integration (wired in Discovery screen via Chat Engine) | ✅ Complete | `app/project/[projectId]/discovery.tsx`, `src/engine/chat/extraction.ts` |
| Discovery Engine | 3 — Consolidation engine | ⬜ Stubbed | Consolidate button UI exists; engine logs "engine stub (Phase 5)" |
| Discovery Engine | 4 — Gap analysis | ⬜ | not started |
| Discovery Engine | 5 — Re-consolidation + review | ⬜ | not started |
| Chat Engine | 1 — API client + streaming | ✅ Complete | `src/engine/chat/client.ts`, `src/engine/chat/types.ts` |
| Chat Engine | 2 — Context assembly + phase prompts | ✅ Complete | `src/engine/chat/context.ts`, `src/engine/chat/prompts.ts` |
| Chat Engine | 3 — Discovery response parser + extraction | ✅ Complete | `src/engine/chat/parser.ts`, `src/engine/chat/extraction.ts` |
| Chat Engine | 4 — Development chat integration | ✅ Complete | `src/engine/chat/extraction.ts`, `src/engine/chat/refinement.ts` |
| Chat Engine | 5 — Custom ConceptType creation guardrails | ✅ Complete | `src/engine/chat/extraction.ts`, `src/engine/chat/parser.ts` |
| Chat Engine | 6 — Gap-aware conversation + opening message | ✅ Complete | `src/engine/chat/openingMessage.ts`, `src/engine/chat/context.ts` |
| Chat Engine | 7 — Refinement chat integration | ✅ Complete | `src/engine/chat/refinement.ts`, `src/engine/chat/extraction.ts` |
| Entry Flow UI | Splash Screen (with looping video background) | ✅ Complete | `app/index.tsx`, `assets/video/splash.mp4` |
| Entry Flow UI | Project Chooser + inline Project List | ✅ Complete | `app/choose.tsx` |
| Entry Flow UI | Step Menu (Discovery + Development unlocked) | ✅ Complete | `app/project/[projectId]/steps.tsx` |
| Entry Flow UI | Font loading (Barlow 100/400/500, Aleo 400/400i/700) | ✅ Complete | `app/_layout.tsx` |
| Entry Flow UI | Real project IDs + persistence on create | ✅ Complete | `app/choose.tsx` uses `createInitialProjectFile` + `saveProject` |
| Discovery UI | Screen shell + phase header (with back/forward arrows) | ✅ Complete | `app/project/[projectId]/discovery.tsx` |
| Discovery UI | Chat panel wired to Anthropic API (streaming + extraction) | ✅ Complete | `app/project/[projectId]/discovery.tsx` |
| Discovery UI | Color picker (6 swatches) | ✅ Complete | `app/project/[projectId]/discovery.tsx` |
| Discovery UI | Canvas — placement, editing, dragging, deletion, pan | ✅ Complete | `app/project/[projectId]/discovery.tsx` |
| Discovery UI | Consolidate Ideas button (UI only — engine stubbed) | 🟡 Partial | UI complete; `onPress` logs stub message |
| Discovery UI | Project load/save (auto-persist canvas + chat state) | ✅ Complete | `app/project/[projectId]/discovery.tsx` |
| Development UI | Phase 1 — Canvas layout + card rendering (three pillars) | ✅ Complete | `app/project/[projectId]/development.tsx`, `src/development/storyElements.ts` |
| Development UI | Phase 2 — Story Element Detail View | ✅ Complete | `app/project/[projectId]/development.tsx` |
| Development UI | Phase 3 — Compare View + comparison-mode flow | ✅ Complete | `app/project/[projectId]/development.tsx` |
| Development UI | Chat panel wired to Anthropic API (concept extraction + opening message) | ✅ Complete | `app/project/[projectId]/development.tsx` |
| Development UI | Project load/save | ✅ Complete | `app/project/[projectId]/development.tsx` |
| Development UI | Phase 4 — text highlighting, contextual prompts | ⬜ Next up | |

Tests: **196 passing across 13 suites** (factories, canvasManager, atomicWrite, projectStore, chat client/context/parser/extraction/refinement/refinementChat/conceptTypes/openingMessage/gapAware).

---

## Pending Doc Updates

Tracked here so they're not lost between sessions:

- **`foundation/Spec_DataModel.md`** — v0.4 is in place, but the NoteColor + GapAnalysis / ConceptTypeMapping additions still need a roll-up revision. Also worth confirming the Conflict→Theme rename + 29 default ConceptTypes wording is consistent throughout the doc.
- **`HARD_RULES.md`** — Visual Language table, body font row: should read **Aleo**, not Noto Serif (and not Domine / Noticia Text from earlier intermediates).
- **`design/DESIGN.md`** — Typography section: all font references should be **Aleo**. Earlier passes referenced Noto Serif, Noticia Text, and Domine.
- **`discovery/Spec_Discovery_Design.md`** — Any remaining Domine / Noticia Text references should be updated to **Aleo** so the spec matches the implementation.
- **`foundation/Spec_Navigation.md`** — v0.2 defines `/` as a single "Start Screen" route. Needs **v0.3** revision to reflect the three-screen entry flow: `/` (Splash), `/choose` (Project Chooser + Project List), and `/project/:projectId/steps` (Step Menu).

---

## What's Next

**Immediate next step:** Development UI Phase 4 — text highlighting + contextual prompts in the Detail View (per `Spec_Development_Design.md`).

**Other priorities:**
- Discovery Engine Phases 3–5 — wire the Consolidate Ideas button to a real consolidation engine, then gap analysis and re-consolidation.
- DataPersistence Phase 3 — save queue / debounce, replacing the synchronous "save on every state change" pattern in the Discovery + Development screens.
- DataPersistence Phase 4 — image management (needed for any image-generation UI work).
- Spec_InsightsEngine.md / Spec_InsightsPanel_Design.md (Phase E).

**Doc work:** Knock out the items in "Pending Doc Updates" above before they multiply.
