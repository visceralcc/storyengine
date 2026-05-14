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

**No accent color defined yet.** The current palette is intentionally neutral. An accent color (for interactive elements, focus states, active tabs) will need to be chosen before building interactive UI. This is a design decision to make before Phase C (Surfaces).

**No semantic colors defined yet.** Success, error, and warning states will be needed for save indicators, API failures, and validation. To be defined when writing the Design Specs.

---

## Typography

| Role | Family | Weight | Size |
|------|--------|--------|------|
| Heading | Barlow | 600 (SemiBold) | 24pt–36pt |
| Subheading | Barlow | 500 (Medium) | 18pt–20pt |
| Label / Category | Barlow | 500 (Medium) | 12pt–14pt |
| Body | Noto Serif | 400 (Regular) | 14pt–16pt |
| Body Emphasis | Noto Serif | 600 (SemiBold) | 14pt–16pt |
| Caption | Noto Serif | 400 (Regular) | 12pt |

**Type rules:**
- Minimum type size: **12pt** — nothing smaller, ever
- Maximum type size: **36pt** — nothing larger, ever
- Barlow is for **structure** (headings, labels, navigation, card type labels)
- Noto Serif is for **content** (descriptions, chat messages, concept values, body text)
- Never mix both fonts in the same line of text
- Concept Type labels always render in Barlow, Title Case with spaces
- Concept values always render in Noto Serif

**Font sources:** Both from Google Fonts. Load via Expo's font loading system.

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
- Card body: Concept value in **Noto Serif 14pt Regular**
- Image (if present): displayed above or alongside the text content
- Version indicator: small, subtle (e.g., "v2" in Barlow 12pt)

### Buttons

[TBD — to be defined in Design Specs. Primary, secondary, and ghost variants needed.]

### Navigation

[TBD — to be defined in Design Specs. Phase navigation within workspace, dimension switching, and back-to-Start controls needed.]

### Chat Panel

- Messages alternate between user (right-aligned or distinct styling) and assistant (left-aligned)
- User messages: concise styling, Noto Serif
- Assistant messages: Noto Serif, may include extracted concept previews
- Input area at bottom: text field + send control
- Full styling TBD in `Spec_Workspace_Design.md`

### Discovery Notes

- Post-it-style cards on a freeform canvas
- Lighter, more casual feel than Concept Cards
- Full styling TBD in `Spec_Discovery_Design.md`

---

## Do / Don't

**Do:**
- Use generous white space — let the content breathe
- Use Barlow for structure, Noto Serif for content — consistently
- Keep cards clean and minimal — white background, subtle borders
- Match the "editorial sketchbook" feel in every surface
- Stay within the 4px–12px corner radius range

**Don't:**
- Don't use colors not in the token table without adding them here first
- Don't use type sizes below 12pt or above 36pt — ever (Hard Rule)
- Don't use sharp corners (0px radius) or full circles on cards
- Don't add heavy shadows, gradients, or decorative elements
- Don't make it look like a dashboard tool or enterprise software
- Don't use emoji or icons as decoration — if icons are added, they should be functional

---

## Asset References

- **Design file:** None yet — visual design is driven by this document and the PRD
- **Icon set:** [TBD — to be chosen before Phase C]
- **Font source:** Google Fonts (Barlow, Noto Serif)
- **Token source of truth:** This file (`docs/design/DESIGN.md`) until a code-level theme file is created
