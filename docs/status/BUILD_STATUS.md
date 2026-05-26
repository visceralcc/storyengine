# Story Engine — Build Status

**Feature map and completion tracker. Surfaced in Command Center.**

Last updated: 2026-05-26

| System | Status |
|---|---|
| Infrastructure — Expo SDK 52 + TypeScript + Jest scaffold | ✅ Complete |
| DataModel — Types, factories, 29 default ConceptTypes | ✅ Complete (v0.4 — Conflict→Theme, CreativeTag, Concept.definition) |
| DataModel — NoteColor + DiscoveryNote.color | ✅ Complete |
| DataModel — createInitialProjectFile bundle | ✅ Complete |
| DataModel — Relationship helpers | 🔲 Not started |
| DataModel — Phase state management | 🔲 Not started |
| DataPersistence — Atomic writes + .bak recovery | ✅ Complete (Phase 1) |
| DataPersistence — Project lifecycle (localStorage backend) | ✅ Complete (Phase 2) |
| DataPersistence — Save queue / debounce | 🔲 Not started (Phase 3) |
| DataPersistence — Image management | 🔲 Not started (Phase 4) |
| DataPersistence — Local server backend | 🔲 Not started (Phase 5) |
| Discovery Engine — Canvas core | ✅ Complete (Phase 1) |
| Discovery Engine — Chat integration (wired in Discovery screen) | ✅ Complete (Phase 2) |
| Discovery Engine — Consolidation engine | 🔲 In progress (UI built, engine stubbed) |
| Discovery Engine — Gap analysis | 🔲 Not started |
| Discovery Engine — Re-consolidation + review | 🔲 Not started |
| Chat Engine — API client + streaming | ✅ Complete (Phase 1) |
| Chat Engine — Context assembly + phase prompts | ✅ Complete (Phase 2) |
| Chat Engine — Discovery response parser + extraction | ✅ Complete (Phase 3) |
| Chat Engine — Development chat integration | ✅ Complete (Phase 4) |
| Chat Engine — Custom ConceptType creation guardrails | ✅ Complete (Phase 5) |
| Chat Engine — Gap-aware conversation + opening message | ✅ Complete (Phase 6) |
| Chat Engine — Refinement chat integration | ✅ Complete (Phase 7) |
| Entry Flow UI — Splash screen with looping video background | ✅ Complete |
| Entry Flow UI — Project Chooser + inline Project List | ✅ Complete |
| Entry Flow UI — Step Menu (Discovery + Development unlocked) | ✅ Complete |
| Entry Flow UI — Font loading (Barlow + Aleo) | ✅ Complete |
| Entry Flow UI — Real project IDs + persistence on create | ✅ Complete |
| Discovery UI — Screen shell + phase header (back/forward arrows) | ✅ Complete |
| Discovery UI — Chat panel wired to Anthropic API | ✅ Complete |
| Discovery UI — Color picker (6 swatches) | ✅ Complete |
| Discovery UI — Canvas (placement, editing, dragging, deletion, pan) | ✅ Complete |
| Discovery UI — Consolidate Ideas button | 🔲 In progress (UI complete, engine stubbed) |
| Discovery UI — Project load/save | ✅ Complete |
| Development UI — Canvas + card rendering (three pillars) | ✅ Complete (Phase 1) |
| Development UI — Story Element Detail View | ✅ Complete (Phase 2) |
| Development UI — Compare View + comparison-mode flow | ✅ Complete (Phase 3) |
| Development UI — Chat panel wired to Anthropic API | ✅ Complete |
| Development UI — Project load/save | ✅ Complete |
| Development UI — Text highlighting + contextual prompts | 🔲 Not started (Phase 4) |
| Spec_ChatEngine.md | ✅ Complete (v0.2) |
| Spec_Development_Design.md | ✅ Complete (v0.2) |
| Spec_DataModel.md | ✅ Complete (v0.4) |
| Spec_DataPersistence.md | ✅ Complete (v0.2) |
| Spec_Navigation.md | 🔲 In progress (v0.2 stale — needs v0.3 for three-route entry flow) |
| Spec_Discovery_Design.md | 🔲 In progress (font references need Aleo update) |
| Spec_InsightsEngine.md | 🔲 Not started |
| Spec_InsightsPanel_Design.md | 🔲 Not started |
| Spec_ImageGeneration.md | 🔲 Not started |
| Spec_Export.md | 🔲 Not started |
| Spec_MCPServer.md | 🔲 Not started |
| Tests | ✅ 196 passing across 13 suites |

## Sprint 05.26.26 — Docs reconciliation + dashboard format

Eight days of undocumented work captured in `CHANGELOG.md` and reflected in this status file. The big-picture state: Discovery UI is feature-complete for v1, Development UI Phases 1–3 are shipped, the full Chat Engine (Phases 1–7) is built and wired into both phase screens, and DataPersistence Phase 2 (localStorage-backed `projectStore`) is live so projects survive page refreshes.

- Reformatted this file to the Command Center 2-column table format
- Created `docs/status/BACKLOG.md` for the dashboard's Backlog panel
- Resynced `@anthropic-ai/sdk` from the lockfile — chat client test suite passes again (196/196 across 13 suites, was 179 + 1 failing suite)
- Captured the pending companion-doc updates (Aleo font references in HARD_RULES / DESIGN / Spec_Discovery_Design; three-route entry flow in Spec_Navigation v0.3; NoteColor + GapAnalysis roll-up into Spec_DataModel)

## History

### Key decisions

- **Four-phase pipeline** — Discovery → Development → Refinement → Production Handoff. Replaced the earlier three-Builder model in PRD v0.3.
- **Unified workspace** — Character / World / Theme are dimensions on one workspace, not separate screens.
- **Dimension rename (DataModel v0.3)** — Conflict → Theme; Storyline dimension removed. Three-dimension model: WORLD / CHARACTER / THEME.
- **29 default ConceptTypes (DataModel v0.3)** — 11 World + 13 Character + 5 Theme. Down from 41 in v0.2.
- **CreativeTag on Concepts (DataModel v0.4)** — `CORE | EVOLVE | SET_ASIDE` curation tag drives the ui_eval bar in Development.
- **Chat Engine** — Claude Sonnet 4 (`claude-sonnet-4-20250514`), max_tokens 4096, temperature 0.7. API key via `EXPO_PUBLIC_ANTHROPIC_API_KEY`. History phase-scoped, capped at 40, leading assistant messages stripped (Anthropic requires user-first).
- **REFINE vs RETHINK** — Concept edits classed REFINE apply automatically; RETHINK requires user confirmation via chat.
- **Persistence Phase 2 backend** — localStorage via the `KvStorage` abstraction. No `project.json.bak`, no per-project folder, no save queue — deferred to Phase 5 when a real local server arrives.
- **Body font: Aleo** — Replaced Noticia Text → Domine → Aleo over the May 18 session.

### Pending doc updates

- `Spec_DataModel.md` — fold in NoteColor + GapAnalysis / ConceptTypeMapping additions
- `HARD_RULES.md` body font row — should read **Aleo**
- `design/DESIGN.md` typography section — references should be **Aleo**
- `Spec_Discovery_Design.md` — remaining Domine / Noticia Text references → **Aleo**
- `Spec_Navigation.md` — v0.3 for the three-screen entry flow (`/`, `/choose`, `/project/:projectId/steps`)

For a fuller decision log and complete commit-level history, see `docs/status/CHANGELOG.md`.
