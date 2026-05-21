# Story Engine — Structure Map

**Feature organization, spec inventory, and writing order.**

Version 0.3 | May 2026

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial structure. Six feature folders, one foundation folder, full writing order. |
| **0.2** | **May 2026** | **Rewritten for PRD v0.3 pipeline model. `builder/` becomes `workspace/`. New `discovery/` feature folder. Spec inventory and writing order updated. `start-screen/` simplified. Phase management added to foundation.** |
| **0.3** | **May 2026** | **Added `development/` feature folder with `Spec_Development_Design.md`. Development is now its own surface (three-column pillar view + Detail View + Compare View) rather than a mode of `workspace/`. Spec inventory updated to 15 Level 2 specs. Writing order updated. Two open questions resolved.** |

---

## 1. How This Document Works

This is the index for every spec document in the project. It defines how features are organized into folders, what Level 2 and Level 3 specs each feature needs, and what order to write them in.

**Organizing principle: by feature, not by level.** Each feature folder contains its Level 2 spec(s) at the top and `screens/`, `components/`, and `logic/` subfolders for Level 3 Buildable Units. When it's time to build a feature, you open that folder and everything you need is there.

**The Level 3 lists are anticipatory.** They represent our best guess right now. Writing the Level 2 specs will sharpen, add, or remove items from these lists. That's expected — this document gets updated as we go.

---

## 2. Feature Boundaries

Before looking at the file tree, here's why the features are split the way they are. The key test: "Would I ever build this part without building that part?" If yes, they're separate features.

### What IS a feature folder

| Folder | Why it's separate |
|--------|-------------------|
| `foundation/` | Cross-cutting concerns every feature depends on: data model, persistence, navigation, phase management. Must be built first. Has no UI of its own. |
| `start-screen/` | The entry point. Two options: "Start New Story" and "Open Existing Project." Could be built and tested with just the foundation. |
| `discovery/` | The freeform ideation phase: canvas, notes, AI brainstorming, consolidation. This is a distinct interaction model (post-it canvas) from the structured workspace. It exists before Concept Types are introduced. |
| `chat-engine/` | The AI pipeline: concept extraction, prompt design, phase-adaptive behavior, Anthropic API integration. This is pure logic — no UI. The workspace and discovery surfaces consume it, but it exists independently. |
| `development/` | The Development phase surface: three-column pillar view (Theme/World/Character), Story Element Detail View with writing area, and Compare View. Its own interaction model (pillar columns + element expansion + comparison) distinct from both Discovery's freeform canvas and the workspace's card dashboard. |
| `workspace/` | The unified workspace used during Refinement (and potentially shared components with Development). Chat panel + card dashboard + dimension tracking. Replaces the v0.2 `builder/` folder. |
| `insights/` | The cross-dimension analysis engine and its dedicated Insights Panel UI. Could be built after the workspace works without it — it's additive, not structural. |
| `images/` | DALL-E integration and user image uploads. The workspace works without images (text-only cards). Images are an enrichment layer added on top. |
| `export/` | .md export, JSON export, and the local MCP Server. Part of the Production Handoff phase. Entirely separate from the creative workflow — it consumes the data model but doesn't change how the workspace works. |

### What is NOT a feature folder (and why)

| Not a folder | Reason |
|--------------|--------|
| `world/`, `character/`, `conflict/` | These are creative dimensions within the workspace, not separate features. They share identical architecture — different default Concept Types, same UI and behavior. |
| `refinement/` | Refinement reuses the workspace pattern. The workspace adapts its behavior (Storyline types appear, AI becomes an editor) but the surface is the same. |
| `concept-types/` | Concept Types are part of the data model (lives in `foundation/`). They're referenced everywhere but don't have their own UI or logic surface. |
| `versioning/` | Concept versioning is a behavior of the Concept entity, not a standalone system. It lives in the foundation data model and surfaces through the workspace's card components. |
| `chat-ui/` | The chat interface is a component inside `workspace/` and `discovery/`. The AI pipeline logic lives separately in `chat-engine/`. |
| `phase-management/` | Phase transitions and state tracking are a foundation concern, not a standalone feature. The logic is in `foundation/`; the UI is part of the workspace navigation. |

---

## 3. File Tree

```
docs/
├── Spec_Story_Engine_PRD.md                    ← Level 1 (v0.3)
├── Templates_SpecDocs.md                        ← Templates (complete)
├── Structure_Map.md                             ← This file (v0.2)
├── BUILD_STATUS.md                              ← Companion
├── HARD_RULES.md                                ← Companion
├── OVERVIEW.md                                  ← Companion
│
├── foundation/
│   ├── Spec_DataModel.md                        ← Tech Spec (needs v0.3 revision)
│   ├── Spec_DataPersistence.md                  ← Tech Spec (needs minor revision)
│   ├── Spec_Navigation.md                       ← Tech Spec (needs v0.3 revision)
│   └── logic/
│       ├── Logic_ProjectManager.md              ← create, open, save, delete projects
│       ├── Logic_ConceptVersioning.md           ← in-place edits vs. new versions
│       └── Logic_PhaseTransitions.md            ← phase state management, forward/backward movement
│
├── start-screen/
│   ├── Spec_StartScreen_Design.md               ← Design Spec
│   └── screens/
│       └── Screen_StartScreen.md                ← the entry point screen (two options)
│
├── discovery/
│   ├── Spec_DiscoveryEngine.md                  ← Tech Spec (canvas model, consolidation logic)
│   ├── Spec_Discovery_Design.md                 ← Design Spec (canvas UI, note interaction)
│   ├── screens/
│   │   └── Screen_DiscoveryCanvas.md            ← the freeform ideation canvas
│   ├── components/
│   │   ├── Component_DiscoveryNote.md           ← individual note on the canvas
│   │   └── Component_ConsolidationView.md       ← AI grouping review + adjustment
│   └── logic/
│       ├── Logic_NoteManagement.md              ← create, edit, arrange, delete notes
│       ├── Logic_Consolidation.md               ← AI thematic grouping of notes
│       └── Logic_CreativeGravity.md             ← detecting character-first vs. world-first vs. conflict-first
│
├── development/
│   ├── Spec_Development_Design.md                ← Design Spec (v0.2)
│   ├── screens/
│   │   ├── Screen_DevelopmentCanvas.md            ← three-column pillar view
│   │   └── Screen_ElementDetail.md                ← focused writing environment
│   └── components/
│       ├── Component_StoryElementSmall.md          ← glance card (canvas + related panel)
│       ├── Component_WritingArea.md                ← IDEA + DEFINITION sections
│       ├── Component_RelatedElements.md            ← connected elements panel
│       ├── Component_CompareView.md                ← side-by-side element comparison
│       ├── Component_CreativeTagBar.md             ← ui_eval (Core/Evolve/Set Aside)
│       └── Component_ComparisonModeButton.md       ← canvas toggle for comparison selection
│
├── chat-engine/
│   ├── Spec_ChatEngine.md                       ← Tech Spec
│   └── logic/
│       ├── Logic_ConceptExtraction.md           ← parse natural language → Concepts
│       ├── Logic_PromptDesign.md                ← system prompts, context assembly, phase-adaptive behavior
│       ├── Logic_ConceptTypeCreation.md         ← AI + user creating new types
│       └── Logic_PhaseAdaptiveBehavior.md       ← how chat behavior changes per phase
│
├── workspace/
│   ├── Spec_Workspace_Design.md                 ← Design Spec (covers Development + Refinement)
│   ├── screens/
│   │   └── Screen_Workspace.md                  ← the unified workspace layout
│   └── components/
│       ├── Component_ChatPanel.md               ← chat input + message list
│       ├── Component_CardDashboard.md           ← free-form card layout + drag-and-drop
│       ├── Component_ConceptCard.md             ← individual card rendering + edit
│       ├── Component_DimensionIndicator.md      ← World / Character / Conflict tracking
│       └── Component_PhaseNav.md                ← phase navigation + current phase display
│
├── insights/
│   ├── Spec_InsightsEngine.md                   ← Tech Spec (analysis logic)
│   ├── Spec_InsightsPanel_Design.md             ← Design Spec (the panel UI)
│   ├── logic/
│   │   └── Logic_InsightGeneration.md           ← Suggestions, Connections, Conflicts
│   └── components/
│       └── Component_InsightCard.md             ← individual insight card
│
├── images/
│   ├── Spec_ImageGeneration.md                  ← Tech Spec
│   └── logic/
│       ├── Logic_DalleIntegration.md            ← DALL-E API calls, prompt construction
│       └── Logic_ImageUpload.md                 ← user-uploaded found content
│
└── export/
    ├── Spec_Export.md                            ← Tech Spec (export formats)
    ├── Spec_MCPServer.md                        ← Tech Spec (local MCP server)
    └── logic/
        ├── Logic_MarkdownExport.md              ← .md file generation
        ├── Logic_JsonExport.md                  ← JSON export
        └── Logic_MCPServer.md                   ← MCP server implementation
```

---

## 4. Spec Inventory

Every Level 2 spec in the project, with its template type and what PRD sections it deepens.

### Tech Specs

| Spec File | System | PRD Source | Folder |
|-----------|--------|-----------|--------|
| `Spec_DataModel.md` | Project, Discovery Note, Concept, Concept Type, Concept Version, Image, Chat Message, Insight, Phase State entities | PRD §4, §6 | `foundation/` |
| `Spec_DataPersistence.md` | Local server, file format, save/load, project lifecycle | PRD §8 | `foundation/` |
| `Spec_Navigation.md` | Routing between Start Screen and workspace, phase transitions, dimension tracking | PRD §5.1, §5 (pipeline) | `foundation/` |
| `Spec_DiscoveryEngine.md` | Canvas model, note management, consolidation logic, creative gravity detection | PRD §5.2 | `discovery/` |
| `Spec_ChatEngine.md` | Anthropic API integration, concept extraction pipeline, prompt design, phase-adaptive behavior | PRD §5.6, §4 | `chat-engine/` |
| `Spec_InsightsEngine.md` | Cross-dimension concept analysis, Suggestion/Connection/Conflict generation | PRD §5.7 | `insights/` |
| `Spec_ImageGeneration.md` | DALL-E API integration, image upload handling, image attachment to Concepts and Discovery Notes | PRD §5.3 (image generation), §5.8 (image on cards) | `images/` |
| `Spec_Export.md` | .md and JSON export format design, export generation logic, readiness review | PRD §5.5 | `export/` |
| `Spec_MCPServer.md` | Local Node.js MCP Server, queryable concept resources | PRD §5.5 | `export/` |

### Design Specs

| Spec File | Surface Area | PRD Source | Folder |
|-----------|-------------|-----------|--------|
| `Spec_StartScreen_Design.md` | Start Screen: "Start New Story" + "Open Existing Project" | PRD §5.1 | `start-screen/` |
| `Spec_Discovery_Design.md` | Discovery canvas: freeform notes, arrangement, consolidation review | PRD §5.2 | `discovery/` |
| `Spec_Development_Design.md` | Development phase: three-column pillar view, Story Element Detail View, Compare View, Related Elements panel, text highlighting, contextual prompts | PRD §5.3, §5.4 | `development/` |
| `Spec_Workspace_Design.md` | Unified workspace for Refinement: chat panel + card dashboard, dimension tracking, beat framework | PRD §5.4, §5.6, §5.8 | `workspace/` |
| `Spec_InsightsPanel_Design.md` | Insights Panel UI: inbox-style card list, dismiss/accept/act workflow | PRD §5.7 | `insights/` |

### Totals

- 9 Tech Specs (was 8 — added Discovery Engine)
- 5 Design Specs (was 4 — added Development Design)
- 15 Level 2 specs total (was 13)
- ~26 Level 3 Buildable Units (anticipatory — will change)

---

## 5. Feature Dependencies

This shows what depends on what. Read top to bottom — nothing depends on anything below it.

```
foundation/
  ├── Spec_DataModel.md              ← Everything depends on this
  ├── Spec_DataPersistence.md        ← Depends on DataModel
  └── Spec_Navigation.md            ← Depends on DataModel (knows about projects + phases)
        │
        ├──────────────────────┐
        ▼                      ▼
start-screen/               discovery/
  └── Spec_StartScreen_Design.md     ├── Spec_DiscoveryEngine.md
                                     └── Spec_Discovery_Design.md
        │                      │
        └──────────┬───────────┘
                   ▼
           chat-engine/
             └── Spec_ChatEngine.md  ← Depends on DataModel (writes Concepts)
                   │                   + DiscoveryEngine (phase-adaptive behavior)
                   ▼
           development/
             └── Spec_Development_Design.md ← Depends on ChatEngine + DataModel
                   │                          + DiscoveryEngine (consolidation output)
                   ▼
           workspace/
             └── Spec_Workspace_Design.md  ← Depends on ChatEngine + DataModel
                   │
                   ├──────────────────────┐
                   ▼                      ▼
           insights/                   images/
             ├── Spec_InsightsEngine.md   └── Spec_ImageGeneration.md
             └── Spec_InsightsPanel_Design.md
                   │                      │
                   └──────────┬───────────┘
                              ▼
                         export/
                           ├── Spec_Export.md
                           └── Spec_MCPServer.md
```

**Reading the diagram:** Foundation comes first. Start Screen and Discovery both depend on foundation and can be built in parallel. The Chat Engine depends on foundation and benefits from Discovery context (phase-adaptive behavior). The Workspace depends on the Chat Engine. Insights and Images both depend on the Workspace being in place but are independent of each other. Export depends on everything above it.

---

## 6. Writing Order

This is the recommended order for writing Level 2 specs. It follows the dependency chain: foundation first, then pipeline phases, then enrichment layers, then output.

### Phase A — Foundation (write first)

| Order | Spec | Status | Rationale |
|-------|------|--------|-----------|
| 1 | `Spec_DataModel.md` | ✅ v0.4 complete (Discovery NoteColor / GapAnalysis roll-up still pending) | Every other spec references these entities. v0.3 renamed Conflict → Theme; v0.4 added the `definition` / `creativeTag` Concept fields. |
| 2 | `Spec_DataPersistence.md` | ✅ v0.2 complete | Resolves PRD Open Question #3 (project file format). Discovery Notes and Phase State persistence covered. |
| 3 | `Spec_Navigation.md` | ✅ v0.2 complete (needs v0.3 revision for split entry flow — Splash → Chooser → Step Menu) | Routing + phase transitions. Builder switching replaced by phase movement and dimension tracking in unified workspace. |

### Phase B — Discovery (write second)

| Order | Spec | Rationale |
|-------|------|-----------|
| 4 | `Spec_DiscoveryEngine.md` | The canvas model, consolidation logic, and creative gravity detection. New system — no prior spec exists. Write before the Discovery Design Spec so the design knows what data and logic it's working with. |
| 5 | `Spec_Discovery_Design.md` | The canvas UI, note interaction, and consolidation review. Write after the engine spec. |

### Phase C — Core Engine (write third)

| Order | Spec | Rationale |
|-------|------|-----------|
| 6 | `Spec_ChatEngine.md` | The hardest spec in the project. Concept extraction + phase-adaptive behavior (brainstorming in Discovery, extraction in Development, editor in Refinement). Write after Discovery specs so phase transitions are defined. |

### Phase D — Surfaces (write fourth)

| Order | Spec | Rationale |
|-------|------|-----------|
| 7 | `Spec_SplashScreen_Design.md` ✅ v0.1 | First of the entry-flow trio. Full-bleed video + centered title; tap-anywhere-to-continue. |
| 7b | `Spec_ProjectChooser_Design.md` ✅ v0.1 | Second of the entry-flow trio. Two rows ("Open existing Story" / "Start New Story") with italic annotations. |
| 7c | `Spec_StepMenu_Design.md` ✅ v0.1 | Third of the entry-flow trio. Three phase rows (Discovery / Development / Refinement) with sequential locking. |
| 7d | `Spec_Development_Design.md` ✅ v0.2 | Development phase surface: three-column pillar view, Story Element Detail View with IDEA + DEFINITION writing areas, Compare View, Related Elements panel. Reconciled against Figma designs. |
| 8 | `Spec_Workspace_Design.md` | The Refinement surface — unified workspace covering both Development and Refinement phases. Chat panel, card dashboard, dimension tracking, phase-adaptive card behavior. Write after the Chat Engine spec so you know what the chat panel needs to display. |

### Phase E — Enrichment (write fifth)

| Order | Spec | Rationale |
|-------|------|-----------|
| 9 | `Spec_InsightsEngine.md` | Cross-dimension concept analysis: how the system identifies Suggestions, Connections, and Conflicts. |
| 10 | `Spec_InsightsPanel_Design.md` | The Insights Panel UI. Write after the engine spec. |
| 11 | `Spec_ImageGeneration.md` | DALL-E integration and user uploads. Independent of Insights. |

### Phase F — Output (write last)

| Order | Spec | Rationale |
|-------|------|-----------|
| 12 | `Spec_Export.md` | Export formats + readiness review. Needs the full data model. |
| 13 | `Spec_MCPServer.md` | The local MCP Server. Depends on export format decisions and the full data model. Write last. |

### Writing cadence

Don't write all 13 specs before building anything. The recommended approach:

1. Revise Phase A specs (foundation) → build foundation
2. Write Phase B specs (discovery) + Phase C (chat engine) → build Discovery + Chat Engine
3. Write Phase D specs (surfaces) → build Start Screen and Workspace
4. Write Phase E specs (enrichment) → build Insights and Images
5. Write Phase F specs (output) → build Export and MCP Server

Each cycle is: spec → build → learn → spec the next batch.

---

## 7. Cross-Feature Units

Some Buildable Units are used by multiple features. The rule: put it where it was born, cross-reference from elsewhere.

| Unit | Home Folder | Also Used By |
|------|------------|-------------|
| `Component_StoryElementSmall.md` | `development/components/` | `workspace/` (if glance cards appear in Refinement) |
| `Component_ConceptCard.md` | `workspace/components/` | `insights/` (Insight cards reference Concept cards) |
| `Logic_ConceptVersioning.md` | `foundation/logic/` | `workspace/` (versioning UI), `chat-engine/` (deciding edit vs. new version) |
| `Logic_ConceptTypeCreation.md` | `chat-engine/logic/` | `workspace/` (manual type creation from dashboard) |
| `Logic_PhaseTransitions.md` | `foundation/logic/` | `discovery/` (consolidation triggers phase transition), `workspace/` (phase nav UI) |
| `Component_ChatPanel.md` | `workspace/components/` | `discovery/` (brainstorming chat on canvas), `development/` (chat in canvas + Detail View) |

---

## 8. Naming Conventions (Finalized)

| Convention | Pattern | Example |
|------------|---------|---------|
| Spec files (Tech) | `Spec_[SystemName].md` | `Spec_ChatEngine.md`, `Spec_DiscoveryEngine.md` |
| Spec files (Design) | `Spec_[SurfaceArea]_Design.md` | `Spec_Workspace_Design.md`, `Spec_Discovery_Design.md` |
| Screen docs | `Screen_[Name].md` | `Screen_StartScreen.md`, `Screen_DiscoveryCanvas.md` |
| Component docs | `Component_[Name].md` | `Component_ConceptCard.md`, `Component_DiscoveryNote.md` |
| Logic docs | `Logic_[Name].md` | `Logic_ConceptExtraction.md`, `Logic_Consolidation.md` |
| Feature folders | `lowercase-kebab-case` | `chat-engine/`, `start-screen/`, `discovery/`, `workspace/` |
| Concept Types (in prose) | Title Case with spaces | "Time Period", "Fashion Style" |
| Creative dimensions (in prose) | Title Case | "Character", "World", "Conflict" |
| Pipeline phases (in prose) | Title Case | "Discovery", "Development", "Refinement", "Production Handoff" |
| Product name (in UI/docs) | Two words, title case | "Story Engine" |
| Project folder | Lowercase, one word | `storyengine` |

---

## 9. Open Questions

1. **~~Workspace screen vs. phase-specific screens:~~** ✅ Resolved. Development has its own surface (`development/` folder with `Spec_Development_Design.md`). The workspace (`Spec_Workspace_Design.md`) now covers Refinement only. The two phases have sufficiently different interaction models (pillar columns + element expansion vs. card dashboard + beat framework) to justify separate specs.

2. **~~Discovery chat placement:~~** ✅ Resolved. Discovery includes a chat panel on the canvas for brainstorming + stream-of-consciousness extraction (per `Spec_Discovery_Design.md` v0.1). `Component_ChatPanel.md` is shared across `discovery/`, `development/`, and `workspace/`.

3. **Export UI surface:** The current structure has no Design Spec for the export/Production Handoff flow. If the readiness review and export experience need their own screen or modal, a `Spec_ProductionHandoff_Design.md` will be added. To be resolved when writing `Spec_Export.md`.

4. **Consolidation as a screen:** Is consolidation a separate screen (`Screen_ConsolidationReview.md`) or a modal/overlay within the Discovery canvas? To be resolved when writing `Spec_Discovery_Design.md`.

5. **Phase nav component scope:** `Component_PhaseNav.md` might be a global component that lives outside any single feature folder if it appears in both Discovery and Workspace. To be resolved when writing the Design Specs.

---

## 10. Changes from Structure Map v0.1

| Change | v0.1 | v0.2 |
|--------|------|------|
| `builder/` folder | Existed — shared UI for three Builders | Renamed to `workspace/` — unified workspace for Development + Refinement |
| `discovery/` folder | Did not exist | New — freeform ideation canvas + consolidation |
| `Component_BuilderNav.md` | Builder switcher (World/Character/Storyline tabs) | Replaced by `Component_DimensionIndicator.md` (passive tracking) + `Component_PhaseNav.md` (phase movement) |
| Total Level 2 specs | 11 | 13 (added Discovery Engine + Discovery Design) |
| Total Level 3 units (est.) | ~18 | ~22 (Discovery components + phase management logic) |
| Writing phases | A through E (5 phases) | A through F (6 phases — Discovery + Surfaces split) |

---

*This is a living document. The Level 3 Buildable Unit lists are anticipatory and will be revised as Level 2 specs are written. Next step: Revise Phase A foundation specs for v0.3, then write Phase B Discovery specs.*
