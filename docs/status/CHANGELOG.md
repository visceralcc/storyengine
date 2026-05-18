# Story Engine — Changelog

All notable changes, logged per session. Tags: `[ui]` `[data]` `[infra]` `[spec]` `[fix]` `[docs]`

---

## 2026-05-18

- [data] Added NoteColor type (`BLUE | GREEN | PURPLE | GOLD | PINK | GRAY`) and `color` field to DiscoveryNote interface in `src/models/types.ts`. Created `src/models/noteColors.ts` with `NOTE_COLOR_HEX` map and `DEFAULT_NOTE_COLOR`. Updated `createDiscoveryNote` factory and `canvasManager.createNote` to accept color parameter (default BLUE). 51 tests passing.
- [ui] Discovery UI Phase 1 — screen shell at `app/project/[projectId]/discovery.tsx`: phase header ("1" Noticia Text Regular 36pt + "Discovery" Barlow Thin 36pt + subtitle in Noticia Text Bold 20pt #AFAFAF + 30px circular avatar with hardcoded "C" initial), 309px chat panel placeholder (#F5F5F5, 10px radius), 1px #E8E8E8 divider, white canvas area.
- [infra] Loaded additional font weights in `app/_layout.tsx`: Noticia Text Regular, Bold, Italic; Barlow Medium.
- [ui] Discovery UI Phase 2 — chat panel rendering: scrollable AI/user message area with initial "How can I help?" assistant bubble, ~198px multi-line text input with circular send button (26×26, 1px #656363 border), Enter sends / Shift+Enter newline. Messages stored in local state — no AI integration yet.
- [ui] Discovery UI Phase 3 — note color picker: 26×26 circular toggle (using `assets/buttons/button_note_active.svg` and `button_note_inactive.svg`) sits between chat panel and canvas. Inactive on load with swatches hidden. Tap → switches to active SVG, reveals 6 stacked color swatches (BLUE/GREEN/PURPLE/GOLD/PINK/GRAY, 32×32px each, 2px radius), and sets `placementActive = true`. Selected color shows a dark 1.5px ring inset 4px around the swatch. Default selection is BLUE. The toggle is the single entry/exit for placement mode — no separate "Add Note" affordance.
- [ui] Discovery UI Phase 4 — canvas + note placement: pannable white canvas with `overflow: hidden` and an inner "world" View (transform: translateX/Y). Pointer-down on empty backdrop pans when placement is inactive (uses `setPointerCapture` so drag survives leaving the canvas). When placement is active, the canvas shows a 140×140 semi-transparent ghost preview in the selected color following the cursor; click places a note centered on the click in world coordinates and immediately enters edit mode. DiscoveryNoteCard: 140×140, 6px radius, colored bg, 8px padding, Domine_400Regular 14pt. Tap-to-edit (autofocuses TextInput); drag after 150ms or 5px (lifts via scale 1.02 + shadow + zIndex, commits via `canvasManager.updateNotePosition` on release); × on hover deletes via `canvasManager.deleteNote` (stops propagation so it doesn't start a parent drag). Enter / Escape / blur end edit; empty notes auto-delete via `canvasManager.isNoteEmpty`.
- [ui] Discovery UI Phase 5 — Consolidate Ideas button: 48px tall, full chat-panel width (309px), pill-shaped (71px border radius), `#D2D2D2` bg with `#B8B8B8` border, Domine_400Regular 16pt dark text. Wraps the chat panel and button in a vertical `leftColumn` so the chat panel grows (`flex: 1`) and the button pins below. Disabled when notes < 3 (opacity 0.45) — tapping shows a hint "Add a few more ideas first — you need at least 3 notes." that fades after 3s and clears immediately if note count reaches 3. Enabled when notes ≥ 3 (full contrast, hover darkens to `#C4C4C4`). On tap when enabled: console-logs the stub and enters a loading state for ~2.5s with the label changing to "Consolidating..." (UI stub only — no real consolidation engine in v1).
- [ui] Discovery UI Phase 6 — polish: wired trackpad two-finger pan via `onWheel` on the canvas backdrop (wheel deltaX/Y subtract from pan offset, with `preventDefault` to suppress page-scroll fallback). Verified end-to-end: tsc clean, 51/51 tests pass, all four entry-flow routes (`/`, `/choose`, `/project/:id/steps`, `/project/:id/discovery`) load without Metro errors.
- [docs] Updated BUILD_STATUS.md and CHANGELOG.md for full Discovery UI build (Phases 1–6).

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
