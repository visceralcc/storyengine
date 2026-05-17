# Story Engine — Changelog

All notable changes, logged per session. Tags: `[ui]` `[data]` `[infra]` `[spec]` `[fix]` `[docs]`

---

## 2026-05-14

- [infra] Scaffolded Expo SDK 52 + TypeScript + Jest (jest-expo preset). Added nanoid to transformIgnorePatterns so its CJS build resolves under Jest.
- [data] Built DataModel Phase 1 — `src/models/types.ts` (all enums, entity interfaces, GapAnalysis additions from Discovery Engine §10), `src/models/defaults.ts` (41 default ConceptTypes: 11 World + 13 Character + 9 Conflict + 8 Storyline), `src/models/factories.ts` (factories for every entity, `initializeProject` bundle, atomic `createConcept` with first ConceptVersion). 19 unit tests passing.
- [data] Built Discovery Engine Phase 1 — `src/engine/discovery/canvasManager.ts` with `createNote`, `updateNoteContent`, `updateNotePosition`, `isNoteEmpty`, `findNote`, `deleteNote` (drops empty clusters per §4.5). All functions pure; 16 unit tests passing.
- [data] Built DataPersistence Phase 1 — `src/persistence/paths.ts` (StoryEngine folder-layout helpers with overridable root for tests), `src/persistence/atomicWrite.ts` (tmp→bak→rename atomic write, `readWithRecovery` + `readJsonWithRecovery` with .bak fallback and stale-`.tmp` cleanup, `UnrecoverableReadError` when both primary and .bak fail). 15 unit tests passing (40 total across persistence + models + discovery).
- [spec] Completed Spec_Discovery_Design.md v0.1 — Discovery canvas layout, note interaction, 6-color note picker, chat panel ("Assistant"), consolidation states, post-consolidation cluster view, creative gravity indicator. Based on Figma designs (Screen_Discovery 46:34).
- [spec] Design decision: Note colors added to v1. 6-color palette (Blue, Green, Purple, Gold, Pink, Gray). NoteColor type and color field on DiscoveryNote pending DataModel v0.3.
- [spec] Design decision: Body font changed from Noto Serif to Noticia Text. Pending update to HARD_RULES.md and DESIGN.md.
- [spec] Design decision: Chat panel labeled "Assistant" across all phases (placeholder — can change later).
- [docs] Updated BUILD_STATUS.md — Level 2 spec count now 5/13, Phase B Discovery specs complete, new decisions logged.

## 2026-05-13

- [docs] Initialized project documentation structure (CLAUDE.md, CHANGELOG.md, DESIGN.md)
- [docs] Reorganized folder structure: status/, design/ subfolders, specs moved to foundation/
- [docs] Replaced outdated v0.1 foundation specs with v0.2 versions

## 2026-05-12

- [spec] Updated BUILD_STATUS.md, HARD_RULES.md, OVERVIEW.md for PRD v0.3 pipeline model
- [spec] Revised Spec_DataModel.md to v0.2 — added DiscoveryNote, PhaseState, Dimension/Phase enums, 41 default ConceptTypes
- [spec] Revised Spec_DataPersistence.md to v0.2 — schema v2 migration, Discovery entity persistence
- [spec] Revised Spec_Navigation.md to v0.2 — three routes, phase transitions, dimension switching

## 2026-04-27

- [spec] Completed Spec_DataModel.md v0.1 — 7 entities, 35 default ConceptTypes, ID strategy
- [spec] Completed Spec_DataPersistence.md v0.1 — atomic writes, save queue, project-as-folder
- [spec] Completed Spec_Navigation.md v0.1 — two routes, Builder switching, preferences
- [spec] Completed Structure_Map.md v0.1 — 7 feature folders, 11 Level 2 specs, writing order
- [spec] Completed Templates_SpecDocs.md v0.1 — Tech Spec, Design Spec, Buildable Unit templates
- [spec] Completed Spec_Story_Engine_PRD.md v0.2 — all open questions resolved
- [docs] Created BUILD_STATUS.md, HARD_RULES.md, OVERVIEW.md
