# Story Engine — Step Menu Specification

**UX & Interaction Design**

Version 0.1 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | May 2026 | Initial draft. Three-phase menu layout, phase locking behavior, progress states, navigation context, and visual continuity with entry flow. Based on Figma designs (Screen_Step Menu 46:11). |

---

## 1. Overview

The Step Menu is the third screen in the entry flow and the creative pipeline's table of contents. It presents the three active phases — Discovery, Development, and Refinement — as a numbered list the user navigates through sequentially. Phases are locked until the previous phase is complete, reinforcing the idea that creative work builds on itself: you discover before you develop, and you develop before you refine.

**Design principle: A table of contents, not a dashboard.** The Step Menu tells the user where they are in their creative journey and where they're headed next. It's not a status tracker or a project management view — it's a chapter list. The user glances at it, sees their current chapter, and taps to enter. Locked phases are visible (so the user knows what's ahead) but clearly not yet available.

**User goals:**
- See the full creative pipeline at a glance — all three phases, their sequence, and their relationship
- Understand which phase they're currently in or should enter next
- Tap a phase to enter it
- Understand that later phases aren't available yet (without feeling blocked or punished)

**Scope boundary — this surface does NOT:**
- Display Production Handoff (the fourth phase). Production Handoff is accessed from within the Refinement workspace, not from this menu. If it becomes a separate screen in the future, it can be added here.
- Show project details, metadata, or configuration. The Step Menu is phase navigation only.
- Display the Insights Panel, chat, canvas, or any workspace content.
- Handle project creation or selection (that's the Project Chooser and Project List screens).
- Provide settings, preferences, or account access.

---

## 2. Surface Inventory

| Surface | Type | Purpose |
|---------|------|---------|
| Step Menu Screen | Screen | Full-screen white surface with three phase rows |
| Phase Row (×3) | Interactive region | Tappable row for each phase — number, name, and horizontal rule |
| Back Control | Control | Navigation element to return to the Project Chooser (see §4.4) |

---

## 3. Information Hierarchy

### 3.1 Screen Layout

A white background (`#FFFFFF`) with three stacked rows positioned in the upper-left quadrant of the screen. The layout mirrors the Project Chooser's composition — content sits left and vertically centered-high, with generous white space below and to the right. This creates visual continuity across the entry flow.

### 3.2 Row Structure

Each phase row contains three elements:

**Phase number:**
- Font: Barlow Thin (weight 100)
- Size: 96pt
- Color: Dark text (`#1A1A1A`) when unlocked; reduced opacity or lighter color when locked (see §5)
- Position: Left-aligned at x≈115, vertically centered within the row

**Phase name:**
- Font: Barlow Thin (weight 100)
- Size: 96pt
- Color: Same as phase number — dark when unlocked, reduced when locked
- Position: Left edge at x≈205, with a gap of approximately 90px from the number. Vertically centered with the number on the same baseline

**Horizontal rule:**
- A 1px solid line spanning the content region width (922px, from x=102 to x=1024)
- Color: Dark gray / near-black when unlocked; lighter when locked
- Positioned below the phase name, providing visual separation between rows

### 3.3 Row Content

| Row | Number | Phase Name | Rule Position (y) |
|-----|--------|-----------|-------------------|
| 1 (top) | 1 | Discovery | y≈425 |
| 2 (middle) | 2 | Development | y≈578 |
| 3 (bottom) | 3 | Refinement | y≈731 |

### 3.4 Vertical Spacing

- First row text: vertically centered at y≈349
- First horizontal rule: y≈425
- Gap between first rule and second row text center: approximately 77px
- Second row text: vertically centered at y≈502
- Second horizontal rule: y≈578
- Third row text: vertically centered at y≈655
- Third horizontal rule: y≈731

The vertical rhythm is consistent — approximately 153px from one row center to the next, giving each phase equal visual weight.

---

## 4. Interaction Patterns

### 4.1 Tap an Unlocked Phase

The entire row region (number + name + surrounding space above the rule) is the tap target. Tapping an unlocked phase navigates the user into that phase's screen:

| Phase | Navigation Target |
|-------|------------------|
| Discovery | `/project/:projectId/discovery` — the Discovery canvas |
| Development | `/project/:projectId/workspace` with `currentPhase: DEVELOPMENT` |
| Refinement | `/project/:projectId/workspace` with `currentPhase: REFINEMENT` |

Development and Refinement both navigate to the workspace route — the workspace adapts its behavior based on the project's `currentPhase` (per `Spec_Navigation.md` §3.4).

### 4.2 Tap a Locked Phase

Nothing happens. The tap is absorbed — no navigation, no error message, no tooltip. The visual treatment of locked phases (see §5.3) communicates that they're not yet available. No additional feedback is needed.

**Why no message on locked tap:** Adding a "Complete Discovery first" message would turn this into a task manager. The locked visual state is sufficient — the user can see which phases are available and which aren't. The creative pipeline speaks for itself.

### 4.3 Phase Locking Rules

Phases unlock sequentially based on the project's progress:

| Project State | Discovery | Development | Refinement |
|---------------|-----------|-------------|------------|
| New project (just created) | Unlocked | Locked | Locked |
| Discovery in progress | Unlocked | Locked | Locked |
| Discovery consolidated | Unlocked | Unlocked | Locked |
| Development in progress | Unlocked | Unlocked | Locked |
| Refinement unlocked | Unlocked | Unlocked | Unlocked |

**Unlock trigger — Discovery → Development:** Development unlocks when the Discovery phase reaches `CONSOLIDATED` status (per `Spec_DiscoveryEngine.md` §4). The user must complete at least one consolidation before Development becomes available.

**Unlock trigger — Development → Refinement:** The trigger for unlocking Refinement is not yet defined in the existing specs. A reasonable default: Refinement unlocks when the project has a minimum number of Concepts created during Development (e.g., at least 5 Concepts across any dimensions). The exact trigger should be formalized in `Spec_ChatEngine.md` or a future spec. For now, the Step Menu reads whatever the project's phase-state data says about whether each phase is accessible.

**Backward navigation is always allowed.** A user who has reached Refinement can always tap Discovery or Development to return to those phases. Phases never re-lock once unlocked. Per `HARD_RULES.md`: "Phases are not gates. Users can move backward and forward freely between phases."

### 4.4 Back Navigation

The user needs a way to return to the Project Chooser (e.g., to switch projects or start a new story). The Figma design does not show an explicit back control, so the options are:

- **Browser back button** — always available on web, no implementation needed
- **A subtle back affordance** — e.g., a small "←" or the "STORYENGINE" wordmark in the top-left corner that navigates back to the Project Chooser

For v1, relying on the browser back button is acceptable. An in-app back control can be added during implementation if it feels needed. If added, it should be extremely subtle — a small Barlow Thin text element, not a prominent button.

---

## 5. States & Modes

### 5.1 New Project (Only Discovery Unlocked)

The user just created a project and arrived from the Project Chooser.

- **Discovery row:** Full contrast — dark text (`#1A1A1A`), dark horizontal rule. Tappable.
- **Development row:** Reduced contrast — text and rule rendered in a lighter tone (see §5.3 for locked styling). Not tappable.
- **Refinement row:** Same locked treatment as Development. Not tappable.

This is the most common initial state. The user's eye is drawn to Discovery because it's the only row at full contrast.

### 5.2 Returning to Step Menu (Multiple Phases Unlocked)

The user has been working on a project and returned to the Step Menu (via back navigation from Discovery or the workspace).

- All unlocked phases render at full contrast and are tappable
- The phase the user was most recently working in could receive a subtle indicator (see §5.4), but this is optional

### 5.3 Locked Phase Visual Treatment

Locked phases must look clearly unavailable without feeling punitive or broken. The treatment:

- **Text color:** Tertiary text color (`#999999`) instead of dark text (`#1A1A1A`). This makes locked phases legible but visually recessive — they're visible but clearly "not yet."
- **Horizontal rule color:** Same tertiary treatment — the rule lightens to `#D2D2D2` or similar
- **No icons, badges, or lock symbols.** The contrast reduction alone communicates the locked state. Adding a padlock icon would make this feel like a permissions system, not a creative journey.
- **No strikethrough, no graying-out of the number.** The phase number and name remain fully readable — the user should be able to see what's ahead.

### 5.4 Current Phase Indicator (Optional)

When the user returns to the Step Menu from a phase, it may be helpful to indicate which phase they were just in. Options:

- A small dot or marker next to the current phase number
- The current phase name rendered in a slightly bolder weight (Barlow Light instead of Barlow Thin)
- The italic annotation pattern from the Project Chooser — e.g., the current phase could show a brief italic label like *"in progress"* or *"current"* in Domine Bold Italic

This is a nice-to-have, not a requirement for v1. The Step Menu works without it — the user generally knows which phase they're in. If implemented, the treatment should be very subtle — a whisper, not a shout.

### 5.5 All Phases Complete

When the user has progressed through all three phases:

- All three rows render at full contrast and are tappable
- No special "congratulations" state or visual fanfare — the Step Menu remains a simple navigation surface
- Production Handoff, if eventually added, could appear as a fourth row at this point (future consideration)

---

## 6. Data Dependencies

| Data Needed | Source | Tech Spec Reference |
|-------------|--------|---------------------|
| Project's `currentPhase` | Project entity | `Spec_DataModel.md` §2 |
| Phase unlock status | PhaseState entity | `Spec_DataModel.md` §5 |
| Discovery consolidation status | `phaseState.discovery.status` | `Spec_DiscoveryEngine.md` §4 |
| Project ID (for navigation) | Route parameter | `Spec_Navigation.md` §2 |

The Step Menu is a lightweight read — it checks the project's phase state to determine which phases are locked/unlocked, then renders accordingly. No heavy data loading.

---

## 7. Visual Language Application

### Typography usage on this surface

| Element | Font | Weight | Size | Color (unlocked) | Color (locked) |
|---------|------|--------|------|-------------------|----------------|
| Phase number | Barlow | Thin (100) | 96pt | `#1A1A1A` | `#999999` |
| Phase name | Barlow | Thin (100) | 96pt | `#1A1A1A` | `#999999` |
| Current phase indicator (optional) | Domine | Bold Italic | 24pt | `#1A1A1A` | N/A |

**Font rule for this surface:** Only Barlow appears on this screen in its default state (no Domine unless the optional current-phase indicator is implemented). This is a purely structural, navigational surface — no content, no descriptions, no body text.

**Size exception:** The 96pt phase text exceeds the HARD_RULES 36pt maximum. This is an intentional exception consistent with the Splash screen's 260pt title and the Project Chooser's 40pt labels — the entry flow screens use display-scale typography throughout. This exception applies only to the entry flow.

### Corner radius usage

No rounded corners appear on this screen.

### Horizontal rules

- Width: 922px (from x=102 to x=1024)
- Weight: 1px
- Color (unlocked): Dark gray / near-black — matching Project Chooser and forming a consistent visual pattern
- Color (locked): Lighter gray (`#D2D2D2`) — visually recessive but still present

### Color usage

| Element | Unlocked | Locked |
|---------|----------|--------|
| Background | `#FFFFFF` | `#FFFFFF` |
| Phase number + name | `#1A1A1A` | `#999999` |
| Horizontal rule | Dark gray | `#D2D2D2` |

---

## 8. Visual Continuity Across Entry Flow

The three entry flow screens form a visual sequence:

| Screen | Typography Scale | Content |
|--------|-----------------|---------|
| Splash | 260pt | Product name (cinematic) |
| Project Chooser | 40pt | Two options (intimate) |
| Step Menu | 96pt | Three phases (architectural) |

The scale shifts are intentional — the Splash is enormous and atmospheric, the Project Chooser drops to a quieter scale for a personal decision, and the Step Menu opens back up to a confident, structural scale for the creative pipeline overview. All three share: Barlow Thin as the primary font, horizontal rules as dividers, left-aligned composition in the upper portion of the screen, generous white space, and white backgrounds.

The transition from Project Chooser (40pt, two rows) to Step Menu (96pt, three rows) should feel like opening a chapter — the type gets bigger, the scope expands, the creative journey is laid out.

---

## 9. Navigation Context

This screen is the third in the entry flow:

```
Splash → Project Chooser → **Step Menu** → [Discovery or Workspace]
```

- **Entry (new project):** User tapped "Start New Story" on the Project Chooser → project was created → arrive here with only Discovery unlocked
- **Entry (existing project):** User selected a project from the Project List → arrive here with phases unlocked based on project progress
- **Entry (returning from phase):** User navigated back from Discovery or the workspace → arrive here with current unlock state
- **Exit:** Tap an unlocked phase → navigate to that phase's screen (see §4.1)
- **Back:** Browser back button returns to the Project Chooser

**Route consideration:** Like the Project Chooser, this screen could be a distinct route (e.g., `/project/:projectId/steps`) or an in-memory state at the project route. The Step Menu needs the `projectId` to look up phase state, so it must receive the project context from the previous screen. Route decisions are deferred to the Navigation spec update.

---

## 10. Out of Scope

- **Production Handoff phase.** The fourth phase is not shown on the Step Menu in v1. It's accessed from within the Refinement workspace.
- **Phase descriptions or subtitles.** The Step Menu shows only the number and name — no explanatory text about what each phase involves. The phase names are self-explanatory.
- **Progress bars or completion percentages.** The Step Menu is a table of contents, not a progress tracker.
- **Project title or metadata display.** The Step Menu doesn't show which project is loaded. The user knows — they just selected or created it.
- **Phase reordering or customization.** The three phases are fixed in order. The user cannot rearrange, skip, or add phases.
- **Transition animations between rows.** Staggered row animations (rows appearing one by one) could be a nice touch but are not specced. Implementation can add this as polish.
- **Keyboard navigation.** Arrow-key navigation between phase rows is a nice-to-have for accessibility, not required for v1.

---

## 11. Open Questions

1. **Refinement unlock trigger:** What specific condition unlocks Refinement? The spec suggests "at least 5 Concepts" as a placeholder, but this should be formalized. It could be a concept count, a dimension coverage threshold (concepts in at least 2 of 3 dimensions), or a manual user action ("I'm ready to refine"). To be decided in `Spec_ChatEngine.md` or a Development-phase spec.

2. **Current phase indicator:** Should the Step Menu show which phase the user was most recently working in? If so, which treatment — dot, weight shift, or italic annotation? See §5.4. To be decided during implementation.

3. **Step Menu as return destination:** When the user finishes a session in Discovery or the workspace, do they return to the Step Menu or to the Project Chooser? The current spec assumes the Step Menu is the return destination (you're still in the project context). But this needs alignment with the Navigation spec — currently `Spec_Navigation.md` §3.7 describes close-project going to the Start Screen (route `/`), which would be the Splash. The entry flow routing needs reconciliation.

---

## 12. Related Buildable Units

| Buildable Unit | Type | File Name |
|----------------|------|-----------|
| Step Menu Screen | Screen | `Screen_StepMenu.md` |

Like the Splash and Project Chooser, this screen is simple enough for a single Screen-level Buildable Unit. The three phase rows share identical structure and can be rendered from a data-driven list — no separate Component specs needed.

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: storyengine | Branch: main

Spec file: docs/start-screen/Spec_StepMenu_Design.md
→ Read this spec (v0.1) for the Step Menu layout, phase locking
  behavior, locked/unlocked visual states, and navigation context.

Also read before starting:
- docs/start-screen/Spec_SplashScreen_Design.md (Splash screen spec)
- docs/start-screen/Spec_ProjectChooser_Design.md (Project Chooser spec)
- docs/HARD_RULES.md (non-negotiable constraints)
- docs/design/DESIGN.md (design system tokens)
- docs/foundation/Spec_Navigation.md (route context — Discovery at
  /project/:projectId/discovery, Workspace at
  /project/:projectId/workspace)
- docs/foundation/Spec_DataModel.md (Phase enum, PhaseState entity)

Use this spec as the source of truth for layout, states, and
interaction rules when building the Step Menu screen.

Key constraints:
- Three rows: 1 Discovery, 2 Development, 3 Refinement (§3.3)
- Phase numbers and names in Barlow Thin 96pt (§3.2)
- Phases are locked sequentially — only completed + next are
  tappable (§4.3)
- Locked phases use #999999 text and #D2D2D2 rules (§5.3)
- Tapping a locked phase does nothing — no error, no message (§4.2)
- Horizontal rules: 1px, 922px wide, x=102 to x=1024 (§3.2)
- Discovery navigates to /discovery route, Development and
  Refinement navigate to /workspace route (§4.1)

Start with: the Step Menu screen layout — white background, three
phase rows with numbers, names, and horizontal rules, positioned
per the Figma coordinates in §3.4. Render all three rows at full
contrast first (ignore locking), then add the locked/unlocked
state logic reading from the project's PhaseState.

Build the full entry flow together: Splash → Project Chooser →
Step Menu. Get all three screens rendering with navigation wired
between them before adding phase-locking logic.

Work incrementally. After the static layout, stop and check in.
Commit after each step with a message like
"feat(entry-flow): Step Menu static layout with three phase rows".
```

---

*This spec covers the Step Menu — the third and final screen in the entry flow. For the Splash screen, see `Spec_SplashScreen_Design.md`. For the Project Chooser, see `Spec_ProjectChooser_Design.md`. For phase transition behavior within the workspace, see `Spec_Navigation.md` §3.4. The Step Menu is the bridge between project selection and creative work — it orients the user in the pipeline and sends them to the right phase.*
