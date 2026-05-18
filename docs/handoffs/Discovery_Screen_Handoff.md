# Story Engine — Discovery Screen Build

## Claude Code Handoff Prompt

```
Project: Story Engine
Repo: /Users/charliedenison-mini/dev/storyengine
Branch: main

═══════════════════════════════════════════════════
CONTEXT — READ THESE FILES FIRST (in this order):
═══════════════════════════════════════════════════

1. CLAUDE.md (root — conventions, commit format, session rules)
2. docs/HARD_RULES.md (non-negotiable constraints)
3. docs/design/DESIGN.md (design system tokens — IMPORTANT: body font
   is Noticia Text, NOT Noto Serif. DESIGN.md still says Noto Serif
   but that's a pending update. Use Noticia Text.)
4. docs/discovery/Spec_Discovery_Design.md (THE PRIMARY SPEC — full
   canvas layout, note interaction, color picker, chat panel,
   consolidation states, cluster view, and all visual rules)
5. docs/discovery/Spec_DiscoveryEngine.md (canvas logic, consolidation
   algorithm, layout constants — the engine backing the UI)
6. docs/foundation/Spec_Navigation.md (route context — Discovery lives
   at /project/:projectId/discovery)
7. src/models/types.ts (entity interfaces — NoteColor type needs adding)
8. src/models/factories.ts (createDiscoveryNote factory — needs color param)
9. src/engine/discovery/canvasManager.ts (existing pure functions for
   note CRUD — createNote, updateNoteContent, updateNotePosition,
   deleteNote, isNoteEmpty)

═══════════════════════════════════════════════════
CURRENT STATE
═══════════════════════════════════════════════════

The entry flow is complete and committed (Splash → Project Chooser →
Step Menu). The Discovery route at app/project/[projectId]/discovery.tsx
is a placeholder that just shows "Discovery (placeholder)" and the
projectId.

Engine code exists for Discovery note CRUD (canvasManager.ts) — pure
functions, no React state, no UI. The consolidation engine (Phases 2–5)
is NOT built yet. The chat engine spec (Spec_ChatEngine.md) is not
written yet.

Fonts loaded in app/_layout.tsx: Barlow_100Thin, NoticiaText_700Bold_Italic.
Additional Noticia Text weights (Regular, Bold) and Barlow weights
(Medium) are needed for this screen — install and load them.

50 tests passing. No persistence layer wired yet (projects exist only
in memory).

═══════════════════════════════════════════════════
PRE-WORK — DATA MODEL ADDITIONS
═══════════════════════════════════════════════════

Before building any UI, apply the data model changes from
Spec_Discovery_Design.md §11:

1. Add NoteColor type to src/models/types.ts:
   type NoteColor = "BLUE" | "GREEN" | "PURPLE" | "GOLD" | "PINK" | "GRAY"

2. Add color field to DiscoveryNote interface in types.ts:
   color: NoteColor

3. Add NOTE_COLOR_HEX map (can go in a new src/models/noteColors.ts
   or alongside defaults.ts):
   BLUE: "#5F85F9", GREEN: "#AAE68C", PURPLE: "#DD9CE9",
   GOLD: "#E6D48C", PINK: "#F5A0A0", GRAY: "#B4B4B4"

4. Update createDiscoveryNote factory in factories.ts to accept
   color parameter (default: "BLUE")

5. Update createNote in canvasManager.ts to pass color through

6. Run existing tests (npm test) — fix any that break from the
   new required field. The factory should default to BLUE so
   existing test calls without color still work.

Commit: "feat(data-model): add NoteColor type and color field to DiscoveryNote"

═══════════════════════════════════════════════════
PHASE 1 — SCREEN SHELL + PHASE HEADER
═══════════════════════════════════════════════════

Install additional font weights needed for this screen:
- Noticia Text Regular (400) and Bold (700) — check if
  @expo-google-fonts/noticia-text provides these, add to useFonts
- Barlow Medium (500) — from @expo-google-fonts/barlow, add to useFonts
- Noticia Text Italic (400 italic) — needed for user avatar

Replace the placeholder in app/project/[projectId]/discovery.tsx:

Layout (spec §2, §3.1):
- Full-screen container, white background
- Phase Header spans full width at the top:
  · Left side: "1" in Noticia Text Regular 36pt + "Discovery" in
    Barlow Thin 36pt, with ~72px gap between them. Left edge at x≈82.
  · Right side (positioned right of the chat/canvas divider):
    subtitle "Get every idea out of your head and onto the canvas...
    structure comes later." in Noticia Text Bold 20pt, color #AFAFAF
  · Top-right corner: 30px circle avatar, #E8E8E8 background,
    user initials "CD" in Noticia Text Italic 14pt. Not interactive.

Below the header, the screen splits into two regions:
- LEFT: Chat panel area (309px wide)
- RIGHT: Canvas area (remaining width)
- Separated by a 1px vertical divider (#E8E8E8)

Get the spatial layout and header rendering right before adding
interactive components.

STOP AND CHECK IN.

Commit: "feat(discovery-ui): screen shell with phase header and two-panel layout"

═══════════════════════════════════════════════════
PHASE 2 — CHAT PANEL (STATIC)
═══════════════════════════════════════════════════

Build the chat panel container in the left region (spec §3.2):

- 309px wide, full content height, Surface background (#F5F5F5),
  10px corner radius
- Panel label "Assistant" — Noticia Text Regular 16pt, #636363,
  top-left, FIXED (does not scroll with messages)
- Chat message area (scrollable):
  · Initial state: single AI message "How can I help?" in
    Noticia Text Bold 16pt, #636363, left-aligned
  · AI messages left-aligned, user messages right-aligned
  · No actual AI integration yet — just render the initial message
- Text input area at bottom:
  · White background (#FFFFFF), 10px rounded corners
  · Generous height (~198px) to invite stream-of-consciousness
  · Circular send button: 26px diameter, #656363 border, arrow icon
    (use a simple "↑" or "→" character for now if no icon library)
  · Input field placeholder: something minimal like "Type here..."
  · Send button taps: for now, append the user's message to a local
    messages array and display it in the chat area. No AI response
    yet — just show the user message appearing in the conversation.

STOP AND CHECK IN.

Commit: "feat(discovery-ui): chat panel with message display and text input"

═══════════════════════════════════════════════════
PHASE 3 — NOTE COLOR PICKER
═══════════════════════════════════════════════════

Build the color picker strip (spec §3.3):

- Positioned vertically along the divider between chat and canvas
- 6 color swatches, each 32×32px with 2px corner radius
- Colors in order: Blue, Green, Purple, Gold, Pink, Gray
  (use the NOTE_COLOR_HEX values from the data model)
- Currently selected swatch has a visual indicator (darker border
  or subtle highlight)
- Default selection: Blue
- Tapping a swatch updates the selected color in local state
- Above the color swatches: a small note icon that serves as the
  "Add Note" button. Use a simple "+" or sticky-note emoji/icon
  as placeholder. Tapping it should activate placement mode (we'll
  wire that in Phase 4).

STOP AND CHECK IN.

Commit: "feat(discovery-ui): note color picker with six swatches and selection state"

═══════════════════════════════════════════════════
PHASE 4 — CANVAS + NOTE PLACEMENT
═══════════════════════════════════════════════════

Build the canvas and note interaction (spec §3.4, §4.1, §4.2):

Canvas:
- White background, fills all remaining space right of divider
- Implement pan: click/drag on empty canvas space moves the viewport.
  Track a viewOffset {x, y} in state. Notes render at
  (note.position.x - viewOffset.x, note.position.y - viewOffset.y).
- No grid, no snap, no alignment guides

Note placement flow (spec §4.1):
1. User taps "Add Note" icon → enters placement mode
2. A ghost preview (semi-transparent 140×140px square in the
   selected color) follows the cursor on the canvas
3. User clicks a location → note created at that position using
   createNote from canvasManager.ts, with the selected NoteColor
4. Note immediately enters edit mode (TextInput focused)
5. Edit ends on blur, Escape, or Enter
6. If note is empty on edit-end → auto-delete (isNoteEmpty check)

Note rendering (spec §7):
- 140×140px, 6px corner radius
- Background: the note's color from NOTE_COLOR_HEX
- Text: Noticia Text Bold 14pt, dark text (#1A1A1A)
- Position absolutely on canvas at note.position

Note interaction (spec §4.2):
- Tap → enter edit mode (TextInput replaces Text)
- Drag → move note (update position via updateNotePosition).
  Use 150ms hold or 5px movement threshold to distinguish
  tap from drag. Slight visual lift during drag (scale or shadow).
- Delete × button → appears on hover (desktop). Tapping × calls
  deleteNote from canvasManager. No confirmation dialog.

Store notes in a local useState array. Use the canvasManager pure
functions for all operations, then update state with the results.

STOP AND CHECK IN.

Commit: "feat(discovery-ui): canvas with note placement, editing, dragging, and deletion"

═══════════════════════════════════════════════════
PHASE 5 — CONSOLIDATE BUTTON + STATIC CLUSTER VIEW
═══════════════════════════════════════════════════

Build the Consolidate Ideas button (spec §3.5, §5.2):

- Positioned below the chat panel, full chat panel width (309px)
- Pill-shaped (71px border radius), #D2D2D2 background, #B8B8B8 border
- "Consolidate Ideas" in Noticia Text Regular 16pt, dark text
- Disabled when fewer than 3 notes exist (grayed out, non-interactive)
- Enabled at 3+ notes (full contrast, interactive)
- When disabled and tapped: show "Add a few more ideas first —
  you need at least 3 notes." below the button, fades after 3s

On tap (when enabled): for now, just console.log('Consolidation
triggered') and show the loading state text "Consolidating..." on
the button. The actual consolidation engine (AI clustering) is
not built yet — that's a separate phase. We're just building the
UI harness.

Optionally, if time permits: build a mock cluster view to verify
the post-consolidation layout works visually. Create 2-3 fake
clusters with hard-coded data, render notes inside cluster border
boxes (1px #E8E8E8 border, 8px radius, 20px padding, label in
Barlow Medium 14pt above). This tests the visual design without
needing the real consolidation engine.

STOP AND CHECK IN.

Commit: "feat(discovery-ui): Consolidate Ideas button with state management"

═══════════════════════════════════════════════════
PHASE 6 — POLISH + INTEGRATION
═══════════════════════════════════════════════════

1. Wire canvas pan for trackpad (two-finger scroll should pan in
   all directions — this may need onWheel handling on web)

2. Verify the full flow end-to-end:
   Splash → Chooser → "Start New Story" → Step Menu → tap Discovery
   → Discovery canvas loads with empty state, chat shows "How can I
   help?", color picker has Blue selected, Consolidate disabled

3. Test note lifecycle: place a note, type content, tap away to
   deselect, tap again to re-edit, drag to new position, delete
   via × button. Place 3+ notes, verify Consolidate button enables.

4. Run tests: npm test — all 50+ should still pass.

5. Optional: add smoke tests for the Discovery screen rendering.

Commit: "feat(discovery-ui): canvas pan polish and end-to-end flow verification"

═══════════════════════════════════════════════════
KEY CONSTRAINTS
═══════════════════════════════════════════════════

- Web-first — test in browser
- Discovery notes are 140×140px, 6px corner radius, colored backgrounds
- Chat panel is exactly 309px wide, Surface (#F5F5F5) background
- Canvas is unbounded — pan in all directions, no boundaries
- No AI integration yet — chat accepts input and displays messages
  locally, but doesn't call any API. Consolidation button shows
  loading state but doesn't run the real algorithm.
- The existing canvasManager.ts functions are your source of truth
  for note operations — use them, don't rewrite the logic
- Pill button (71px radius) and circular avatar (50% radius) are
  approved exceptions to the 12px corner radius HARD_RULE
- DO NOT BUILD: AI chat responses, actual consolidation algorithm,
  gap analysis, Development phase transition, or anything beyond
  the Discovery canvas UI shell
- Commit after each phase with conventional commit messages
- Work phase by phase — stop and check in after each phase
```
