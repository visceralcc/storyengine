# Story Engine — Development Screen Specification

**UX & Interaction Design**

Version 0.2 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | May 2026 | Initial draft. Development Canvas, Story Element Detail View, Compare View, Related Elements Panel, text highlighting from chat, and phase outcome definition. |
| **0.2** | **May 2026** | **Reconciled against updated Figma designs (nodes 69:53, 284:284, 290:910, 290:619). Resolved 6 of 7 open questions. Font updated to Aleo throughout. Added ui_eval component (Core/Evolve/Set Aside visual indicator). Updated accent colors to match Figma. Column backgrounds changed to gradient. Card corner radius corrected to 10px. Added Detail View and Compare View from Figma. Added comparison mode button. Added dismiss/navigation via ×. Character cards standardized to bullet-point format. Phase header typography updated per Figma. Added IDEA / IDEA THOUGHT section labels. Added definition field to Concept. Pillar reassignment via tappable header dropdown in Detail View.** |

---

## 1. Overview

The Development screen is where shallow Discovery output becomes deep, coherent story foundation. The user takes the structured story elements produced by Discovery's consolidation and defines each one in detail through writing and AI-assisted conversation.

**Design principle:** The Development screen is a **writing environment with a creative collaborator**, not a form to fill out — the user writes freely, the AI reads what they wrote and pushes their thinking deeper through dialogue, and the definition evolves through that iterative loop.

**User goals:**
- Expand each story element from a one-line Discovery summary into a substantive written definition
- Test story elements against each other for coherence and identify connections
- Surface and resolve contradictions between elements (or mark them as intentional tensions)
- Reach a point where every key element is defined deeply enough that someone else could understand the creative vision without asking questions

**Scope boundary — this surface does NOT:**
- Create new story elements from scratch (those come from Discovery consolidation; the user refines what exists)
- Handle the Refinement phase's storyline framework or beat structure
- Provide image generation or visual references (that's the Images feature, specced separately)
- Export content (that's the Export feature)
- Show the Insights Panel (that's a separate spec; the Development chat performs a similar but inline role)

---

## 2. Surface Inventory

| Surface | Type | Purpose |
|---------|------|---------|
| Development Canvas | Screen | Three-column overview of all story elements organized by pillar (Theme, World, Character). The "home base" of the Development phase. |
| Story Element Detail View | Screen | Full writing environment for a single story element. Chat panel, writing area, and related elements panel. Where the real work happens. |
| Compare View | Mode (within Detail View) | Side-by-side view of two story elements for checking coherence. Both elements are editable. |
| Related Elements Panel | Panel (within Detail View) | Right-side list of connected story elements shown as glance cards with drop shadows. |
| Chat Panel | Panel (shared) | AI conversation panel present on both the Canvas and Detail View. |

---

## 3. Information Hierarchy

### 3.1 Development Canvas

**Layout:** Full-width screen. Phase header spans the top. Below it, a narrow chat panel on the left and three content columns filling the remaining width.

**Phase header (top bar):**
- Phase number: "2" in Aleo Regular, 36pt, black, centered vertically
- Phase name: "Development" in Barlow Thin, 36pt, black, to the right of the number
- Subtitle: "Give your ideas shape...explore who, where, and why, one conversation at a time." in Aleo Bold, 20pt, #737373 (gray), to the right of the phase name
- User avatar/initials: top right corner (30px circle, Aleo Italic 14pt initials)
- Comparison mode button: below the avatar in the upper right area (see §4.5)

**Chat panel (left, ~309px wide):**
- Gradient background: top-to-bottom from #F6F6F6 to #E8E8E8, 10px corner radius
- "Assistant" label at top in Barlow Regular, 16pt, #636363
- Chat message area (scrollable), messages in Aleo Bold, 16pt, #636363
- Text input field at bottom: white background, 10px corner radius, with circular send button (26px diameter, 1px #656363 border)
- Always functional — the user can chat with the AI at the canvas level for general questions about their story, cross-element observations, or guidance on what to work on next

**Content columns (three, equal width, scrollable independently):**

Each column represents one pillar/dimension:

| Column | Header Icon | Header Label | Icon Asset |
|--------|-------------|--------------|------------|
| Theme | Document icon (□ with lines) | "Theme" | `assets/icons/icon_theme.svg` |
| World | Globe icon (◎) | "World" | `assets/icons/icon_world.svg` |
| Character | Person icon (◻ with head) | "Character" | `assets/icons/icon_character.svg` |

Column headers: pillar icon (~28px) + pillar name in Barlow Medium, 20pt, black. Columns have a gradient background: top-to-bottom from #EEEDED to #E8E8E8, 10px corner radius, with `overflow: clip` for scrollable content.

**Story Element Cards (within columns) — "story_element_small" component:**

Each card shows:
1. **Card header:** Small pillar icon (19px) + "Pillar / Concept Type" label in Barlow Medium, 13pt, black. For Character cards, the label format is "Character / [Character Name]" rather than "Character / [Concept Type]".
2. **Card body:** Description text from Discovery consolidation in Aleo Regular, 14pt, black. For Theme and World cards, this is paragraph text. For Character cards, the body uses **bullet-point format** for traits and motivations.
3. **Creative tag bar (ui_eval):** Vertical colored bar on the right edge of the card, 17px wide × 72px tall, with 10px rounded corners on the left side only (rounded-bl-10, rounded-tl-10). The bar color indicates the element's Core/Evolve/Set Aside status:

| Tag | Color | Hex | Meaning |
|-----|-------|-----|---------|
| Core | Green | #9CCBAC | Central to the story — this stays |
| Evolve | Yellow | #F2BA03 | Needs more work or rethinking |
| Set Aside | Red | #AA5959 | Parked — not discarded, just not active |

Cards have white backgrounds, 10px corner radius, 10px left padding. Cards are stacked vertically within their column with ~10px spacing.

**What's always visible:** Phase header, all three column headers, all cards (scrollable within columns), comparison mode button.

**What's editable:** Cards themselves are read-only on the canvas — tapping opens the Detail View for editing.

### 3.2 Story Element Detail View

**Layout:** Replaces the canvas view (dissolve transition). Three-region horizontal layout.

**Left region — Chat Panel (~309px):**
- Same chat panel pattern as the canvas, same gradient background and styling
- Now contextual to the active story element
- "Assistant" label at top
- The AI has read the user's written definition and responds to it specifically
- AI can trigger text highlights in the writing area (see §4.3)
- AI surfaces contextual prompts to push thinking deeper (Narrative UI — see §4.4)
- Text input field at bottom with send button

**Center region — Writing Area (flexible width, takes remaining space):**
- **Outer container:** Gradient background (#EEEDED to #E8E8E8, 10px radius), same as canvas columns
- **Pillar header:** Pillar icon (~35px) + pillar name in Barlow Medium, 20pt, at top of the container. The pillar name is **tappable** — tapping it opens a dropdown where the user can reassign the element to a different pillar (Theme, World, or Character).
- **White inner panel:** White background, 10px radius, positioned inside the gradient container. Contains all the writing content.
- **Creative tag bar (ui_eval):** Green/yellow/red bar on the left edge of the white inner panel (rotated 180° from canvas cards — bar sits on the left). Same dimensions and color mapping as canvas cards.
- **Element title:** The story element's name/value in Barlow Medium, 36pt, black. For example: "Escapism vs. Reality" for a Theme element. Title is **editable** — a pencil icon in the IDEA section allows inline editing.
- **IDEA section:** Light blue background (#E4F5FF, 10px radius). Contains:
  - Section label: "IDEA" in Barlow Regular, 15pt, black, uppercase
  - Pencil edit icon in the top right of the section (tapping enables editing of the Discovery summary text)
  - The Discovery-generated summary text in Aleo Regular, 20pt, black
- **IDEA THOUGHT / DEFINITION section:** Light blue background (#E4F5FF, 10px radius), below the IDEA section. Contains:
  - Section label: "IDEA THOUGHT / DEFINITION" in Barlow Regular, 15pt, black, uppercase
  - Pencil edit icon in the top right
  - Large editable text area where the user writes their expanded definition
  - Placeholder text when empty: "Expand on this idea..." in Aleo Regular, 20pt, #B9B9B9
  - No character limit. Supports paragraph breaks. The field grows vertically as content is added.
- **Dismiss button:** Circle "×" button (`assets/buttons/button-close-x.svg`) in the top-right corner of the outer container. Tapping returns to the canvas (dissolve transition back). See §4.6 for navigation behavior.

**Right region — Related Elements Panel (~426px):**
- Header: "This [Pillar] connects to:" in Barlow Medium, 20pt, black — contextual to the active element's pillar (e.g., "This Theme connects to:", "This World connects to:", "This Character connects to:")
- List of connected story elements, each shown as a **story_element_small** glance card:
  - Same component as canvas cards (pillar icon + label + body + ui_eval bar)
  - **Drop shadow** (2px 4px 8px rgba(0,0,0,0.25)) — visually lifted off the background, distinguishing them from canvas cards
  - White background, 10px corner radius
- Glance cards are tappable — tapping navigates to that element's Detail View (dissolve transition, replacing the current Detail View)
- Connections are both AI-inferred (based on content analysis) and user-added (manual linking via comparison mode button — see §4.5)
- If no related elements exist yet, show placeholder: "No connections yet. As you write, the AI will surface related elements." in Aleo Italic, #B9B9B9

**What's always visible:** Pillar header, element title, IDEA section, IDEA THOUGHT / DEFINITION section, related panel header, dismiss button.

**What's editable:** The IDEA summary (via pencil icon), the IDEA THOUGHT / DEFINITION writing area (via pencil icon or direct click), the pillar assignment (via tappable pillar header).

### 3.3 Compare View

**Layout:** Triggered from the canvas using the comparison mode button (§4.5). Two story elements appear side-by-side in the center area, each in its own gradient container with a white inner panel. The chat panel remains on the left.

**Left element:** The first story element selected. Has its own pillar header, writing area, and ui_eval bar. Does **not** have a dismiss "×" button while the right element is present.

**Right element:** The second story element selected. Has its own pillar header, writing area, and ui_eval bar. Has a circle "×" dismiss button (`assets/buttons/button-close-x.svg`) in its top-right corner.

**Both elements are editable.** Each has its own IDEA section and IDEA THOUGHT / DEFINITION section with pencil icons. The user can write in either element's fields. The shared chat panel on the left serves both — the AI can reference and highlight text in either element.

**Each element has its own pillar icon in the upper-left of its container** (e.g., Theme icon for a Theme element, World icon for a World element). These are independent and accurate to each element's pillar.

**The Related Elements Panel is not visible in Compare View.** The right element occupies that space.

**Dismiss behavior:**
- Dismissing the right element (its "×" button) returns to the Detail View: the left element expands to full width, the Related Elements Panel reappears, and a "×" button appears on the remaining element.
- Dismissing the left element (after the right has been dismissed) returns to the canvas.

---

## 4. Interaction Patterns

### 4.1 Canvas Interactions

**Tapping a card:** Opens the Story Element Detail View for that element. Canvas dissolves out, Detail View dissolves in.

**Column assignment:** Cards cannot be dragged between columns on the canvas. To change a story element's pillar assignment, the user must open the Detail View and tap the pillar name in the header to change it via dropdown (see §3.2).

**Canvas-level chat:** The chat panel on the canvas is live and functional. The user can ask general questions ("What areas of my story need the most work?", "Do my characters feel consistent?") and the AI responds with cross-element observations. The AI does not modify any story elements from the canvas chat — it's advisory only.

### 4.2 Detail View Interactions

**Writing:** The user taps the pencil icon on the IDEA THOUGHT / DEFINITION section (or clicks directly into the field) and types freely. No formatting toolbar in v1 — plain text only. Paragraph breaks are supported via Return/Enter. The field grows vertically as content is added; the writing area scrolls if content exceeds the viewport.

**Editing the Discovery summary:** The user taps the pencil icon on the IDEA section to edit the original Discovery summary. This modifies the Concept's `value` field.

**Pillar reassignment:** The user taps the pillar name in the Detail View header. A dropdown appears listing the three pillars (Theme, World, Character). Selecting a different pillar moves the element to that column on the canvas.

**Chat conversation:** The user types in the chat input and the AI responds contextually. The AI has access to:
- The current element's title, description, and user-written definition
- All other story elements in the project (for cross-referencing)
- The gap analysis from the Chat Engine (which elements are shallow or undefined)

**Navigating to related elements:** Tapping a glance card in the Related Elements panel navigates to that element's Detail View. The current view dissolves out, the new element's Detail View dissolves in.

### 4.3 Text Highlighting from Chat

When the AI refers to specific text the user has written, it can trigger a visual highlight on that text range in the writing area. This makes the AI's feedback *spatial* — the user sees exactly what the AI is talking about.

**How it works:**
- The AI's chat message includes a reference to a specific text range in the user's writing
- The referenced text in the writing area receives a temporary highlight (subtle background color — a pale version of the pillar's accent color)
- The highlight persists for ~5 seconds or until the user clicks elsewhere in the writing area
- Multiple highlights can appear simultaneously if the AI references multiple passages

**Highlight appearance:** A translucent wash behind the referenced text. Not a harsh selection color — it should feel like someone gently underlining with a highlighter, consistent with the editorial/sketchbook aesthetic.

**In Compare View:** The AI can highlight text in either element's writing field, making cross-element references visible.

### 4.4 Contextual Prompts (Narrative UI)

The AI proactively surfaces prompts to push the user's thinking deeper. These are not a checklist — they emerge naturally from what the user has written and what's missing.

**Types of contextual prompts:**
- **Deepening prompts:** "You describe the OASIS as infinite — what are its limits? Every world has edges, even virtual ones."
- **Connection prompts:** "This theme of escapism connects to your character's motivation — he's not just hunting eggs, he's avoiding his real life. Want to explore that?"
- **Gap prompts:** "You've defined the world's technology in detail, but you haven't said much about how ordinary people experience it day to day. What does a normal Tuesday look like in the stacks?"
- **Challenge prompts:** "Your character is described as 'deeply lonely' but also 'obsessive about the hunt' — are those in tension, or does one feed the other?"

**Delivery:** These prompts appear as AI messages in the chat panel. They are conversational, not structured. The AI uses the Narrative UI philosophy — it asks questions a creative collaborator would ask, never presents a to-do list.

**Timing:** The AI surfaces prompts after the user has written or revised content in the writing field, or after a period of inactivity in a session. It does not interrupt active writing.

### 4.5 Comparison Mode

**Comparison mode button:** Located in the upper right of the Development screen, below the avatar. Uses two SVG states:
- Inactive: `assets/buttons/button_comparison_inactive.svg` — default state, gray
- Active: `assets/buttons/button_comparison_active.svg` — comparison mode is engaged

**Entering comparison mode:**
1. The user taps the comparison mode button on the canvas. It switches to the active state.
2. The user taps two story element cards on the canvas (in any order, from any column).
3. After the second tap, the canvas transitions to Compare View with both elements side by side.

**Manual connection creation:** While in comparison mode, selecting two elements also creates a connection (relationship) between them. This is how the user manually adds related elements — by comparing them. The connection appears in each element's Related Elements panel going forward.

**Editing in compare mode:** Both writing fields are active and editable. The user can switch between them freely. The chat panel serves both elements — the AI can reference and highlight text in either.

**Exiting compare mode:** The user dismisses the right element (via its "×" button). The left element expands to full width and the Related Elements panel reappears. A "×" button appears on the remaining element — dismissing it returns to the canvas. See §3.3 for full dismiss behavior.

### 4.6 Navigation via Dismiss Button

The circle "×" button (`assets/buttons/button-close-x.svg`) is the primary navigation control for moving "back" through the Development screen hierarchy:

**On the Detail View:** Tapping "×" returns to the canvas (dissolve transition).

**On Compare View — right element:** Tapping "×" dismisses the right element, returning to the Detail View of the left element. The "×" button appears on the left element once the right is dismissed.

**On Compare View — left element (after right is dismissed):** Tapping "×" returns to the canvas.

**Key rule:** In Compare View, only the rightmost element shows the "×" button. Once dismissed, the "×" moves to the remaining element. This prevents accidental dismissal of the primary element while comparing.

---

## 5. States & Modes

### 5.1 Development Canvas States

**Fresh from consolidation (initial state):** All story elements from Discovery consolidation are displayed as cards in their three columns. No elements have been expanded yet. The chat panel might show a welcome message: "Your ideas are organized. Tap any element to start defining it in detail."

**In progress:** Some elements have been expanded (user has written definitions), others haven't. There is no visual distinction on the canvas between expanded and unexpanded elements in v1 — the card always shows the Discovery summary, not the user's expanded definition. (Future consideration: a subtle indicator showing which elements have been worked on.)

**All elements defined:** All story elements have substantive written definitions. The AI may suggest in the canvas chat that the user is ready to move to Refinement, but the phase transition is always user-initiated from the Step Menu.

**Comparison mode active:** The comparison mode button shows its active state. Card taps now select elements for comparison (highlighted border or subtle glow) rather than opening the Detail View. After two cards are selected, the Compare View opens.

**Error state:** If the AI chat fails (API error, network loss), the chat panel shows an error message. The canvas itself remains fully functional — all cards are visible and tappable, the user just can't chat until connectivity is restored.

### 5.2 Story Element Detail View States

**First visit (no user writing yet):** The IDEA THOUGHT / DEFINITION field shows placeholder text "Expand on this idea..." in Aleo Regular, 20pt, #B9B9B9. The IDEA section shows the Discovery consolidation summary. The AI may open with a contextual prompt to get the user started: "This theme captures something important — tell me more about what escapism means in this world."

**Active writing:** The user has content in the IDEA THOUGHT / DEFINITION field. The AI responds to what's been written. Related elements populate as the AI infers connections.

**Revised writing:** The user has rewritten or significantly changed their definition. The AI acknowledges the change and may surface new prompts based on the updated content.

**Compare mode active:** The writing area narrows, a second element is visible. Both are editable. The Related Elements panel is hidden.

**Error state:** Same as canvas — chat fails gracefully, writing area remains functional.

### 5.3 Related Elements Panel States

**No connections:** Placeholder text: "No connections yet. As you write, the AI will surface related elements." in Aleo Italic, #B9B9B9.

**AI-inferred connections:** Related elements appear as the AI identifies them from the user's writing. Each glance card is tappable.

**Mixed connections:** Both AI-inferred and manually added connections (via comparison mode). No visual distinction between the two in v1.

---

## 6. Data Dependencies

| Data Needed | Source | Tech Spec Reference |
|-------------|--------|---------------------|
| Story elements (from Discovery consolidation) | Concept entities grouped by dimension | `Spec_DataModel.md` §2 |
| Concept Type labels and default sets | ConceptType entities | `Spec_DataModel.md` §3 |
| Pillar/dimension assignment | Concept.dimension field | `Spec_DataModel.md` §2 |
| Discovery consolidation output | Consolidation clusters mapped to Concepts | `Spec_DiscoveryEngine.md` §5 |
| Chat messages and conversation history | ChatMessage entities | `Spec_DataModel.md` §5 |
| AI responses (concept analysis, prompts) | Anthropic API via Chat Engine | `Spec_ChatEngine.md` §4 |
| Related element connections | relatedConceptIds on Concept entities | `Spec_DataModel.md` §2 |
| User-written definitions | `definition` field on Concept entity (see §6.1) | — |
| Creative tag (Core/Evolve/Set Aside) | `creativeTag` field on Concept entity (see §6.1) | — |

### 6.1 Data Model Additions

The following fields need to be added to the Concept entity in `Spec_DataModel.md`:

**`definition: string | null`** — The user's expanded written definition of a story element, authored in the Development phase. Defaults to `null`. This is separate from the `value` field (which holds the Discovery summary) so the original summary is preserved while the user writes a deeper definition.

**`creativeTag: 'CORE' | 'EVOLVE' | 'SET_ASIDE'`** — The Core/Evolve/Set Aside tag that maps to the ui_eval bar color. Defaults to `'CORE'` for newly consolidated elements. The mechanism for changing this tag is TBD in implementation (could be a tap on the bar, a context menu, or a chat-driven action).

---

## 7. Visual Language Application

All visual rules from `HARD_RULES.md` and `DESIGN.md` apply. Surface-specific applications:

### Typography

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Phase number | Aleo | Regular | 36pt | #000000 |
| Phase name | Barlow | Thin (100) | 36pt | #000000 |
| Phase subtitle | Aleo | Bold | 20pt | #737373 |
| Column header label | Barlow | Medium (500) | 20pt | #000000 |
| Card header (pillar/type label) | Barlow | Medium (500) | 13pt | #000000 |
| Card body text | Aleo | Regular | 14pt | #000000 |
| Detail View element title | Barlow | Medium (500) | 36pt | #000000 |
| Detail View section labels ("IDEA", "IDEA THOUGHT / DEFINITION") | Barlow | Regular | 15pt | #000000, uppercase |
| Detail View body text (IDEA + writing area) | Aleo | Regular | 20pt | #000000 |
| Detail View placeholder text | Aleo | Regular | 20pt | #B9B9B9 |
| Related panel header | Barlow | Medium (500) | 20pt | #000000 |
| Glance card label | Barlow | Medium (500) | 13pt | #000000 |
| Glance card body | Aleo | Regular | 14pt | #000000 |
| Chat label ("Assistant") | Barlow | Regular | 16pt | #636363 |
| Chat messages | Aleo | Bold | 16pt | #636363 |

### Color

| Element | Value | Usage |
|---------|-------|-------|
| Core tag | #9CCBAC (Green) | ui_eval bar for Core elements |
| Evolve tag | #F2BA03 (Yellow) | ui_eval bar for Evolve elements |
| Set Aside tag | #AA5959 (Red) | ui_eval bar for Set Aside elements |
| Card background | #FFFFFF | All cards on canvas and detail view |
| Column/container gradient top | #EEEDED | Top of gradient for content columns and detail containers |
| Column/container gradient bottom | #E8E8E8 | Bottom of gradient |
| Chat panel gradient top | #F6F6F6 | Top of chat panel gradient |
| Chat panel gradient bottom | #E8E8E8 | Bottom of chat panel gradient |
| Canvas background | #FFFFFF | Behind the columns |
| Detail View inner panel | #FFFFFF | White panel inside gradient container |
| IDEA / DEFINITION sections | #E4F5FF | Light blue background for content sections in Detail View |
| Text highlight | Pillar-contextual at ~15% opacity | Chat-triggered highlight wash in writing area |
| Glance card shadow | rgba(0,0,0,0.25) | Drop shadow on related element cards: 2px 4px 8px |

### Spacing & Layout

- Card corner radius: 10px
- Column corner radius: 10px
- Card spacing within column: ~10px vertical gap
- Card left padding: 10px
- Column internal padding: 14px left, 10px right, 14px top, 10px bottom
- Chat panel width: ~309px
- Chat panel internal padding: 12px horizontal, 15px vertical
- Related Elements panel width: ~426px
- Detail View writing area: flexible, fills remaining horizontal space
- Compare mode: each writing area gets roughly equal space minus the chat panel
- ui_eval bar: 17px wide × 72px tall, 10px border radius on left side only

### Asset References

| Asset | Path | Usage |
|-------|------|-------|
| Theme icon | `assets/icons/icon_theme.svg` | Column header, card header, Detail View pillar header |
| World icon | `assets/icons/icon_world.svg` | Column header, card header, Detail View pillar header |
| Character icon | `assets/icons/icon_character.svg` | Column header, card header, Detail View pillar header |
| Dismiss button | `assets/buttons/button-close-x.svg` | Detail View dismiss, Compare View dismiss |
| Comparison inactive | `assets/buttons/button_comparison_inactive.svg` | Canvas comparison mode toggle (default) |
| Comparison active | `assets/buttons/button_comparison_active.svg` | Canvas comparison mode toggle (engaged) |

---

## 8. Out of Scope

- **Creating new story elements.** Development works with what Discovery consolidation produced. New element creation is not part of this phase. (If the user identifies a gap, the AI can note it, but the user would need to return to Discovery or a future "add element" flow to create one.)
- **Deleting story elements.** Elements can be refined and rewritten but not removed in v1.
- **Image generation or visual references.** That's the Images feature (`Spec_ImageGeneration.md`).
- **Insights Panel.** The Development chat performs inline analysis, but the dedicated Insights Panel sidebar is a separate spec (`Spec_InsightsPanel_Design.md`).
- **Storyline framework / beat structure.** That's Refinement phase.
- **Export.** That's the Export feature (`Spec_Export.md`).
- **Rich text formatting.** The writing field is plain text in v1. No bold, italic, headers, or lists within the writing area. (Character card bullet points on the canvas are a display convention, not user-authored formatting.)
- **Version history for definitions.** The user's written definition is a single current value in v1. No undo history or version tracking for the writing field itself. (Concept-level versioning from `Spec_DataModel.md` still applies to the element as a whole.)
- **In-app writing / full story composition.** Flagged as a future expansion path (PRD consideration), not part of this phase.
- **Progress indicators.** No visual tracking of how many elements have been defined or how "complete" the Development phase is. The user decides when they're done.
- **Card reordering on canvas.** Cards are displayed in their column but cannot be reordered via drag in v1. (Future consideration.)
- **Creative tag changing mechanism.** The ui_eval bar shows the Core/Evolve/Set Aside state but the interaction for changing it is TBD in implementation.
- **Vertical dividers between columns.** No explicit rule or divider line between columns or between the chat panel and columns — spacing alone provides visual separation.

---

## 9. Open Questions

1. **What specifically triggers the Refinement phase unlock?** Is it purely user-initiated from the Step Menu, or should there be a readiness signal? Flagged as an open question from earlier sessions. To be resolved in a future session.

---

## 10. Related Buildable Units

| Buildable Unit | Type | File Name |
|----------------|------|-----------|
| Development Canvas | Screen | `Screen_DevelopmentCanvas.md` |
| Story Element Detail View | Screen | `Screen_ElementDetail.md` |
| Story Element Card (small/glance) | Component | `Component_StoryElementSmall.md` |
| Writing Area (IDEA + DEFINITION sections) | Component | `Component_WritingArea.md` |
| Related Elements Panel | Component | `Component_RelatedElements.md` |
| Compare View | Component | `Component_CompareView.md` |
| Creative Tag Bar (ui_eval) | Component | `Component_CreativeTagBar.md` |
| Comparison Mode Button | Component | `Component_ComparisonModeButton.md` |
| Text Highlighting | Logic | `Logic_TextHighlighting.md` |
| Contextual Prompts | Logic | `Logic_ContextualPrompts.md` |
| Related Element Inference | Logic | `Logic_RelatedElementInference.md` |
| Pillar Reassignment | Logic | `Logic_PillarReassignment.md` |

---

## 11. Phase Outcome Definition

Development is considered "done" (user-ready for Refinement) when:

- Every key story element has a substantive written definition — not just the one-liner from Discovery, but enough detail that someone unfamiliar with the story could read it and understand the creative intention
- The connections between elements have been identified (AI-inferred and/or manually added via comparison mode) and make narrative sense together
- Major contradictions between elements have been surfaced and either resolved or deliberately accepted as intentional tensions
- The three pillars (Theme, World, Character) tell a coherent story when read together — the world serves the theme, the characters inhabit the world, and the theme emerges from the characters' experience

This is a creative judgment, not a mechanical threshold. There is no progress bar or completion percentage. The user decides when they're ready. The AI may gently suggest readiness ("Your world and characters feel really coherent — have you thought about moving into Refinement to start shaping the storyline?") but never forces the transition.

---

## 12. Future Consideration: In-App Writing (Production Handoff Option 2)

By the time the user completes Development and Refinement, they will have written substantial content — detailed definitions, character descriptions, world-building paragraphs — and organized it along story beats. At that point, Story Engine could offer a continued writing environment where the story bible serves as always-available context, rather than requiring the user to export and switch to another tool.

This is **not in scope for v1** but is noted here because it shapes Development's design:
- The writing area is built as a genuine writing environment (large, comfortable, plain text), not a form field
- The AI already knows the full story context from the Development process
- The definition content is stored in a way that could feed a longer-form writing mode later

To be added to the PRD as a future expansion path.

---

## Figma Reference

| Screen | Node ID | Description |
|--------|---------|-------------|
| Development Canvas (Pillar View) | `69:53` | Three-column layout with story element cards |
| Story Element Small (component) | `284:284` | Glance card used in columns and Related Elements panel |
| Story Element Detail View | `290:910` | Full writing environment with IDEA + DEFINITION sections |
| Compare View | `290:619` | Side-by-side element comparison |

File key: `v957iqypnIQljqqAQAPpjU`

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: ~/dev/storyengine | Branch: main

Spec file: docs/development/Spec_Development_Design.md (v0.2)
→ Use this spec as the source of truth for layout, states, and
  interaction rules when building the Development phase UI.

Depends on:
- Spec_DataModel.md (Concept, ConceptType entities — add `definition`
  and `creativeTag` fields per §6.1)
- Spec_DiscoveryEngine.md (consolidation output that feeds Development)
- Spec_ChatEngine.md (AI conversation, contextual prompts)
- Spec_Navigation.md (phase transitions, routing)
- Spec_Discovery_Design.md (chat panel pattern, phase header pattern)

Key constraints:
- Three-column canvas layout: Theme, World, Character — not free-form
- Column backgrounds are gradients (#EEEDED → #E8E8E8), not flat
- Card corner radius is 10px, not 8px
- Body font is Aleo throughout — no Noticia Text, no Domine
- ui_eval bar colors: Core=#9CCBAC, Evolve=#F2BA03, Set Aside=#AA5959
- Detail View has two blue sections (IDEA + IDEA THOUGHT / DEFINITION)
  on a white inner panel inside a gradient container
- Detail View replaces canvas (dissolve transition), not a modal/overlay
- Comparison mode is entered via a dedicated button on the canvas,
  then selecting two cards — not from the Detail View
- Dismiss navigation uses circle "×" button (button-close-x.svg)
- Writing field is plain text only in v1 — no rich text formatting
- Chat panel is functional on BOTH the canvas and the Detail View
- Text highlighting from chat is a core interaction (§4.3) — not optional
- No vertical dividers between columns or between chat and columns
- Character cards use bullet-point format for body content
- Pillar reassignment via tappable pillar header dropdown in Detail View

Assets required:
- assets/icons/icon_theme.svg
- assets/icons/icon_world.svg
- assets/icons/icon_character.svg
- assets/buttons/button-close-x.svg
- assets/buttons/button_comparison_inactive.svg
- assets/buttons/button_comparison_active.svg

Start with: The Development Canvas screen — three-column card layout
with pillar headers, story element cards with ui_eval bars, phase
header, and comparison mode button. Use the Discovery screen as a
reference for chat panel and header patterns.

Work phase by phase. After completing each phase, stop and check in
before moving on. Commit after each phase with a message like
"feat(development): Phase 1 — canvas layout and card rendering".
```
