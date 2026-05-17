# Story Engine — Project Chooser Specification

**UX & Interaction Design**

Version 0.1 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | May 2026 | Initial draft. Two-option chooser layout, interaction behavior, italic annotations, states, and navigation context. Based on Figma designs (Screen_Existing-New 46:21). |

---

## 1. Overview

The Project Chooser is the second screen in the entry flow, appearing immediately after the Splash screen. It presents the user with exactly two options — open an existing story or start a new one — using the same minimal, editorial layout language established by the Step Menu.

**Design principle: Two doors, no lobby.** This screen is a fork in the road, not a destination. It should take less than two seconds to read and act on. No explanatory text, no onboarding, no decoration — just two clearly labeled paths with poetic annotations that set the creative tone. The user picks a door and moves through it.

**User goals:**
- Decide whether to continue working on an existing project or begin a new one
- Act on that decision with a single tap

**Scope boundary — this surface does NOT:**
- Display the project list (that's a separate screen/overlay triggered by tapping "Open existing Story")
- Handle project creation logic (that's `Spec_DataPersistence.md` §6 — this screen just triggers the navigation)
- Show the Step Menu or phase picker (that's the next screen in the new-project flow)
- Display any Splash screen elements (the video and title are gone — this is a clean white screen)
- Provide settings, preferences, or account access

---

## 2. Surface Inventory

| Surface | Type | Purpose |
|---------|------|---------|
| Project Chooser Screen | Screen | Full-screen white surface with two tappable rows |
| Open Existing Row | Interactive region | Tappable row that navigates to the Project List screen |
| Start New Row | Interactive region | Tappable row that creates a new project and navigates to the Step Menu |

---

## 3. Information Hierarchy

### 3.1 Screen Layout

A white background (`#FFFFFF`) with two stacked rows positioned in the upper-left quadrant of the screen. The layout is deliberately asymmetric — content sits left and vertically centered-high rather than dead center, giving the screen a calm, editorial feel with generous white space below and to the right.

### 3.2 Row Structure

Both rows share an identical visual structure:

**Left side — Action label:**
- Font: Barlow Thin (weight 100)
- Size: 40pt
- Color: Dark text (`#1A1A1A`, rendered as `text-black` in the design)
- Alignment: Left-aligned
- Position: Left edge at x≈125 from the viewport edge

**Right side — Italic annotation:**
- Font: Noticia Text Bold Italic
- Size: 24pt
- Color: Dark text (`#1A1A1A`)
- Alignment: Right-aligned against the right edge of the horizontal rule (x≈1024)
- Vertically centered with the action label on the same row

**Below — Horizontal rule:**
- A 1px solid line spanning the width of the content region (approximately 922px, from x=102 to x=1024)
- Color: Dark gray (matching the rules on the Step Menu — appears to be `#1A1A1A` or a very dark gray)
- Positioned below the action label with spacing that gives the row visual breathing room

### 3.3 Row Content

| Row | Action Label | Annotation | Rule Position (y) |
|-----|-------------|------------|-------------------|
| 1 (top) | "Open existing Story" | *past* | y≈495 |
| 2 (bottom) | "Start New Story" | *prologue* | y≈648 |

**Annotation meaning:** The italic annotations ("past" and "prologue") are poetic labels that frame the two options in storytelling language — opening an existing story means returning to something already begun (*past*), while starting a new story is the beginning of something (*prologue*). These are read-only decorative text, not interactive.

### 3.4 Vertical Spacing

- First row action label: vertically centered at y≈418
- First horizontal rule: y≈495
- Second row action label: vertically centered at y≈571
- Second horizontal rule: y≈648
- Gap between the bottom of the first rule and the top of the second label: approximately 76px

The content block as a whole is positioned in the upper portion of the screen, starting roughly 38% down from the top (418 of 1080). This is intentional — the design avoids dead-centering, placing content slightly above the midpoint for a more natural, editorial composition.

---

## 4. Interaction Patterns

### 4.1 Tap "Open existing Story"

The entire row region (label + annotation + surrounding space above the rule) is the tap target, not just the text.

**Behavior:** Tapping this row navigates to a separate Project List screen where the user can browse and select from their existing projects.

**Hover state (desktop):** On mouse hover over the row region, the action label text could shift to a slightly bolder weight or the annotation could increase in opacity — a subtle signal that the row is interactive. The exact hover treatment is an implementation detail, but it should be restrained: no background color change, no underlines, no heavy effects. A gentle opacity or weight shift is sufficient.

### 4.2 Tap "Start New Story"

Same tap target behavior as above — the full row region is tappable.

**Behavior:** Tapping this row:
1. Creates a new project (calls `createProject` per `Spec_DataPersistence.md` §6 — generates a project with `currentPhase: DISCOVERY`)
2. Navigates to the Step Menu screen with the new project context

**No naming step:** The user is not asked to name their project at this point. Projects can be named later (or auto-named based on content). The priority is getting the user into the creative flow immediately — naming is friction.

### 4.3 No Other Interactions

There is no back button visible on this screen. The user can use the browser back button to return to the Splash screen, but there is no in-app back control. The two rows are the only interactive elements.

---

## 5. States & Modes

### 5.1 Default State (No Existing Projects)

If the user has never created a project before (first launch after install), both rows still appear. "Open existing Story" is **not hidden or disabled** — if tapped, the Project List screen opens and shows an empty state (e.g., "No stories yet"). This keeps the screen layout stable and predictable regardless of whether projects exist.

### 5.2 Default State (Existing Projects Present)

Both rows appear identically to the no-projects state. There is no badge, count, or preview showing how many existing projects the user has. The screen stays minimal.

### 5.3 Loading State (Creating New Project)

After the user taps "Start New Story," there's a brief moment while the project is being created on disk.

- The "Start New Story" label could transition to a subtle loading indicator (e.g., the text fading slightly or a small spinner appearing in place of the "prologue" annotation)
- The row becomes non-interactive during creation to prevent double-taps
- Duration: typically under 500ms for local project creation — this state may be imperceptible in practice
- On completion: navigate to the Step Menu immediately

### 5.4 Error State (Project Creation Failure)

If project creation fails (disk write error, permissions issue):

- A brief error message appears below the "Start New Story" row: "Something went wrong — please try again." in Noticia Text Regular 14pt, secondary text color (`#636363`)
- The message fades after 5 seconds
- The row returns to its default interactive state so the user can retry

---

## 6. Data Dependencies

| Data Needed | Source | Tech Spec Reference |
|-------------|--------|---------------------|
| Project existence check (optional) | `listProjects` from DataPersistence | `Spec_DataPersistence.md` §6 |
| Project creation | `createProject` from DataPersistence | `Spec_DataPersistence.md` §6 |

The project existence check is optional — it's only needed if the screen ever wants to conditionally show/hide or style the "Open existing Story" row differently when no projects exist. Per §5.1, the current design shows both rows regardless, so this check is not strictly required on initial load. The Project List screen handles the empty-state experience.

---

## 7. Visual Language Application

### Typography usage on this surface

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Action labels | Barlow | Thin (100) | 40pt | `#1A1A1A` |
| Italic annotations | Noticia Text | Bold Italic | 24pt | `#1A1A1A` |
| Error message | Noticia Text | Regular | 14pt | `#636363` |

**Font rule for this surface:** Barlow Thin is used for the action labels (structural, navigational text). Noticia Text Bold Italic is used for the poetic annotations (content, editorial voice). This follows the established pattern: Barlow for structure, Noticia Text for content — but with an expressive twist: the annotations use bold italic to set them apart as a distinct editorial voice, like stage directions in a script.

**Size note:** The 40pt action labels exceed the HARD_RULES 36pt maximum. This is an intentional exception consistent with the Step Menu's 96pt phase names — the entry flow screens use display-scale typography as a design feature. The annotations at 24pt are within the standard range.

### Corner radius usage

No rounded corners appear on this screen. There are no cards, panels, buttons, or bordered elements — just text and rules.

### Horizontal rules

- Width: 922px (from x=102 to x=1024)
- Weight: 1px
- Color: Dark gray / near-black
- These match the horizontal rules on the Step Menu, creating visual continuity across the entry flow

### Color usage

| Element | Color |
|---------|-------|
| Background | `#FFFFFF` (white) |
| Action label text | `#1A1A1A` (dark) |
| Annotation text | `#1A1A1A` (dark) |
| Horizontal rules | Dark gray / near-black |
| Error text | `#636363` (secondary) |

---

## 8. Navigation Context

This screen is the second in the three-screen entry flow:

```
Splash Screen → **Project Chooser** → Step Menu → [Discovery or Workspace]
                                    ↘ Project List → Step Menu → [Discovery or Workspace]
```

- **Entry:** User taps anywhere on the Splash screen → arrives here
- **Exit (new project):** Tap "Start New Story" → project created → navigate to Step Menu
- **Exit (existing project):** Tap "Open existing Story" → navigate to Project List screen → user selects a project → navigate to Step Menu (with that project's phase context)
- **Back:** Browser back button returns to the Splash screen. No in-app back control.

**Relationship to the Step Menu:** After either path (new or existing), the user arrives at the Step Menu with a project loaded. For a new project, all phases start fresh (only Discovery is unlocked). For an existing project, the Step Menu reflects the project's current phase progress.

**Route consideration:** This screen could live at the same root route (`/`) as the Splash, with the Splash → Project Chooser transition handled as in-memory state (no URL change), or it could be a distinct route like `/choose`. The decision is deferred to the Navigation spec update — either approach works. The behavior is the same regardless.

---

## 9. Visual Continuity with Step Menu

The Project Chooser and Step Menu share a deliberate visual language:

- Same horizontal rule style (1px, 922px wide, same x-position)
- Same left-aligned content positioning (x≈102–125)
- Same generous white space composition (content in upper-left, open space below and right)
- Same white background
- Barlow Thin as the primary label font on both screens

This creates a feeling of **moving through chapters of the same book** — the entry flow screens feel like pages in a sequence, not separate applications. The transition from Project Chooser to Step Menu should feel like turning a page, not launching a new screen.

---

## 10. Out of Scope

- **Project List screen.** The list of existing projects, including thumbnails, metadata, search/filter, and empty state, is a separate screen that gets its own spec.
- **Project naming or configuration.** No name, genre, or settings are collected at this point — the user goes straight into the creative flow.
- **Onboarding or tutorial.** No first-time-user guidance, tooltips, or walkthrough on this screen.
- **Project deletion.** Delete functionality, if it exists, lives on the Project List screen, not here.
- **Animation between Splash and Project Chooser.** The transition effect (fade, slide, cut) is an implementation detail — the spec defines the destination state, not the journey.
- **User avatar or settings.** No user-facing controls beyond the two rows.
- **Keyboard navigation between rows.** Tab/arrow-key navigation between the two rows is a nice-to-have for accessibility but not specced for v1.

---

## 11. Open Questions

1. **Hover state design:** Should the hover treatment be a weight shift (Barlow Thin → Barlow Light), an opacity change on the annotation, or something else? The design should stay subtle. To be decided during implementation — try a few options and pick what feels right.

2. **Transition to Project List:** When the user taps "Open existing Story," does the Project List appear as a full-screen replacement, a slide-in overlay, or a modal? This depends on the Project List screen design. Deferred to that spec.

3. **Project auto-naming:** When "Start New Story" creates a project, what's the default name? Options: "Untitled Story", a timestamp-based name, or no name at all (just the ID). Minor detail — to be decided during DataPersistence implementation or in a future spec.

---

## 12. Related Buildable Units

| Buildable Unit | Type | File Name |
|----------------|------|-----------|
| Project Chooser Screen | Screen | `Screen_ProjectChooser.md` |
| Project List Screen | Screen | `Screen_ProjectList.md` (separate spec — not part of this design) |

The Project Chooser is simple enough to be a single Screen-level Buildable Unit. The two rows are not complex enough to warrant separate Component specs — they're text + rules with tap handlers.

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: storyengine | Branch: main

Spec file: docs/start-screen/Spec_ProjectChooser_Design.md
→ Read this spec (v0.1) for the Project Chooser layout, row structure,
  interaction behavior, and navigation context.

Also read before starting:
- docs/start-screen/Spec_SplashScreen_Design.md (the screen before this
  one — understand the entry flow sequence)
- docs/HARD_RULES.md (non-negotiable constraints)
- docs/design/DESIGN.md (design system tokens — note: body font is
  now Noticia Text, pending update)
- docs/foundation/Spec_Navigation.md (route context)
- docs/foundation/Spec_DataPersistence.md (createProject for the
  "Start New Story" flow)

Use this spec as the source of truth for layout, states, and
interaction rules when building the Project Chooser screen.

Key constraints:
- Two rows only: "Open existing Story" and "Start New Story" (§3.3)
- Action labels in Barlow Thin 40pt, annotations in Noticia Text
  Bold Italic 24pt (§7)
- Full row region is the tap target, not just the text (§4)
- "Start New Story" calls createProject then navigates to Step Menu (§4.2)
- "Open existing Story" navigates to a separate Project List screen (§4.1)
- Both rows always visible regardless of whether projects exist (§5.1)
- Horizontal rules: 1px, 922px wide, matching Step Menu styling (§3.2)

Start with: the Project Chooser screen layout — white background,
two rows with action labels, italic annotations, and horizontal
rules, positioned per the Figma coordinates in §3.4. Get the static
layout pixel-accurate first, then add tap handlers and navigation.

Work incrementally. After the static layout, stop and check in
before wiring up navigation and project creation.
Commit after each step with a message like
"feat(entry-flow): Project Chooser static layout".
```

---

*This spec covers only the Project Chooser screen — the second surface in the entry flow. For the Splash screen that precedes it, see `Spec_SplashScreen_Design.md`. For the Step Menu that follows, see the next Design Spec in the entry flow sequence. For the Project List screen triggered by "Open existing Story," a separate spec is needed once that design is available.*
