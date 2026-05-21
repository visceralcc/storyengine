# Story Engine — Build Status

**Last updated:** May 21, 2026 (Discovery + Development chat panels wired to the Anthropic API)

---

## Current Phase: Implementing (Chat Engine Phases 1–7 complete)

Implementation has begun. Project scaffolded (Expo SDK 52 + TypeScript + Jest). DataModel Phase 1, Discovery Engine Phase 1, DataPersistence Phases 1–2, and **all seven Chat Engine phases** are complete with passing unit tests. The full entry flow UI (Splash → Project Chooser → Step Menu) is built and committed. The Discovery Screen UI shell is complete end-to-end and now persisted: notes, clusters, and chat messages load from disk on mount and save back on every change via `projectStore`. The Project Chooser saves new projects and lists saved ones inline. The Chat Engine is now end-to-end ready: streaming Anthropic API client (Phase 1), phase-adaptive system prompts + context assembly with 40-message / 50-note caps (Phase 2), Discovery response parser + viewport-placement extraction with collision avoidance (Phase 3), Development/Refinement response parsing + Concept/ConceptType/Version creation + REFINE/RETHINK refinement (Phase 4), custom ConceptType creation guardrails (Phase 5), Development opening-message generator + gap-aware system prompt assembly (Phase 6), and Refinement integration with Storyline ConceptTypes + editorial-voice prompt (Phase 7). Both chat panels (Discovery and Development) are now wired to the Anthropic API through the Chat Engine pipeline — streaming responses, Discovery note extraction, and Development concept extraction all run in the live app. The Development UI is now under construction: Phases 1–3 are complete — the three-column canvas with story element cards and ui_eval bars, the Story Element Detail View (writing area, IDEA + DEFINITION sections, pillar reassignment, Related Elements panel), and the Compare View with the comparison-mode two-card selection flow. Remaining: Development UI Phase 4 polish — text highlighting from chat and contextual prompts (the chat-to-AI wiring itself is now complete).

---

## Ideas-to-Code Progress

| Step | Document | Status | Notes |
|------|----------|--------|-------|
| 1 | PRD | ✅ Complete | `Spec_Story_Engine_PRD.md` — v0.3, four-phase pipeline model |
| 2 | Templates | ✅ Complete | `Templates_SpecDocs.md` — Tech Spec, Design Spec, Buildable Unit templates |
| 3 | Structure Map | ✅ Complete | `Structure_Map.md` — v0.2, rewritten for pipeline model. 8 feature folders, 13 Level 2 specs. |
| 4 | Level 2 Specs | 🟡 In progress | 10 of 15 complete |
| 5 | Level 3 Buildable Units | ⬜ Not started | ~22 anticipated, depends on Level 2 |
| 6 | Claude Code Handoff | 🟡 In progress | Entry flow implemented; Discovery UI next |
| 7 | Spec Updates | ⬜ Not started | Ongoing as implementation reveals gaps |

---

## Level 2 Spec Writing Order

From `Structure_Map.md` §6. Write in this order, build after each phase.

| Phase | Order | Spec | Status |
|-------|-------|------|--------|
| A — Foundation | 1 | `Spec_DataModel.md` | ✅ Complete (v0.4) |
| A — Foundation | 2 | `Spec_DataPersistence.md` | ✅ Complete (v0.2) |
| A — Foundation | 3 | `Spec_Navigation.md` | ✅ Complete (v0.2) |
| B — Discovery | 4 | `Spec_DiscoveryEngine.md` | ✅ Complete (v0.1) |
| B — Discovery | 5 | `Spec_Discovery_Design.md` | ✅ Complete (v0.1) |
| C — Core Engine | 6 | `Spec_ChatEngine.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7 | `Spec_SplashScreen_Design.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7b | `Spec_ProjectChooser_Design.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7c | `Spec_StepMenu_Design.md` | ✅ Complete (v0.1) |
| D — Surfaces | 7d | `Spec_Development_Design.md` | ✅ Complete (v0.2) |
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
| 41 default ConceptTypes | ~~11 World + 13 Character + 9 Conflict + 8 Storyline, seeded per project~~ Superseded by v0.3 | DataModel v0.2 |
| Three creative dimensions | Character, World, Theme (replaces Character, World, Conflict/Storyline) | Phase_Architecture v0.1, DataModel v0.3 |
| 29 default ConceptTypes | 11 World + 13 Character + 5 Theme, seeded per project | DataModel v0.3 |
| Conflict as AI lens | Conflict types (Central, Internal, Interpersonal, Societal, Catalyst, Escalation) become Development-phase conversational tools, not ConceptTypes | DataModel v0.3, Phase_Architecture v0.1 |
| Storyline as beat framework | Story Arc, Plot, Pacing, Narrative POV etc. move to Refinement beat framework (spec TBD), not ConceptTypes | DataModel v0.3, Phase_Architecture v0.1 |
| Theme ConceptTypes | Theme, Tone, Subtext, Motif / Symbol, Stakes | DataModel v0.3 |
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
| Development Design v0.2 reconciled | Figma designs reconciled against spec — font to Aleo, gradient columns, 10px radius, ui_eval bar (Core/Evolve/Set Aside), Detail View with IDEA + DEFINITION sections, Compare View with dismiss flow, comparison mode button, pillar reassignment dropdown | Development_Design v0.2 |
| definition field on Concept | Separate `definition: string \| null` field preserves Discovery summary in `value` while storing expanded writing | Development_Design v0.2 |
| creativeTag field on Concept | `'CORE' \| 'EVOLVE' \| 'SET_ASIDE'` maps to ui_eval bar color; defaults to CORE | Development_Design v0.2 |
| ui_eval tag colors | Core=#9CCBAC green, Evolve=#F2BA03 yellow, Set Aside=#AA5959 red | Development_Design v0.2 |
| Comparison mode via canvas button | Two-tap selection on canvas enters Compare View; also creates manual connection between elements | Development_Design v0.2 |
| Dismiss navigation via × button | Circle × is primary back control: Compare right → Detail left → Canvas | Development_Design v0.2 |
| Pillar reassignment in Detail View | Tappable pillar header opens dropdown to change element's dimension | Development_Design v0.2 |
| Character cards use bullet format | Character story element cards display traits/motivations as bullet points, not paragraphs | Development_Design v0.2 |
| Story Elements mental model | User-facing term for Concepts in Development — creative building blocks, not database taxonomy | Development Brief |
| Focus model for Development | One dimension at a time; other two recede. Creative gravity determines initial focus. | Development Brief |
| Element detail as focused view | Tapping a story element opens focused detail view (exact pattern TBD in Figma) | Development Brief |
| Contextual relationships | Cross-element connections shown when focused on an element, not as a global web | Development Brief |
| Core / Evolve / Set Aside | Three-state creative tag on story elements: Core (central), Evolve (needs work), Set Aside (parked) | Development Brief |
| Development canvas sample data | When a project has no consolidated Concepts, the canvas renders a Ready Player One sample dataset; real Concepts take over automatically once consolidation is wired | Development UI Phase 1 |
| Development reachable from Step Menu | "Development" row on the Step Menu unlocked, routes to `/project/:id/development` | Development UI Phase 1 |
| Detail View is an in-screen mode | The Story Element Detail View is a state within the Development screen (dissolve swap with the canvas), not a separate route — matches "replaces the canvas view" (Spec §3.2) | Development UI Phase 2 |
| Development chat is workspace-scoped | Chat state (messages, streaming, pending RETHINKs) lifted to DevelopmentWorkspace so one continuous conversation is shared across the Canvas/Detail/Compare surfaces; the full ProjectFile is held in workspace state so each extraction's context sees the latest concepts | Development UI Phase 4a |

---

## Data Model Additions Pending

`Spec_DataModel.md` v0.4 added the `CreativeTag` enum and the `definition` / `creativeTag` fields on the Concept entity (per `Spec_Development_Design.md` §6.1) — these are now reconciled with `src/models/types.ts`.

Still pending a future revision: the Discovery Engine spec (v0.1) `GapAnalysis` and `ConceptTypeMapping` interfaces plus the `PhaseState.discovery.gapAnalysis` field, and the Discovery Design spec (v0.1) `NoteColor` type with `color: NoteColor` on `DiscoveryNote`. All of these already exist in `src/models/types.ts`; the spec needs to catch up.

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
| foundation/Spec_DataModel.md | Tech Spec (Level 2) | ✅ Complete (v0.4) |
| `foundation/Spec_DataPersistence.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) |
| `foundation/Spec_Navigation.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) |
| `discovery/Spec_DiscoveryEngine.md` | Tech Spec (Level 2) | ✅ Complete (v0.1) |
| `discovery/Spec_Discovery_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.1) |
| `chat-engine/Spec_ChatEngine.md` | Tech Spec (Level 2) | ✅ Complete (v0.2) |
| `start-screen/Spec_SplashScreen_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.1) |
| `start-screen/Spec_ProjectChooser_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.1) |
| `start-screen/Spec_StepMenu_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.1) |
| `design/Development_Screen_Brief.md` | Design Brief | ✅ Complete |
| `development/Spec_Development_Design.md` | Design Spec (Level 2) | ✅ Complete (v0.2) |

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
| Discovery Engine | 2 — Chat integration | ✅ Complete | Discovery chat panel wired to the Chat Engine in `app/project/[projectId]/discovery.tsx` |
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
| **Discovery UI** | **Chat AI wiring** | **✅ Complete** | **`app/project/[projectId]/discovery.tsx`, `.env`** |
| Chat Engine | 1 — API client + streaming | ✅ Complete | `src/engine/chat/types.ts`, `src/engine/chat/client.ts` |
| Chat Engine | 2 — Context assembly | ✅ Complete | `src/engine/chat/prompts.ts`, `src/engine/chat/context.ts` |
| Chat Engine | 3 — Discovery chat integration | ✅ Complete | `src/engine/chat/parser.ts`, `src/engine/chat/extraction.ts` |
| Chat Engine | 4 — Development chat integration | ✅ Complete | `src/engine/chat/parser.ts` (parseExtractionResponse), `src/engine/chat/refinement.ts`, `src/engine/chat/extraction.ts` (applyConceptExtraction) |
| Chat Engine | 5 — Custom ConceptType creation | ✅ Complete | `src/engine/chat/prompts.ts` (Development §7 guardrails) + integration tests in `__tests__/conceptTypes.test.ts` |
| Chat Engine | 6 — Gap-aware conversation | ✅ Complete | `src/engine/chat/openingMessage.ts` + integration tests in `__tests__/gapAware.test.ts` (gap-analysis wiring already shipped in Phase 2) |
| Chat Engine | 7 — Refinement chat integration | ✅ Complete | End-to-end integration tests in `__tests__/refinementChat.test.ts` (prompt + Storyline context widening already shipped in Phase 2) |
| **Development UI** | **Data model — `definition` + `creativeTag`** | **✅ Complete** | **`src/models/types.ts`, `src/models/factories.ts`** |
| **Development UI** | **Phase 1 — Canvas layout + card rendering** | **✅ Complete** | **`app/project/[projectId]/development.tsx`, `src/development/storyElements.ts`, `app/_layout.tsx`, `app/project/[projectId]/steps.tsx`** |
| **Development UI** | **Phase 2 — Story Element Detail View** | **✅ Complete** | **`app/project/[projectId]/development.tsx`, `assets/icons/icon_pencil.svg`** |
| **Development UI** | **Phase 3 — Compare View + comparison flow** | **✅ Complete** | **`app/project/[projectId]/development.tsx`** |
| **Development UI** | **Phase 4a — Chat panel wired to the AI** | **✅ Complete** | **`app/project/[projectId]/development.tsx`** |
| Development UI | Phase 4b — Text highlighting + contextual prompts | ⬜ | not started |

Tests: 193 passing (20 model, 16 canvas, 28 persistence, 129 chat).

---

## What's Next

**Immediate next step:** Development UI Phase 4b — text highlighting from chat (Spec §4.3) and contextual prompts (§4.4). The Discovery and Development chat panels are now wired to the Anthropic API through the Chat Engine pipeline (Phase 4a complete).

**Also completed this session:**
- `Spec_Development_Design.md` v0.2 — reconciled against four Figma screens (Canvas, Story Element Small, Detail View, Compare View). 6 of 7 open questions resolved. Only remaining open question: Refinement phase unlock trigger.

**Previous immediate next step (superseded):** ~~Design the Development screen in Figma using `docs/design/Development_Screen_Brief.md` as the creative direction. The brief captures conceptual decisions from the May 2026 thought experiment: three-level hierarchy (dimension → element → detail), focus model (one dimension at a time), Core/Evolve/Set Aside element tagging, contextual relationships, and Ready Player One example content for the comp. Once Figma designs are complete, bring them to a new thread to write `Spec_Development_Design.md`.

**Also pending:**

- **Discovery Engine Phases 3–5 (consolidation → gap analysis → re-consolidation).** The Discovery chat panel is now wired to the AI; the "Consolidate Ideas" button is still a UI stub. Building consolidation unblocks gap analysis and feeds the gap-aware Development chat.

- **`Spec_DiscoveryEngine.md` revision.** References "Conflict" in gap analysis and consolidation dimension mapping. Needs a pass to align with the Conflict→Theme rename (DataModel v0.3, ChatEngine v0.2).

- **Refinement beat framework spec.** Story Arc, Plot, Plot Twist, Sub-plot, Pacing, Narrative POV, Catalyst, and Escalation moved out of the ConceptType system into a structural beat framework for Refinement. This system needs its own spec — the data model, framework selection (Simple/Standard/Detailed/Freeform/Custom per Phase_Architecture §3), and how beats interact with existing Concept cards.

- **`Phase_Architecture.md` §8 cleanup.** Open question #1 (Theme ConceptTypes) is now resolved — can be marked closed.

**Companion doc updates still pending:**

- **DataModel — Discovery roll-up.** A future revision should roll up the in-code `NoteColor` type and the `GapAnalysis` / `ConceptTypeMapping` interfaces from `Spec_Discovery_Design.md` v0.1 and `Spec_DiscoveryEngine.md` v0.1. (DataModel v0.4 added the Development `definition` / `creativeTag` fields; the Discovery additions are still outstanding.)

- **Navigation spec update.** `Spec_Navigation.md` (v0.2) defines `/` as a single "Start Screen" route. The implemented routing is now `/` (Splash), `/choose` (Project Chooser), `/project/:projectId/steps` (Step Menu), `/project/:projectId/discovery`, and `/project/:projectId/development` (added this session; reachable from the now-unlocked Step Menu row). The Development screen also swaps between its Canvas / Detail / Compare surfaces internally without a route change. Needs a v0.3 revision to capture the full route table.
