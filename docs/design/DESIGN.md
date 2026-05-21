# Story Engine — Design System

Visual reference for AI-assisted development. Read this before touching any UI.

---

## Design Philosophy

Story Engine should feel like a **sketchbook, not a spreadsheet**. The aesthetic is clean, editorial, and warm — inspired by high-end publishing and art direction tools. White space is generous. Typography does the heavy lifting. The tool should feel like a creative companion, not enterprise software. Every surface should invite ideas, not demand data entry.

---

## Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#FFFFFF` | App/page background |
| Surface | `#F5F5F5` | Card backgrounds, panels, secondary surfaces |
| Surface Alt | `#E8E8E8` | Borders, dividers, subtle accents |
| Text Primary | `#1A1A1A` | Main body text, headings |
| Text Secondary | `#6B6B6B` | Supporting text, labels, metadata |
| Text Tertiary | `#999999` | Placeholder text, disabled states |

**Accent color.** The Development surfaces use `#00A5F2` for the comparison-mode interaction (active comparison button + card selection ring), introduced by `Spec_Development_Design.md` v0.2. A unified accent system for focus states and active tabs across every surface is still to be settled.

**Semantic colors.** The ui_eval tag colors below (Core / Evolve / Set Aside) act as the creative-curation semantic set. Success, error, and warning states (save indicators, API failures, validation) are still to be defined.

### Development phase colors

Introduced by `Spec_Development_Design.md` v0.2 for the Development surfaces. Per the "no colors outside the token table" rule below, new surface colors are registered here before use.

| Token | Hex | Usage |
|-------|-----|-------|
| Core tag | `#9CCBAC` | ui_eval bar — story element is Core |
| Evolve tag | `#F2BA03` | ui_eval bar — story element needs work |
| Set Aside tag | `#AA5959` | ui_eval bar — story element is parked |
| Comparison accent | `#00A5F2` | Comparison-mode button (active) + card selection ring |
| Idea section | `#E4F5FF` | IDEA / DEFINITION section background (Detail View) |
| Column gradient | `#EEEDED` → `#E8E8E8` | Vertical wash on Development columns and writing containers |
| Chat panel gradient | `#F6F6F6` → `#E8E8E8` | Vertical wash on the chat panel |
| Subtitle gray | `#737373` | Phase subtitle text |

---

## Typography

| Role | Family | Weight | Size |
|------|--------|--------|------|
| Heading | Barlow | 600 (SemiBold) | 24pt–36pt |
| Subheading | Barlow | 500 (Medium) | 18pt–20pt |
| Label / Category | Barlow | 500 (Medium) | 12pt–14pt |
| Body | Aleo | 400 (Regular) | 14pt–16pt |
| Body Emphasis | Aleo | 700 (Bold) | 14pt–16pt |
| Caption | Aleo | 400 (Regular) | 12pt |

**Type rules:**
- Minimum type size: **12pt** — nothing smaller, ever
- Maximum type size: **36pt** — nothing larger, ever
- Barlow is for **structure** (headings, labels, navigation, card type labels)
- Aleo is for **content** (descriptions, chat messages, concept values, body text)
- Never mix both fonts in the same line of text
- Concept Type labels always render in Barlow, Title Case with spaces
- Concept values always render in Aleo

**Font sources:** Both from Google Fonts (Barlow + Aleo). Load via Expo's font loading system. Aleo ships with Regular, Italic, and Bold variants (all loaded in `app/_layout.tsx`).

---

## Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| spacing-xs | 4px | Tight internal padding, icon gaps |
| spacing-sm | 8px | Internal card padding, compact spacing |
| spacing-md | 16px | Standard gaps between elements, page margins |
| spacing-lg | 24px | Section spacing, card gaps on dashboard |
| spacing-xl | 32px | Major section breaks, generous whitespace |

**Layout rules:**
- Card gaps on dashboard: 16px–24px (spacing-md to spacing-lg)
- Internal card padding: 12px–16px
- Page horizontal padding: 16px minimum
- Split layout: chat panel and card dashboard side by side. Exact proportions TBD in `Spec_Workspace_Design.md`

---

## Component Patterns

### Cards (Concept Cards)

- Corner radius: **4px to 12px** range (no sharp corners, no circles)
- Background: `#FFFFFF` (white)
- Border: subtle, using Surface Alt (`#E8E8E8`) or light shadow
- No heavy drop shadows — keep it flat and editorial
- Card header: Concept Type label in **Barlow 14pt Medium**, Title Case
- Card body: Concept value in **Aleo 14pt Regular**
- Image (if present): displayed above or alongside the text content
- Version indicator: small, subtle (e.g., "v2" in Barlow 12pt)

### Buttons

[TBD — to be defined in Design Specs. Primary, secondary, and ghost variants needed.]

### Navigation

**Phase-header arrows.** The Discovery and Development phase headers carry a back/forward navigation pair — a bare stroke chevron on each side of the header row: `←` to the left of the phase number, `→` near the avatar. Icons are Text Primary (`#1A1A1A`), 24×24, no background circle or fill. Enabled arrows are `Pressable` and dim to opacity 0.6 on hover; a disabled forward arrow (e.g. Development → Refinement before that phase exists) is a non-interactive view at opacity 0.3. The back arrow returns to the Step Menu; the forward arrow advances to the next phase.

[Still TBD in Design Specs — in-workspace phase navigation, dimension switching, and back-to-Start controls.]

### Chat Panel

- Messages alternate between user (right-aligned or distinct styling) and assistant (left-aligned)
- User messages: concise styling, Aleo
- Assistant messages: Aleo, may include extracted concept previews
- Input area at bottom: text field + send control
- Full styling TBD in `Spec_Workspace_Design.md`

### Discovery Notes

- Post-it-style cards on a freeform canvas
- Lighter, more casual feel than Concept Cards
- Full styling TBD in `Spec_Discovery_Design.md`

### Development Surfaces

The Development phase introduces its own components — story element cards with the ui_eval tag bar, the three-column pillar canvas, the writing-area Detail View, and the Compare View. `Spec_Development_Design.md` (§3, §7) is the source of truth for their layout, tokens, and states.

---

## Do / Don't

**Do:**
- Use generous white space — let the content breathe
- Use Barlow for structure, Aleo for content — consistently
- Keep cards clean and minimal — white background, subtle borders
- Match the "editorial sketchbook" feel in every surface
- Stay within the 4px–12px corner radius range

**Don't:**
- Don't use colors not in the token table without adding them here first
- Don't use type sizes below 12pt or above 36pt — ever (Hard Rule)
- Don't use sharp corners (0px radius) or full circles on cards
- Don't add heavy shadows or decorative elements — surface gradients are limited to the subtle vertical washes defined in `Spec_Development_Design.md`
- Don't make it look like a dashboard tool or enterprise software
- Don't use emoji or icons as decoration — if icons are added, they should be functional

---

## Asset References

- **Design file:** None yet — visual design is driven by this document and the PRD
- **Icon set:** Bespoke SVGs in `assets/icons/` and `assets/buttons/`, added per surface as needed
- **Font source:** Google Fonts (Barlow, Aleo)
- **Token source of truth:** This file (`docs/design/DESIGN.md`) until a code-level theme file is created
