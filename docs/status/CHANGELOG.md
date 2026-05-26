# Story Engine — Changelog

All notable changes, logged per session. Tags: `[ui]` `[data]` `[infra]` `[spec]` `[fix]` `[docs]`

---

## 2026-05-18

- [data] Implemented NoteColor in code (commit d69afd8). New `src/models/noteColors.ts` exports the `NoteColor` enum (BLUE/GREEN/PURPLE/GOLD/PINK/GRAY), `NOTE_COLOR_HEX` map, `NOTE_COLOR_ORDER`, and `DEFAULT_NOTE_COLOR = BLUE`. `DiscoveryNote` gains a `color: NoteColor` field; `createDiscoveryNote` factory and `canvasManager.createNote` accept an optional color and default to BLUE so existing call sites keep working. Factories test gains 1 new case (20 model tests now; 51 total passing). Spec_DataModel.md still needs a v0.3 revision to reflect this addition.
- [ui] Built Discovery screen shell + phase header (commit 01f019c). Replaces the placeholder route at `app/project/[projectId]/discovery.tsx`: header is "1" (Noticia Text Regular 36pt) + "Discovery" (Barlow Thin 36pt) with subtitle "Get every idea out of your head…" in Noticia Text Bold 20pt and a 30px circular avatar top-right. Content row splits into a 309px chat panel container (#F5F5F5, 10px radius), a 1px #E8E8E8 vertical divider, and an empty white canvas region. Added Noticia Text 400/700 and Barlow Medium font loads to `app/_layout.tsx`.
- [ui] Built Discovery chat panel UI (commit aec56d1). "Assistant" label (Noticia Regular 16pt, #636363) pinned at top of chat container; scrollable message area with AI bubbles left-aligned in Noticia Bold 16pt and user bubbles right-aligned in Noticia Regular 16pt; initial AI greeting "How can I help?"; 198px white text input area with a 26px circular send button at bottom-right. Send appends to a local `messages` array — no AI integration yet. Enter sends, Shift+Enter inserts a newline (Spec_Discovery_Design §10.2 v1 choice). `outlineStyle: 'none'` web-only override on the input to drop the focus ring.
- [docs] Updated BUILD_STATUS.md — Discovery UI rows for screen shell + chat panel marked complete, NoteColor row added under DataModel, test count 50 → 51, current phase line and What's Next updated, Data Model Additions Pending note clarifies NoteColor is now in code but spec is still pending v0.3.

## 2026-05-17

- [ui] Built entry flow UI — Phases 2–5 complete. Four commits on main:
  - Phase 2: Splash screen (`app/index.tsx`) — "STORYENGINE" in Barlow Thin, responsive font size min(260pt, 14vw), white→dark background transition over 500ms simulating video load, tap-anywhere or any-keypress navigation to /choose. Uses Animated API for color transitions (useNativeDriver: false).
  - Phase 3: Project Chooser (`app/choose.tsx`) — two rows ("Open existing Story" / "Start New Story") with Barlow Thin 40pt labels and Noticia Text Bold Italic 24pt annotations ("past" / "prologue"). 922px horizontal rules. Upper-left quadrant composition with percentage-based positioning.
  - Phase 4: Step Menu (`app/project/[projectId]/steps.tsx`) — three phase rows (Discovery / Development / Refinement) in Barlow Thin 96pt. Locked/unlocked visuals (#1A1A1A vs #999999 text, dark vs #D2D2D2 rules). Only Discovery tappable; locked rows use View instead of Pressable.
  - Phase 5: Polish — "Start New Story" now calls `initializeProject({ name: 'Untitled Story' })` for real project IDs. Hover states (opacity 0.7) on tappable rows via onHoverIn/onHoverOut.
- [infra] Installed expo-font, @expo-google-fonts/barlow, @expo-google-fonts/noticia-text.
- [ui] Font loading centralized in `app/_layout.tsx` — Barlow_100Thin and NoticiaText_700Bold_Italic loaded via useFonts, returns null until ready.
- [docs] Updated BUILD_STATUS.md — entry flow implementation complete, Discovery UI marked as next.
- [docs] Created docs/handoffs/ folder with EntryFlow_Phases2-5_Handoff.md and Discovery_Screen_Handoff.md.

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
