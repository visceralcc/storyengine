# Story Engine — Changelog

All notable changes, logged per session. Tags: `[ui]` `[data]` `[infra]` `[spec]` `[fix]` `[docs]`

---

## 2026-05-26

- [docs] Reconciled BUILD_STATUS.md and CHANGELOG.md with the actual codebase after eight days of undocumented work. Added entries for the Discovery UI build-out, full Chat Engine (Phases 1–7), DataPersistence Phase 2, DataModel v0.3 and v0.4 revisions, Development UI Phases 1–3, font swap to Aleo, splash video, header nav arrows, and the Anthropic chat-history fix. Added a "Pending Doc Updates" section to BUILD_STATUS capturing stale companion specs.
- [infra] Resynced `node_modules/@anthropic-ai/sdk` from the existing lockfile so the chat client test suite runs again. Test count now 196 passing across 13 suites (was 179 passing + 1 failing suite when the SDK was missing on disk).

## 2026-05-21

- [ui] Splash screen now plays a looping background video (`assets/video/splash.mp4`) via a raw `<video>` element resolved through `expo-asset`. Dark `#1A1A1A` container provides the fallback if the video fails to load (Spec_SplashScreen_Design §5.3). Commit 5362052.
- [ui] Discovery and Development phase headers gained back/forward navigation arrows (24px icons, 16px gap to the phase number/name). Header left padding reduced from 82 to 42 to absorb the arrow widths and keep the phase number in its original position. Commit 3861d75.
- [fix] Chat history sent to the Anthropic API now drops any leading assistant messages — the API rejects message arrays that don't start with a `user` turn. Commit 2fbaf8e.
- [ui] Development chat panel wired to the Anthropic API. Streaming responses + `applyConceptExtraction` to create suggested ConceptTypes, new Concepts, REFINE updates, and surface RETHINK proposals as pending confirmations. Commit c1750df.
- [ui] Discovery chat panel wired to the Anthropic API. Streaming responses + stream-of-consciousness extraction (`parseDiscoveryResponse` → `extractDiscoveryNotes`) drops new notes onto the canvas at non-colliding viewport positions. Replaces the previous local-only chat. Commit ab34663.
- [ui] Development UI Phase 3 — Compare View and comparison-mode flow. Two story elements side-by-side, two-card selection, manual connection creation, right→left→canvas dismiss. Commit 7069adf.
- [ui] Development UI Phase 2 — Story Element Detail View. Writing area, IDEA + DEFINITION sections, pillar reassignment, Related Elements panel, dismiss nav. Commit 5968166.
- [ui] Development UI Phase 1 — Canvas layout and card rendering across three pillar columns (Theme / World / Character). Cards render from `src/development/storyElements.ts` — real Concepts when present, otherwise the Ready Player One sample dataset. Commit de36dd1.
- [spec] Added `docs/development/Spec_Development_Design.md` v0.2 and Development UI assets (icons, buttons). Commit ef03996.
- [docs] Synced docs to the Development UI work. Commit 2f6f6b4.

## 2026-05-19

- [data] DataModel v0.3 — Dimension rename: `CONFLICT` → `THEME`, `STORYLINE` dimension removed entirely. Dimension enum is now `WORLD | CHARACTER | THEME`. Default ConceptTypes revised from 41 to 29: 11 World + 13 Character + 5 Theme (Theme, Tone, Subtext, Motif / Symbol, Stakes). The nine Conflict types become Development-phase conversational tools; the eight Storyline types move to the future Refinement beat framework. See `docs/Phase_Architecture.md` for the rationale. Commit 201a368.
- [data] Chat Engine v0.2 aligned with DataModel v0.3 — Conflict→Theme rename propagated through context assembly, phase prompts, and extraction. Commit 23a60bb.

## 2026-05-18 (later sessions)

- [data] Chat Engine Phase 7 — Refinement chat integration: `applyRethink` creates a new versioned ConceptVersion with an incremented `versionNumber` and updates `currentVersionId`; older versions are preserved (DataModel §11 append-only). Commit b0dc036.
- [data] Chat Engine Phase 6 — Gap-aware conversation + Development opening message. `openingMessage.ts` returns the dimension-keyed greeting (CHARACTER / WORLD / THEME / mixed-bag fallback) per Spec_ChatEngine §9.1; gap analysis is folded into the Development context payload. Commit fab4fa6.
- [data] Chat Engine Phase 5 — Custom ConceptType creation guardrails: model-suggested types are validated and deduped against existing defaults before creation. Commit 9f8da75.
- [data] Chat Engine Phase 4 — Development chat integration: `applyConceptExtraction` orchestrates new-Concept creation, REFINE updates via `applyRefine`, and surfaces RETHINK proposals as pending confirmations. Commit c227c87.
- [data] Chat Engine Phase 3 — Discovery response parser + extraction: `parseDiscoveryResponse` pulls the fenced `{notes: []}` JSON; `extractDiscoveryNotes` places DiscoveryNotes at random viewport positions with collision avoidance (up to 10 attempts) per Spec_DiscoveryEngine §2.2. Commit 1d71884.
- [data] Chat Engine Phase 2 — Context assembly + phase prompts: base identity + phase instructions + project context, 40-message history cap (`HISTORY_MESSAGE_CAP`), 50-note Discovery cap (`DISCOVERY_NOTE_CAP`). Commit f2d34a9.
- [data] Chat Engine Phase 1 — Anthropic API client wrapping `@anthropic-ai/sdk` with streaming via `content_block_delta` events, AbortController cancellation, and typed error handling (`NETWORK | API | CANCELLED | EMPTY`). Config read from `EXPO_PUBLIC_ANTHROPIC_API_KEY`. Defaults: `claude-sonnet-4-20250514`, max_tokens 4096, temperature 0.7. Commit a8b3785.
- [docs] Logged DataPersistence Phase 2 completion in BUILD_STATUS. Commit cc9d072.
- [ui] Discovery screen now loads its project on mount via `getDefaultProjectStore().loadProject(projectId)` and persists all canvas state (notes, clusters, chat messages) back to storage on every state change. Commit e05d33c.
- [ui] Project Chooser persists new projects via `saveProject(createInitialProjectFile(...))` and lists saved projects in an inline list under the "Open existing Story" row. Commit 598b305.
- [data] DataPersistence Phase 2 — `projectStore.ts` (`saveProject` / `loadProject` / `listProjects` / `deleteProject`) over a `KvStorage` abstraction with `createMemoryStorage` (tests) and `createLocalStorageStorage` (Expo Web) backends. Departures from spec for v1: no `project.json.bak`, no per-project folder, no save queue — deferred to Phase 5 when a real local server arrives. Commit 1034b11.
- [ui] Body font refactor: replaced remaining Noticia Text + Domine references with **Aleo** (Google Fonts slab serif) across `app/_layout.tsx` and downstream screens. Loads Aleo_400Regular, Aleo_400Regular_Italic, Aleo_700Bold. Commit cae5249.
- [docs] Updated status docs for Discovery UI session — Domine body font (intermediate) + toggle behavior + status. Commit 27e64f5.
- [docs] Logged Discovery UI Phases 2–6 completion. Commit b9750f4.
- [ui] Discovery canvas pan polish + end-to-end flow verification. Commit 1cc9890.
- [ui] Discovery "Consolidate Ideas" button — UI complete with state management (idle / disabled / loading / "too few notes" hint). `onPress` logs an engine stub message; the consolidation engine itself is still pending. Commit 73feee5.
- [ui] Body font refactor: replaced Noticia Text with **Domine** (intermediate step before Aleo, later that same day). Commit 9b71e0c.
- [ui] Discovery canvas — note placement, content editing, dragging, and deletion. Tap empty canvas to drop a note when placement mode is active; double-tap to edit; drag to move; delete via the note's UI. Commit 787a357.
- [ui] Discovery note color picker — six swatches with selection state, driving the color of newly placed notes. Defaults to BLUE. Commit cda2de7.

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
