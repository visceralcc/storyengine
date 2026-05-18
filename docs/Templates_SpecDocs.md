# Story Engine — Spec Document Templates

**Consistent formats for every specification document in this project.**

Version 0.1 | April 2026

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial draft. Tech Spec, Design Spec, and Buildable Unit templates defined. |

---

## Why This Document Exists

Every spec in Story Engine follows a consistent shape. This makes specs faster to write, easier to review, and predictable for Claude Code to read at build time. Three templates cover everything:

- **Tech Spec** — for systems, engines, and algorithms (how something works under the hood)
- **Design Spec** — for surfaces, screens, and flows (what the user sees and does)
- **Buildable Unit** — for individual screens, components, and logic modules (tight enough for Claude Code to build without guessing)

Templates are skeletons, not straitjackets. Every section listed as **Required** must appear in every spec (even if the answer is "N/A — [reason]"). Sections listed as **Optional** should be included when they apply and omitted when they don't.

---

## Shared Conventions (All Templates)

These rules apply to every spec document in the project, regardless of template type.

### Header Block

Every spec starts with the same header format:

```
# Story Engine — [Human-Readable Name] Specification

**[Subtitle]**

Version 0.1 | [Month Year] | [Author or "Spec"]

**CONFIDENTIAL**
```

Subtitle describes the type: "Systems Design", "Feature Specification", "UX & Interaction Design", "Screen Specification", "Component Specification", "Logic Specification".

### Version History

Every spec has a version history table immediately after the header:

```
## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | [Mon Year] | Initial draft. [One-line summary.] |
```

Bold the version number for updates after 0.1.

### Cross-References

- Reference other spec files by their exact filename: `Spec_ChatEngine.md`, `Screen_WorldBuilder.md`
- Reference sections within the current document using `§N.N` notation
- Reference the PRD by section: `PRD §5.2` (World Builder section of the PRD)

### Naming in Specs

- **Concept Types** always appear in Title Case with spaces: "Time Period", "Fashion Style", "Story Arc"
- **Code values** use camelCase for object keys and SCREAMING_SNAKE_CASE for constants
- **File names** use the patterns defined per template type (see each template below)
- **The product** is always "Story Engine" (two words, title case) in prose

### Out of Scope

Every spec includes an explicit Out of Scope section. This is the most important section for preventing Claude Code from over-building. Write what this spec does NOT cover — even things that seem obvious.

### Open Questions

Every spec includes an Open Questions section. If there are no open questions, write "None — all questions resolved." Never omit the section.

---

## Template 1: Tech Spec

**Use for:** Systems, engines, data flows, algorithms, APIs — anything that describes how something works under the hood, independent of what the user sees.

**File naming:** `Spec_[SystemName].md` — e.g., `Spec_ConceptExtraction.md`, `Spec_DataPersistence.md`, `Spec_MCPServer.md`

**When to choose Tech Spec vs. Design Spec:** If the primary audience is "a developer implementing the logic," it's a Tech Spec. If the primary audience is "someone building the UI and interaction," it's a Design Spec. Some features need both (e.g., the Chat Engine has a Tech Spec for the AI pipeline and a Design Spec for the chat interface).

---

### Tech Spec Skeleton

```markdown
# Story Engine — [System Name] Specification

**Systems Design & Data Architecture**

Version 0.1 | [Month Year] | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|

---

## 1. Overview                                          ← Required

What this system is (one sentence).

**Design principle:** [A bold statement capturing the philosophical
guardrail driving this system's design. See examples below.]

**Consumer:** Who or what uses this system — which screens read from
it, which services call it, whether users interact with it directly
or only through other systems.

**Scope boundary — this system does NOT:**
- [Explicit list of what's excluded]

---

## 2–N. [System-Specific Sections]                      ← Required

The core of the spec. Organize by whatever structure fits the system.
Follow these rules within these sections:

TABLES for discrete values (states, types, tiers, statuses).
Include an engine/code value column and a display label column.

EXACT FORMULAS in code blocks for any math that affects behavior.
Always include a range comment showing min/max output values.

WORKED EXAMPLES after every formula — at least one, ideally showing
both ends of the range (best case and worst case).

TIER TABLES when a numeric value maps to labeled tiers.

STATE MACHINES when an entity moves through defined states. Show
all states, all valid transitions, and what triggers each transition.

---

## N+1. Edge Cases & Rules                              ← Required

Bullet or subsection each edge case:
- Boundary conditions (zero, max, first occurrence, empty states)
- Mutual exclusions (what can't happen together)
- Stacking/interaction rules (order of operations, ceilings)
- Future placeholders — things explicitly not in v1, noted to
  prevent premature implementation

---

## N+2. Relationship to Other Systems                   ← Required

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| [filename]    | [reads/writes/triggers/depends on] | §N.N |

Include a "No Direct Interaction" note for adjacent systems that
do NOT interact, to prevent future confusion.

---

## N+3. Data Model (Preview)                            ← Required

Key types, interfaces, or schemas this system introduces or extends.
Use TypeScript-style notation. Include field-level comments.

If extending an existing schema, note: "Additions to existing schema:"

---

## N+4. Build Sequence (Preview)                        ← Optional

Phased implementation plan, if the system is complex enough to need
one. Each phase groups related steps. Include "write tests for X"
steps where boundary values matter.

---

## N+5. Out of Scope                                    ← Required

What this system explicitly does NOT do. Be specific.
Reference the PRD's out-of-scope list (PRD §11) where relevant.

---

## N+6. Open Questions                                  ← Required

Numbered list. If none, write: "None — all questions resolved."

---

## N+7. Files Affected (Summary)                        ← Optional

| File Path | Change |
|-----------|--------|

---

## Claude Code Handoff Prompt                           ← Required

[Fenced code block with ready-to-paste Claude Code session opener.
See spec-writer skill for format.]
```

---

### Design Principle Examples

Good design principles for Tech Specs:

- "The concept extraction pipeline is **conservative by default** — it's better to miss a concept and let the user add it than to hallucinate a concept the user didn't intend."
- "The data persistence layer is **format-agnostic** — it serializes and deserializes without knowing what a Concept Type means."
- "The MCP Server is a **read-only window** into the project — external tools can query but never modify Story Engine data."

Bad design principles (too vague to guide decisions):

- "This system should be fast and reliable."
- "Keep it simple."

---

## Template 2: Design Spec

**Use for:** Screens, flows, interaction patterns, visual surfaces — anything that describes what the user sees, touches, and experiences.

**File naming:** `Spec_[SurfaceArea]_Design.md` — e.g., `Spec_WorldBuilder_Design.md`, `Spec_StartScreen_Design.md`, `Spec_InsightsPanel_Design.md`

**When to choose Design Spec vs. Tech Spec:** If the primary question is "what does the user see and do?", it's a Design Spec. If the primary question is "how does the system compute/process/store?", it's a Tech Spec.

---

### Design Spec Skeleton

```markdown
# Story Engine — [Surface Area] Specification

**UX & Interaction Design**

Version 0.1 | [Month Year] | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|

---

## 1. Overview                                          ← Required

What this surface area is and what it lets the user accomplish
(one to two sentences).

**Design principle:** [A bold statement about the UX philosophy
driving this surface. See examples below.]

**User goals:** What the user is trying to do when they land here.
Bullet list, ordered by priority.

**Scope boundary — this surface does NOT:**
- [Explicit list of what's excluded]

---

## 2. Surface Inventory                                 ← Required

A table listing every screen, panel, and significant UI region
that this Design Spec covers. Each row becomes a candidate
Buildable Unit at Level 3.

| Surface | Type | Purpose |
|---------|------|---------|
| [Name]  | Screen / Panel / Modal / Overlay | [What it does] |

---

## 3. Information Hierarchy                             ← Required

For each surface listed above, describe:
- What information appears (and in what order of visual priority)
- What's always visible vs. revealed on interaction
- What's editable vs. read-only

This section replaces wireframes. Be specific enough that someone
could sketch the layout from the description alone.

---

## 4. Interaction Patterns                              ← Required

How the user interacts with each surface:
- Input methods (typing, clicking, dragging, selecting)
- Feedback (what changes when the user acts — animations, state
  changes, new content appearing)
- Navigation (how the user moves between surfaces)

---

## 5. States & Modes                                    ← Required

Every surface has states. Common ones to consider:
- Empty state (first use, no data yet)
- Loading state (waiting for AI response, image generation)
- Populated state (normal use with content)
- Error state (API failure, network loss)
- Edge-case states (maximum content, very long text, etc.)

Describe each relevant state for each surface.

---

## 6. Data Dependencies                                 ← Required

What data this surface needs to render, and where it comes from:

| Data Needed | Source | Tech Spec Reference |
|-------------|--------|---------------------|
| [What]      | [Where it comes from] | [Spec file §section] |

---

## 7. Visual Language Application                       ← Required

How the project's visual language (from HARD_RULES.md) applies
to this specific surface. Don't repeat the rules — reference them
and note any surface-specific details:

- Which fonts are used where (Barlow for X, Domine for Y)
- Corner radius choices within the 4px–12px range
- Any surface-specific spacing or layout patterns
- Card styling details relevant to this surface

---

## 8. Out of Scope                                      ← Required

What this surface explicitly does NOT include. Be specific.

---

## 9. Open Questions                                    ← Required

Numbered list. If none: "None — all questions resolved."

---

## 10. Related Buildable Units                          ← Required

List of anticipated Level 3 documents that will be created from
this Design Spec:

| Buildable Unit | Type | File Name |
|----------------|------|-----------|
| [Name]         | Screen / Component / Logic | [filename] |

This list is anticipatory — it will be confirmed or revised when
writing the actual Buildable Unit docs.

---

## Claude Code Handoff Prompt                           ← Required

[Fenced code block. For Design Specs without a Build Sequence,
frame this as: "Use this spec as the source of truth for layout,
states, and interaction rules when building the UI."]
```

---

### Design Principle Examples

Good design principles for Design Specs:

- "The chat panel is a **conversation, not a command line** — it should feel like talking to a creative collaborator, not issuing instructions to a machine."
- "The card dashboard is a **sketchbook wall, not a spreadsheet** — cards are visual artifacts the user arranges by creative instinct, not by data logic."
- "The Insights Panel is an **idea inbox, not a notification center** — insights wait patiently for attention, they never interrupt the creative flow."

---

## Template 3: Buildable Unit

**Use for:** Individual screens, reusable components, and discrete logic modules. Each Buildable Unit is scoped tightly enough that Claude Code can build it without further decomposition or guessing.

**File naming by type:**
- Screens: `Screen_[Name].md` — e.g., `Screen_StartScreen.md`, `Screen_WorldBuilder.md`
- Components: `Component_[Name].md` — e.g., `Component_ConceptCard.md`, `Component_ChatPanel.md`
- Logic modules: `Logic_[Name].md` — e.g., `Logic_ConceptExtraction.md`, `Logic_ConceptVersioning.md`

**The quality bar:** Could Claude Code read this document and produce working code without asking clarifying questions? If it would need to guess about anything, the spec is underspecified.

---

### Buildable Unit Skeleton

```markdown
# Story Engine — [Unit Name]

**[Screen / Component / Logic] Specification**

Version 0.1 | [Month Year] | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|

---

## 1. Purpose                                           ← Required

One to two sentences: what this unit is, what it does, and why
it exists as a separate unit.

**Parent spec:** [The Level 2 spec this unit belongs to, e.g.,
`Spec_WorldBuilder_Design.md §2`]

---

## 2. Behavior                                          ← Required

This section varies by unit type:

### For Screens:
- Layout description (what goes where, responsive behavior)
- Content displayed (with specifics — not "shows data" but
  "shows the Concept Type label in Barlow 16pt and the value
  in Domine 14pt")
- Navigation (what navigates here, what navigates away)
- All states: empty, loading, populated, error

### For Components:
- Props / inputs (what data it receives)
- Visual rendering (what it looks like in each state)
- Variants (if the same component looks different in
  different contexts, list every variant)
- Interaction (what happens when the user clicks, hovers,
  drags, etc.)

### For Logic Modules:
- Inputs (what data it receives, with types)
- Processing (the exact logic, formulas, or rules it applies)
- Outputs (what it produces, with types)
- Worked examples (at least one; two if the spread matters)

---

## 3. Rules                                             ← Required

The specific logic, constraints, and business rules this unit owns.
Bullet list. Be precise:
- "Maximum 50 cards visible on the dashboard at once"
  (not "don't show too many cards")
- "Concept Type labels render in Barlow 14pt, Title Case"
  (not "use the right font")

---

## 4. Dependencies                                      ← Required

What this unit needs from other units, systems, or data sources:

| Dependency | Type | Source |
|------------|------|--------|
| [What it needs] | Component / Logic / Data / API | [Where it comes from] |

---

## 5. Edge Cases                                        ← Required

Specific scenarios that require special handling:
- What happens when [unusual condition]?
- What happens when [boundary is hit]?
- What happens when [external system fails]?

---

## 6. Out of Scope                                      ← Required

What this unit does NOT do. This is mandatory — every unit, no
exceptions. Be specific:
- "Does NOT handle image generation — that's `Logic_ImageGeneration.md`"
- "Does NOT persist data — it renders what it receives from props"
- "Does NOT validate Concept Types — it displays whatever it's given"

---

## 7. Done Criteria                                     ← Required

Concrete, testable acceptance conditions. Every criterion must be
something you can verify by looking at or using the result.

Good done criteria:
- "Card displays Concept Type label, value text, and image
  (if present) without truncation for values up to 200 characters"
- "Clicking a card opens the edit modal with the current value
  pre-filled"
- "Empty state shows placeholder text: 'Start chatting to add
  concepts to your [Builder] dashboard'"

Bad done criteria:
- "Looks good"
- "Works correctly"
- "Handles edge cases properly"

---

## Claude Code Handoff Prompt                           ← Required

[Fenced code block. Be specific about the first task — never say
"implement this spec" generically. Point to a concrete starting
action.]
```

---

## When Templates Overlap

Some features need both a Tech Spec and a Design Spec. For example:

- **Chat Engine:** Tech Spec for the AI pipeline (concept extraction, prompt design, API integration) + Design Spec for the chat interface (layout, input patterns, message rendering)
- **Export System:** Tech Spec for the export formats and generation logic + Design Spec for the export flow UI (settings, preview, download)

When this happens, the Tech Spec owns the "how it works" and the Design Spec owns the "what the user sees." They cross-reference each other but don't duplicate content. If you're about to copy-paste from one spec into another, stop — write a cross-reference instead.

---

## Checklist Before Finishing Any Spec

Use this before marking any spec document complete:

- [ ] Every Required section is present (even if the answer is "N/A — [reason]")
- [ ] Out of Scope is specific and non-empty
- [ ] Open Questions section exists (even if it says "None — all questions resolved")
- [ ] All cross-references resolve (referenced files exist or are noted as "not yet written")
- [ ] Worked examples are included for every formula or complex rule
- [ ] Done Criteria (Buildable Units only) are concrete and testable — no subjective language
- [ ] Claude Code Handoff Prompt is present and specific
- [ ] Design principles are specific enough to guide real decisions (not just "keep it simple")
- [ ] Version history is filled in

---

*This is a living document. Templates may be refined as we write actual specs and discover what's missing or unnecessary. Next step: Step 3 — Structure Map (`Structure_Map.md`).*
