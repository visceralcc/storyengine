# Story Engine — Discovery Canvas Specification

**UX & Interaction Design**

Version 0.1 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | May 2026 | Initial draft. Full Discovery canvas layout, note interaction, color picker, chat panel, consolidation states, post-consolidation cluster view, phase header, and Consolidate Ideas button. Based on Figma designs (Screen_Discovery 46:34) and Discovery Engine spec v0.1. |

---

## 1. Overview

The Discovery canvas is the first creative surface the user encounters after creating a project. It provides a freeform, spatial workspace for capturing raw ideas as sticky-note-style cards on an unbounded canvas, alongside a chat panel for AI-assisted brainstorming and stream-of-consciousness extraction.

**Design principle: The canvas is a wall of post-its, not a document.** Every visual decision should reinforce the feeling of tacking ideas to a wall — casual, spatial, low-commitment. Notes are small, lightweight, and movable. The canvas is generous and open. Nothing here should feel structured, final, or database-like. Structure comes later (Development) — Discovery is for volume.

**User goals:**
- Capture every creative idea without worrying about organization
- Use the chat as a brainstorming partner to generate ideas or extract notes from stream-of-consciousness input
- Choose note colors to visually distinguish ideas by personal meaning (no enforced semantics)
- Consolidate ideas into thematic clusters when ready
- Review and adjust clusters before moving to Development

**Scope boundary — this surface does NOT:**
- Display Concept cards or Concept Type labels (those emerge in Development — see `Spec_Workspace_Design.md`)
- Show Insights Panel content (Insights are inactive during Discovery — see `Spec_DiscoveryEngine.md` §12)
- Handle phase transitions (see `Spec_Navigation.md` §3.5)
- Render the Start Screen or Step Menu (see `Spec_StartScreen_Design.md`)
- Display Development or Refinement workspace views

---

## 2. Surface Inventory

| Surface | Type | Purpose |
|---------|------|---------|
| Discovery Screen | Screen | The full-screen container holding all Discovery surfaces |
| Phase Header | Region | Displays current phase number, name, and subtitle guidance text |
| Chat Panel | Panel | Left-side panel for AI brainstorming and stream-of-consciousness extraction |
| Canvas | Region | Right-side unbounded 2D surface where notes are placed and arranged |
| Note Color Picker | Control | Vertical strip of color swatches between chat panel and canvas for selecting note color |
| Discovery Note | Component | Individual sticky-note card placed on the canvas |
| Consolidate Ideas Button | Control | Bottom-left action button that triggers AI consolidation |
| Cluster Border | Component | Post-consolidation: labeled rectangular border grouping notes by theme |
| User Avatar | Control | Top-right avatar circle showing user initials |

---

## 3. Information Hierarchy

### 3.1 Phase Header

The top bar spans the full screen width and establishes context.

**Always visible:**
- Phase number: "1" — displayed in Noticia Text Regular 36pt, dark text (`#1A1A1A`), left-aligned at approximately x=82
- Phase name: "Discovery" — displayed in Barlow Thin 36pt, dark text, positioned to the right of the phase number with generous spacing (approximately 72px gap)
- Subtitle guidance: "Get every idea out of your head and onto the canvas...structure comes later." — displayed in Noticia Text Bold 20pt, secondary text color (`#AFAFAF`), positioned to the right of the divider line between chat panel and canvas. This text is read-only.

**Top-right corner:**
- User avatar: a 30px circle with the user's initials in Noticia Text Italic 14pt. Background is Surface Alt (`#E8E8E8`). This is a placeholder for future user/settings functionality — not interactive in v1 beyond visual presence.

### 3.2 Chat Panel

The chat panel occupies the left side of the screen, approximately 309px wide, with a Surface background (`#F5F5F5`), rounded corners (10px), and runs the full height of the content area below the phase header.

**Information hierarchy (top to bottom):**
1. **Panel label:** "Assistant" — Noticia Text Regular 16pt, secondary text color (`#636363`). Top-left of the panel.
2. **Chat message area:** Scrollable region displaying the conversation. AI messages appear left-aligned, user messages appear right-aligned (or with distinct styling — see §7). Initial state shows a single AI message: "How can I help?" in Noticia Text Bold 16pt, secondary text color.
3. **Text input area:** White background (`#FFFFFF`), rounded corners (10px), positioned at the bottom of the panel. Contains a text field for user input and a circular send button (26px diameter, `#656363` border, 13px radius, with an arrow icon inside). The input area has generous height (approximately 198px) to invite longer-form stream-of-consciousness input.

**Panel label is fixed (does not scroll).** The chat message area scrolls independently. The text input area is anchored to the bottom.

### 3.3 Note Color Picker

A vertical strip of 6 color swatches positioned between the chat panel and the canvas, rotated 90° to sit along the divider line. Each swatch is a 32×32px square with 2px corner radius.

**Color palette (top to bottom):**

| Order | Color Name | Hex | Code Value |
|-------|-----------|-----|------------|
| 1 | Blue | `#5F85F9` | `BLUE` |
| 2 | Green | `#AAE68C` | `GREEN` |
| 3 | Purple | `#DD9CE9` | `PURPLE` |
| 4 | Gold | `#E6D48C` | `GOLD` |
| 5 | Pink | `#F5A0A0` | `PINK` |
| 6 | Gray | `#B4B4B4` | `GRAY` |

**Behavior:**
- The currently selected color is indicated by a subtle visual marker (e.g., a darker border or checkmark overlay). Default selection on screen load: Blue.
- Tapping a swatch selects that color. The next note created (manually or via AI extraction) uses the selected color.
- The color picker is always visible during the pre-consolidation state. It may be hidden or deprioritized post-consolidation (see §5.3).
- A small note icon sits above the color swatches, acting as the "Add Note" button. Tapping it activates placement mode (see §4.1).

### 3.4 Canvas

The canvas occupies all remaining horizontal space to the right of the chat panel and divider. It has a white background (`#FFFFFF`) and is visually separated from the chat panel by a thin vertical divider line (1px, Surface Alt `#E8E8E8`).

**Pre-consolidation:** The canvas shows individual Discovery Notes at their x/y positions. Notes can overlap. The canvas pans in all directions (drag-to-pan on empty space). No grid, no snap-to, no alignment guides.

**Post-consolidation:** Notes are rearranged into cluster groups with labeled border boxes (see §5.3). Cluster labels appear above each border box. Notes can still be dragged between clusters.

**Always visible:** The canvas is never hidden. It is the primary surface of the Discovery screen.

### 3.5 Consolidate Ideas Button

Positioned below the chat panel, full width of the chat panel (309px), horizontally centered. Pill-shaped (71px border radius), with a gray background (`#D2D2D2`), a subtle border (`#B8B8B8`), and "Consolidate Ideas" text in Noticia Text Regular 16pt, dark text.

**Always visible** at the bottom-left of the screen, below the chat panel. Its state changes based on note count (see §5).

---

## 4. Interaction Patterns

### 4.1 Manual Note Placement

1. User taps the note icon above the color picker (or a keyboard shortcut, if defined later)
2. Canvas enters **placement mode**: a ghost preview (semi-transparent note outline in the selected color) follows the cursor/pointer on the canvas
3. User taps/clicks a location on the canvas
4. A note is created at that position in the selected color and immediately enters **edit mode** (text cursor active, keyboard ready)
5. User types note content
6. Editing ends when the user taps outside the note, presses Escape, or presses Enter
7. If the note has no content on edit-end, it is automatically deleted (see `Spec_DiscoveryEngine.md` §3.1)

### 4.2 Note Interaction

**Tap:** Tapping a note enters edit mode for that note. The note's text becomes editable with a cursor.

**Drag:** After a pointer-down hold exceeds the tap threshold (150ms hold or 5px movement), the note enters drag mode. During drag, the note's z-index elevates above other notes (subtle lift effect — slight scale increase or shadow). On drag-end, the new position is persisted.

**Delete:** A small × button appears in the top-right corner of the note on hover (desktop) or on long-press (touch). Tapping × deletes the note immediately. No confirmation dialog in v1.

**Color change after placement:** Not supported in v1. To change a note's color, the user would need to delete and recreate it. This is an intentional simplicity constraint — notes are lightweight and fast to recreate.

### 4.3 Chat Interaction

**Sending a message:** User types in the text input area and taps the send button (or presses Enter/Cmd+Enter — exact shortcut TBD). The message appears in the chat as a user message.

**AI response:** The AI responds in the chat. If the input triggered stream-of-consciousness extraction (see `Spec_DiscoveryEngine.md` §3.2), notes also appear on the canvas simultaneously. AI-generated notes use the currently selected color.

**Chat scrolling:** The message area scrolls to the most recent message on new message arrival. The user can scroll up to review history.

### 4.4 Consolidation Trigger

User taps the "Consolidate Ideas" button. The system validates minimum note count (3), shows a loading state, runs the consolidation process (see `Spec_DiscoveryEngine.md` §4), and transitions the canvas to the post-consolidation state (§5.3).

### 4.5 Post-Consolidation Interaction

**Rename cluster label:** Tap the cluster label text to enter inline edit mode. Type new label, tap away or press Enter/Escape to finish.

**Drag note between clusters:** Drag a note out of one cluster border and into another. The receiving cluster's border expands to accommodate the note. The source cluster's border contracts. If the source cluster has zero notes after the drag, the cluster border and label disappear.

**Drag note to ungrouped space:** Dragging a note away from all cluster borders removes its cluster assignment. The note sits on the open canvas, visually outside any cluster.

### 4.6 Canvas Navigation

**Pan:** Click/tap and drag on empty canvas space to pan the viewport. On trackpad: two-finger scroll pans in all directions.

**Zoom:** Optional in v1. If implemented: pinch-to-zoom (trackpad/touch) and Cmd+/Cmd- (keyboard). The Discovery Engine stores only absolute positions — zoom is ephemeral viewport state.

---

## 5. States & Modes

### 5.1 Empty State (First Visit)

The user has just created a project and landed on Discovery for the first time.

- **Canvas:** Empty white space. No notes visible.
- **Chat panel:** Shows a single AI message: "How can I help?" This invites the user to start brainstorming.
- **Color picker:** Visible, Blue selected by default.
- **Consolidate Ideas button:** Disabled (grayed out, non-interactive). No tooltip in v1 — the disabled state is self-explanatory once the user has added notes and sees it activate.
- **Phase header:** Fully rendered with phase number, name, and subtitle.

### 5.2 Active Ideation (Pre-Consolidation)

The user has placed one or more notes. This is the primary working state.

- **Canvas:** Notes visible at their placed positions. Notes in various colors based on user selection.
- **Chat panel:** Shows conversation history. New messages append at the bottom.
- **Color picker:** Visible, reflecting current selection.
- **Consolidate Ideas button:** Disabled if fewer than 3 notes exist. Enabled (full contrast, interactive) when 3 or more notes exist. When disabled and tapped, show a brief message below the button: "Add a few more ideas first — you need at least 3 notes." Message fades after 3 seconds.

### 5.3 Consolidation Loading

The user has tapped "Consolidate Ideas" and the AI is processing.

- **Canvas:** Existing notes remain in place. A subtle loading overlay or animation indicates processing. Notes are not interactive during loading.
- **Chat panel:** A loading indicator in the chat (e.g., a pulsing dot animation) shows the AI is working. No fake "typing" messages — just a clean indicator.
- **Consolidate Ideas button:** Shows a loading state (spinner replaces text, or text changes to "Consolidating..."). Not re-tappable during processing.
- **Duration expectation:** Typically 3–10 seconds depending on note count. No timeout in v1 — if the API call fails, transition to error state (§5.6).

### 5.4 Post-Consolidation (Cluster Review)

Consolidation is complete. Notes have been rearranged into cluster groups.

- **Canvas:** Notes are arranged inside labeled cluster border boxes (see §6 for visual details). Clusters are positioned using the layout algorithm from `Spec_DiscoveryEngine.md` §4.4. The viewport auto-pans to show the clusters.
- **Chat panel:** The AI posts a consolidation summary message in the chat, e.g.: "I've grouped your ideas into [N] themes. Take a look — you can drag notes between groups or rename the labels." The chat remains active for further brainstorming.
- **Color picker:** Remains visible. New notes can still be placed on the canvas in any color (they appear outside cluster borders, unclustered).
- **Consolidate Ideas button:** Label changes to "Re-Consolidate" to indicate that tapping again will re-run consolidation on all notes (including any new ones). Behavior per `Spec_DiscoveryEngine.md` §4.6.
- **Navigation affordance:** A new element appears (position TBD — likely near the Consolidate button or in the phase header) indicating the user can proceed to Development. This could be a "Continue to Development →" link or button. The exact design is deferred to `Spec_Navigation.md` but the Design Spec acknowledges its presence.

### 5.5 Return to Discovery (Phase Regression)

The user has returned to Discovery from Development. Per `Spec_Navigation.md` §3.5, this is non-destructive.

- **Canvas:** Shows all existing notes and cluster borders from the previous consolidation. The user can add new notes, edit existing ones, or drag notes between clusters.
- **Chat panel:** Shows Discovery-phase chat history. Development messages are not visible.
- **Consolidate Ideas button:** Shows "Re-Consolidate" if clusters exist. Returns to "Consolidate Ideas" if no prior consolidation occurred (edge case).

### 5.6 Error State

An API call failed during chat interaction or consolidation.

- **Chat error:** The AI message area shows an error message in secondary text: "Something went wrong — try sending your message again." The user can retry by re-sending their message.
- **Consolidation error:** The canvas returns to its pre-consolidation state (notes at original positions). The Consolidate Ideas button returns to its enabled state. A brief error message appears near the button: "Consolidation failed — please try again." Message fades after 5 seconds.

---

## 6. Cluster Visual Design (Post-Consolidation)

After consolidation, notes are grouped into clusters. Each cluster is a rectangular border box containing its assigned notes in a grid layout.

### 6.1 Cluster Border Box

- **Border:** 1px solid, Surface Alt (`#E8E8E8`)
- **Corner radius:** 8px
- **Internal padding:** 20px on all sides (matches `BORDER_PAD` from `Spec_DiscoveryEngine.md` §4.4)
- **Background:** Transparent (the canvas white shows through)
- **Label:** Positioned above the border box, left-aligned with the box's left edge. Displayed in Barlow Medium 14pt, dark text (`#1A1A1A`). Editable on tap (see §4.5).

### 6.2 Note Layout Within Cluster

Notes are arranged in a grid inside the cluster border. Per `Spec_DiscoveryEngine.md` §4.4:

- Maximum 4 notes per row (`MAX_CLUSTER_COLS = 4`)
- 16px gap between notes (`NOTE_GAP = 16`)
- Notes flow left-to-right, top-to-bottom

### 6.3 Cluster Spacing

- 80px gap between cluster groups (`CLUSTER_GAP = 80`)
- Clusters are laid out left-to-right, wrapping to a new row after 1400px (`LAYOUT_MAX_WIDTH`)
- First cluster starts at position (100, 100) (`LAYOUT_START_X`, `LAYOUT_START_Y`)

### 6.4 Creative Gravity Indicator

After consolidation, the phase header subtitle updates to reflect the detected creative gravity. Examples:
- If gravity is CHARACTER: subtitle changes to "Your ideas are pulling toward a character — you can explore that in Development."
- If gravity is WORLD: "Your ideas are painting a vivid world — you can start defining it in Development."
- If gravity is CONFLICT: "There's a strong tension driving your ideas — you can dig into it in Development."
- If gravity is null (no clear gravity): "Your ideas span multiple dimensions — you'll choose where to start in Development."

The original subtitle ("Get every idea out of your head...") is replaced. This is a one-time update that persists until the user leaves Discovery.

---

## 7. Visual Language Application

### Typography usage on this surface

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Phase number | Noticia Text | Regular | 36pt | `#1A1A1A` |
| Phase name | Barlow | Thin | 36pt | `#1A1A1A` |
| Phase subtitle | Noticia Text | Bold | 20pt | `#AFAFAF` |
| Chat panel label ("Assistant") | Noticia Text | Regular | 16pt | `#636363` |
| Chat AI messages | Noticia Text | Bold | 16pt | `#636363` |
| Chat user messages | Noticia Text | Regular | 16pt | `#1A1A1A` |
| Chat input placeholder | Noticia Text | Regular | 14pt | `#999999` |
| Note content | Noticia Text | Regular | 14pt | `#1A1A1A` |
| Consolidate button text | Noticia Text | Regular | 16pt | `#1A1A1A` |
| Cluster label | Barlow | Medium | 14pt | `#1A1A1A` |
| User avatar initials | Noticia Text | Italic | 14pt | `#1A1A1A` |
| Error/status messages | Noticia Text | Regular | 14pt | `#636363` |

### Font rule for this surface

Barlow is used for **structural labels** — the phase name and cluster labels. Noticia Text is used for **everything else** — content, chat messages, controls, metadata. This follows the HARD_RULES pattern: heading/structure font for orientation, body/content font for substance.

**Note on Noticia Text:** This spec uses Noticia Text (a Google Fonts slab serif) as the canonical body/content font, replacing the previously specified Noto Serif. HARD_RULES.md and DESIGN.md should be updated to reflect this change. The rationale is that Noticia Text better matches the editorial, warm, sketchbook aesthetic — its slab-serif character has more personality than Noto Serif's transitional forms.

### Corner radius usage

| Element | Radius |
|---------|--------|
| Chat panel | 10px |
| Chat input area | 10px |
| Send button | 13px (circular) |
| Discovery Note | 6px |
| Color swatch | 2px |
| Consolidate Ideas button | 71px (pill shape) |
| Cluster border box | 8px |
| User avatar | 50% (circle) |

**Note:** The pill-shaped Consolidate button (71px radius) and the circular user avatar (50% radius) exceed the HARD_RULES maximum of 12px. These are intentional exceptions for pill buttons and avatar circles. If this feels like too much of a stretch from the Hard Rules, these can be revisited — but the Figma designs clearly use these shapes.

### Discovery Note card styling

- **Size:** 140×140px (matching `NOTE_WIDTH` and `NOTE_HEIGHT` from `Spec_DiscoveryEngine.md` §4.4)
- **Background color:** One of the 6 palette colors (see §3.3), applied as the card's background fill
- **Text color:** `#1A1A1A` (dark text) on all note colors — all 6 palette colors are light enough for dark text legibility
- **Corner radius:** 6px
- **Shadow:** None in default state. Subtle elevation (2px shadow or slight scale) during drag.
- **Padding:** 8px internal padding on all sides
- **Text overflow:** If content exceeds the visible area, text is clipped with no scroll. Tapping to edit reveals full content (the note could expand vertically in edit mode, or scroll internally — implementation detail).
- **No border** in default state. After consolidation, notes inside cluster borders are visually grouped by the border box, not by individual note borders.

### Spacing

- Chat panel width: 309px
- Divider between chat panel and canvas: 1px vertical line, `#E8E8E8`
- Phase header height: approximately 120px (phase number/name at y≈80, subtitle slightly below)
- Content area starts: y≈158
- Chat panel horizontal margin from left edge: 72px
- Canvas starts after divider at approximately x=412
- Color picker strip sits along the divider between x≈443 and the canvas

---

## 8. Data Dependencies

| Data Needed | Source | Tech Spec Reference |
|-------------|--------|---------------------|
| All DiscoveryNotes for current project | DataModel / Persistence | `Spec_DataModel.md` §6, `Spec_DataPersistence.md` |
| Note positions (x, y) | DiscoveryNote entity | `Spec_DataModel.md` §6 |
| Note content | DiscoveryNote entity | `Spec_DataModel.md` §6 |
| Note color | DiscoveryNote entity (NEW — see §11) | `Spec_DataModel.md` §6 (pending addition) |
| Note cluster assignments | DiscoveryNote.clusterId | `Spec_DataModel.md` §6 |
| PhaseState.discovery (status, clusters, gravity) | PhaseState entity | `Spec_DataModel.md` §5 |
| Discovery-phase ChatMessages | ChatMessage entities filtered by phase | `Spec_DataModel.md` §11 |
| AI extraction results | Chat Engine / Anthropic API | `Spec_DiscoveryEngine.md` §3.2 |
| Consolidation results | Discovery Engine / Anthropic API | `Spec_DiscoveryEngine.md` §4 |
| Creative gravity | PhaseState.discovery.creativeGravity | `Spec_DiscoveryEngine.md` §5 |

---

## 9. Out of Scope

- **Concept cards and Concept Type labels.** These do not exist during Discovery. Notes are unstructured.
- **Insights Panel.** The Insights Panel is inactive during Discovery. No Suggestions, Connections, or Conflicts are generated or displayed.
- **Image generation controls.** While DiscoveryNotes can have image attachments (per the Data Model), the Discovery canvas does not include UI for generating or uploading images in v1. This is a future enrichment.
- **Multi-select and batch operations.** No selecting multiple notes at once for batch move, delete, or color change in v1.
- **Undo/redo.** No undo for note deletion, position changes, color assignment, or consolidation in v1.
- **Note resizing.** All notes are 140×140px. No user-resizable notes in v1.
- **Note linking or arrows.** No visual connections between notes in v1.
- **Canvas grid, rulers, or alignment guides.** The canvas is intentionally freeform.
- **Development/Refinement workspace views.** Those are covered in `Spec_Workspace_Design.md`.
- **Start Screen and Step Menu.** Those are covered in `Spec_StartScreen_Design.md`.
- **Note color change after placement.** Once a note is placed with a color, that color persists. To change, delete and recreate.
- **Zoom.** Zoom is optional and may not be implemented in v1. The spec supports it (ephemeral viewport state) but does not require it.

---

## 10. Open Questions

1. **Keyboard shortcut for note placement:** Should there be a keyboard shortcut (e.g., "N" key) to enter placement mode without clicking the note icon? Likely yes for power users, but not critical for v1 launch. Deferred to implementation.

2. **Chat input send behavior — Enter vs. Cmd+Enter:** Should Enter send the message (quick, but prevents multi-line input) or should Cmd+Enter send and Enter create a newline? Given that Discovery encourages stream-of-consciousness input (multi-paragraph), Cmd+Enter to send may be better. To be decided during implementation.

3. **Consolidation progress indicator:** Should the loading state during consolidation show progress (e.g., "Analyzing notes..." → "Grouping themes..." → "Detecting patterns...") or just a simple spinner? A multi-step indicator would be more engaging but adds complexity. Deferred.

4. **"Continue to Development" affordance placement:** Where exactly does the navigation element appear after consolidation? Options: below the Consolidate button, in the phase header, or as a floating element on the canvas. To be resolved when writing `Spec_Navigation.md` updates or during implementation.

5. **Corner radius exceptions:** The pill-shaped Consolidate button (71px radius) and circular avatar (50%) exceed HARD_RULES' 12px maximum. Are these accepted exceptions, or should these elements be redesigned to comply? The Figma designs clearly use these shapes.

---

## 11. Data Model Addition

This Design Spec introduces one addition to the existing Data Model:

### Addition to DiscoveryNote (extends `Spec_DataModel.md` §6)

```typescript
interface DiscoveryNote {
  // ... existing fields ...
  color: NoteColor;              // NEW — visual color of the note on the canvas
}

type NoteColor = "BLUE" | "GREEN" | "PURPLE" | "GOLD" | "PINK" | "GRAY";
```

**Default value:** `BLUE` (the first color in the picker, selected by default on screen load).

**Color hex mapping (for rendering):**

```typescript
const NOTE_COLOR_HEX: Record<NoteColor, string> = {
  BLUE:   "#5F85F9",
  GREEN:  "#AAE68C",
  PURPLE: "#DD9CE9",
  GOLD:   "#E6D48C",
  PINK:   "#F5A0A0",
  GRAY:   "#B4B4B4",
};
```

**Behavior notes:**
- Color is set at note creation time based on the currently selected swatch
- Color is purely visual — the AI does not use note color during consolidation or gap analysis
- Color persists through consolidation (notes keep their colors inside cluster borders)
- AI-extracted notes (from stream-of-consciousness) use the currently selected color at the time of extraction

**Required changes to other specs:**
- `Spec_DataModel.md` — add `color: NoteColor` field to DiscoveryNote interface, add `NoteColor` type to Enums (§3)
- `Spec_DiscoveryEngine.md` — remove "Note color or tagging" from Out of Scope (§12); update note factory function to accept `color` parameter

---

## 12. Related Buildable Units

| Buildable Unit | Type | File Name |
|----------------|------|-----------|
| Discovery Screen | Screen | `Screen_DiscoveryCanvas.md` |
| Discovery Note | Component | `Component_DiscoveryNote.md` |
| Chat Panel | Component | `Component_ChatPanel.md` |
| Note Color Picker | Component | `Component_NoteColorPicker.md` |
| Cluster Border | Component | `Component_ClusterBorder.md` |
| Consolidate Button | Component | `Component_ConsolidateButton.md` |

This list is anticipatory — it will be confirmed or revised when writing the actual Buildable Unit docs. `Component_ChatPanel.md` may be shared with the Development/Refinement workspace.

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: storyengine | Branch: main

Spec file: docs/discovery/Spec_Discovery_Design.md
→ Read this spec (v0.1) for Discovery canvas layout, note interaction,
  color picker, chat panel, consolidation states, and visual rules.

Also read before starting:
- docs/HARD_RULES.md (non-negotiable constraints — note: body font is
  now Noticia Text, pending HARD_RULES update)
- docs/design/DESIGN.md (design system tokens — note: body font and
  note color tokens pending update)
- docs/discovery/Spec_DiscoveryEngine.md (canvas logic, consolidation
  algorithm, layout constants)
- docs/foundation/Spec_DataModel.md (DiscoveryNote entity — note:
  color field pending addition)

Use this spec as the source of truth for layout, states, and interaction
rules when building the Discovery canvas UI.

Key constraints:
- Notes are 140×140px with 6px corner radius, colored backgrounds
- Chat panel is 309px wide, left-side, Surface background (#F5F5F5)
- Canvas is unbounded, pans in all directions, no grid
- Consolidate Ideas button disabled until 3+ notes exist
- Post-consolidation: notes rearrange into cluster border boxes using
  layout constants from Spec_DiscoveryEngine.md §4.4
- Color picker sits vertically along the divider between chat and canvas
- All note colors use the NoteColor enum: BLUE, GREEN, PURPLE, GOLD, PINK, GRAY

Before building UI, first apply the Data Model addition (§11):
add `color: NoteColor` to DiscoveryNote in src/models/types.ts and
update the note factory in src/models/factories.ts.

Start with: the Discovery Screen shell — phase header, chat panel
container, canvas container, and divider layout. Get the spatial
structure right before adding interactive components.

Work component by component. After completing each component, stop
and check in before moving on.
Commit after each component with a message like
"feat(discovery-ui): Phase header and screen shell".
```

---

*This spec defines the visual design and interaction patterns for the Discovery canvas. For the underlying logic — canvas model, consolidation algorithm, creative gravity, and gap analysis — see `Spec_DiscoveryEngine.md`. For the chat AI behavior during Discovery, see `Spec_DiscoveryEngine.md` §7 and `Spec_ChatEngine.md`.*
