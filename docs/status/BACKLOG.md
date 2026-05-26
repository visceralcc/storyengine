# Story Engine — Backlog

Open work tracked for the dashboard. Source of truth for completion state is `BUILD_STATUS.md`.

---

## Up Next

- 🔲 Development UI Phase 4 — text highlighting + contextual prompts in the Detail View [ui]
- 🔲 Discovery Engine — wire Consolidate Ideas button to a real consolidation engine [data]
- 🔲 DataPersistence Phase 3 — save queue / debounce to replace synchronous "save on every state change" [data]

## Discovery Engine

- 🔲 Phase 3 — Consolidation engine (cluster notes, label clusters, classify by dimension) [data]
- 🔲 Phase 4 — Gap analysis against the 29 default ConceptTypes [data]
- 🔲 Phase 5 — Re-consolidation + review flow [data]

## Chat Engine

- ✅ Phase 1 — API client + streaming [data]
- ✅ Phase 2 — Context assembly + phase prompts [data]
- ✅ Phase 3 — Discovery response parser + extraction [data]
- ✅ Phase 4 — Development chat integration [data]
- ✅ Phase 5 — Custom ConceptType creation guardrails [data]
- ✅ Phase 6 — Gap-aware conversation + opening message [data]
- ✅ Phase 7 — Refinement chat integration [data]

## Development UI

- ✅ Phase 1 — Canvas layout + card rendering (three pillars) [ui]
- ✅ Phase 2 — Story Element Detail View [ui]
- ✅ Phase 3 — Compare View + comparison-mode flow [ui]
- 🔲 Phase 4 — Text highlighting + contextual prompts [ui]

## Discovery UI

- ✅ Screen shell + phase header (back/forward arrows) [ui]
- ✅ Chat panel wired to Anthropic API [ui]
- ✅ Color picker (6 swatches) [ui]
- ✅ Canvas — placement, editing, dragging, deletion, pan [ui]
- ✅ Project load/save [ui]
- 🔲 Consolidate Ideas — wire onPress to real engine [ui] [data]

## Data Model

- ✅ Phase 1 — Types + factories [data]
- ✅ NoteColor + DiscoveryNote.color [data]
- ✅ Dimension v0.3 (Conflict→Theme, Storyline removed, 29 defaults) [data]
- ✅ v0.4 — CreativeTag + Concept.definition + Concept.creativeTag [data]
- ✅ createInitialProjectFile bundle [data]
- 🔲 Phase 2 — Relationship helpers [data]
- 🔲 Phase 4 — Phase state management [data]

## Data Persistence

- ✅ Phase 1 — Atomic writes + .bak recovery [data]
- ✅ Phase 2 — Project lifecycle (localStorage backend) [data]
- 🔲 Phase 3 — Save queue / debounce [data]
- 🔲 Phase 4 — Image management [data]
- 🔲 Phase 5 — Local server backend (replaces localStorage) [data]

## Specs — Pending Updates

- 🔲 Spec_DataModel.md — fold in NoteColor + GapAnalysis / ConceptTypeMapping [spec]
- 🔲 HARD_RULES.md — body font row to **Aleo** [spec]
- 🔲 design/DESIGN.md — typography references to **Aleo** [spec]
- 🔲 Spec_Discovery_Design.md — remaining Domine / Noticia Text → **Aleo** [spec]
- 🔲 Spec_Navigation.md — v0.3 for three-route entry flow (`/`, `/choose`, `/project/:projectId/steps`) [spec]

## Specs — Future Phases

- 🔲 Spec_InsightsEngine.md [spec]
- 🔲 Spec_InsightsPanel_Design.md [spec]
- 🔲 Spec_ImageGeneration.md [spec]
- 🔲 Spec_Export.md [spec]
- 🔲 Spec_MCPServer.md [spec]
- 🔲 Level 3 Buildable Units (~22 anticipated, depends on Level 2) [spec]
