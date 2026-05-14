# Story Engine — Navigation Specification

**Systems Design & Data Architecture**

Version 0.1 | April 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial draft. Route table, screen transitions, Builder switching, deep-link from Insights, state preservation rules. Resolves Structure Map §9 Open Question #3 (nav spec kept separate from DataModel). |

---

## 1. Overview

Navigation defines how the user moves between screens in Story Engine — what routes exist, what data each route requires, and what happens to in-memory state during transitions.

**Design principle: Navigation is invisible until it's broken.** The user should never think about navigation. Switching from World Builder to Character Builder should feel like turning a page in a sketchbook, not like launching a new application. Routes exist to support the illusion of a single continuous creative workspace.

**Consumer:** The web app shell (Expo Router) reads this spec to configure routes. The Start Screen uses it to know what to navigate to on project creation/open. The Builder uses it to know how to switch between Builder sections. The Insights Panel uses it to navigate to a specific Concept when the user acts on an insight.

**Scope boundary — this system does NOT:**
- Define the visual layout of any screen (that's `Spec_StartScreen_Design.md` and `Spec_Builder_Design.md`)
- Define how data is loaded when a screen opens (that's `Spec_DataPersistence.md` §6)
- Define URL/deep-linking from external tools (that's `Spec_MCPServer.md` if needed in a future version)
- Handle browser back/forward button behavior beyond what Expo Router provides by default
- Define any animation or transition effects between screens (that's the Design Specs)

---

## 2. Route Table

Story Engine has two screens with a small number of routes:

| Route Path | Screen | Parameters | Purpose |
|------------|--------|------------|---------|
| `/` | Start Screen | — | Entry point. Create new project or open existing. |
| `/project/:projectId/:builder` | Builder | `projectId`: string, `builder`: `world` \| `character` \| `storyline` | The main workspace. One route serves all three Builder variants. |

### Why only two routes

The PRD describes five "screens" (Start Screen, World Builder, Character Builder, Storyline Builder, Insights Panel), but architecturally there are only two:

- **Start Screen** — standalone, no project context needed.
- **Builder** — the workspace. World/Character/Storyline are the same screen with different content, selected by the `:builder` parameter. The Insights Panel is an overlay/sidebar within the Builder screen, not a separate route.

This keeps navigation simple: you're either picking a project or working on one.

### Route parameter details

**`:projectId`** — the full project ID string (e.g., `proj_V1StGnR4q8sMDc0hX3bYz`). Used to load the project via `openProject()` from `Spec_DataPersistence.md` §6.

**`:builder`** — lowercase string matching a Builder section. Maps to the Builder enum from `Spec_DataModel.md` §3:

| Route value | Builder enum | Display label |
|-------------|-------------|---------------|
| `world` | `WORLD` | World |
| `character` | `CHARACTER` | Character |
| `storyline` | `STORYLINE` | Storyline |

The route uses lowercase for URL cleanliness. The mapping to the SCREAMING_SNAKE_CASE enum happens in the route handler.

---

## 3. Screen Transitions

There are exactly four navigation actions in the app:

### 3.1 Start Screen → Builder (create new project)

**Trigger:** User clicks "Start New World", "Start New Character", or "Start New Storyline" on the Start Screen.

**Sequence:**
1. Call `createProject(name, description, initialBuilder)` from the persistence API
2. Receive the new `ProjectFile` with the generated `projectId`
3. Navigate to `/project/:projectId/:initialBuilder`
4. The Builder screen loads the project data from the received `ProjectFile` (no second load needed — the data is already in memory from step 1)

**Name handling:** The project is created with `name: "Untitled Project"`. The user can rename it later from within the Builder. The Start Screen does not prompt for a name before creation — get the user into the creative workspace as fast as possible.

### 3.2 Start Screen → Builder (open existing project)

**Trigger:** User clicks a project in the project list on the Start Screen.

**Sequence:**
1. Call `openProject(projectId)` from the persistence API
2. Navigate to `/project/:projectId/:lastUsedBuilder`
3. The Builder screen renders from the loaded `ProjectFile`

**Which Builder opens?** The last Builder the user was working in when they closed the project. This is tracked by the route parameter that was active when the project was last open. For newly created projects that haven't been opened before, use `initialBuilder` from the Project entity (`Spec_DataModel.md` §10).

**Storing last-used Builder:** When the user navigates away from a project (back to Start Screen or closes the app), the current `:builder` route parameter is persisted as a lightweight preference. Storage: a simple JSON file at `~/StoryEngine/preferences.json` containing `{ lastBuilder: { [projectId]: "world" | "character" | "storyline" } }`. This file is optional — if missing or corrupt, fall back to `initialBuilder`.

### 3.3 Builder → Builder (switch Builder section)

**Trigger:** User clicks a tab/button in the Builder navigation (World / Character / Storyline switcher — defined in `Component_BuilderNav.md`).

**Sequence:**
1. Update the route to `/project/:projectId/:newBuilder`
2. The Builder screen re-renders with the new Builder's chat history and concept cards
3. No data reload — the full `ProjectFile` is already in memory. Only the view filter changes (which Builder's concepts and messages to show).

**State preservation:** When switching Builders, the following state is preserved in memory (not lost and reloaded):
- The full `ProjectFile` (shared across all Builders — it's one project)
- Chat scroll position per Builder (each Builder remembers where the user was scrolled to)
- Card dashboard scroll/pan position per Builder
- Any unsaved edits in progress (the save system handles persistence per §7 of `Spec_DataPersistence.md`)

**What is NOT preserved across Builder switches:**
- Chat input field text (cleared on switch — the user is starting a conversation in a different context)
- Any open modals or overlays (closed on switch)

### 3.4 Builder → Start Screen (close/leave project)

**Trigger:** User clicks a "back" or "home" control in the Builder UI.

**Sequence:**
1. Flush any pending saves (per `Spec_DataPersistence.md` §7.2 — treat as a `flush` event)
2. Persist the current `:builder` parameter as `lastBuilder` for this project (§3.2)
3. Release the in-memory `ProjectFile` (free memory)
4. Navigate to `/`
5. The Start Screen re-lists projects (calls `listProjects()` to get fresh metadata, including updated `updatedAt` timestamps)

**No confirmation dialog in v1.** All work is auto-saved. There's nothing to "discard" — the user's state is always persisted. Closing the project just navigates home.

---

## 4. Deep Navigation from Insights Panel

When the user clicks "Act on this" on an Insight card in the Insights Panel, the system navigates to the relevant Concept. Since the Insights Panel is an overlay within the Builder screen (not a separate route), this is an in-screen action, not a route change — unless the target Concept is in a different Builder section.

### Same-Builder insight

**Sequence:**
1. Close the Insights Panel overlay
2. Scroll the card dashboard to bring the target Concept card into view
3. Highlight the target card briefly (visual pulse or outline) so the user can find it

No route change needed — the user is already in the correct Builder.

### Cross-Builder insight

The Insight references Concepts in multiple Builders (e.g., a Connection between a World concept and a Character concept). The user needs to see at least one of the referenced concepts.

**Sequence:**
1. Determine the "primary" referenced concept — the first entry in `referencedConceptIds[]`
2. If the primary concept's Builder matches the current Builder: same-Builder behavior (above)
3. If the primary concept's Builder differs: switch to that Builder (§3.3 transition), then scroll and highlight the card

**Why use the first referenced concept?** It's a simple, predictable rule. The user can manually switch to other Builders to see the other referenced concepts. More sophisticated UX (like a split view showing concepts from multiple Builders) is a future consideration, not v1.

---

## 5. Invalid Routes

| Scenario | Behavior |
|----------|----------|
| `/project/:projectId/:builder` where `projectId` doesn't exist | Navigate to `/` (Start Screen). Show a brief toast: "Project not found." |
| `/project/:projectId/:builder` where `builder` is not `world`, `character`, or `storyline` | Navigate to `/project/:projectId/world` (default to World Builder). No error shown. |
| Any unrecognized route (e.g., `/settings`, `/about`) | Navigate to `/` (Start Screen). |
| `/project/:projectId` (no builder specified) | Navigate to `/project/:projectId/world` (default to World Builder). |

All invalid-route handling is silent redirection. No error pages, no 404 screens. The user ends up somewhere reasonable.

---

## 6. Edge Cases & Rules

### Browser refresh on Builder route
When the user refreshes the browser while on `/project/:projectId/:builder`, the app reloads and calls `openProject(projectId)`. The Builder screen renders from the freshly loaded data. Chat scroll position and dashboard pan position are lost (they were in-memory only). This is acceptable — the data is intact, only the viewport state resets.

### Browser back/forward buttons
Expo Router handles browser history by default. Pressing back from a Builder goes to the Start Screen (or the previous route in history). No custom back-button handling is needed in v1.

### Multiple browser tabs
Not supported in v1. If the user opens the same project in two tabs, each tab loads its own copy of the `ProjectFile`. Saves from one tab will overwrite saves from the other. The write queue in `Spec_DataPersistence.md` §7.3 handles one-process serialization but cannot coordinate across browser tabs. This is a known limitation.

### Project deleted while Builder is open
If the project folder is deleted externally while the user is working on it, the next save attempt will recreate the folder (per `Spec_DataPersistence.md` §14). The user's in-memory state is preserved. This is an unusual edge case that doesn't need special UI handling in v1.

### Preferences file missing or corrupt
If `~/StoryEngine/preferences.json` can't be read, all `lastBuilder` lookups fall back to the Project's `initialBuilder`. The preferences file is never critical — it's a convenience optimization.

---

## 7. Relationship to Other Systems

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| `Spec_DataModel.md` | Uses Builder enum (§3) and Project entity (§10) for route parameters | §2 |
| `Spec_DataPersistence.md` | Calls `createProject`, `openProject`, `listProjects` during transitions; triggers `flush` on project close | §3.1, §3.2, §3.4 |
| `Spec_StartScreen_Design.md` | Start Screen layout triggers transitions §3.1 and §3.2 | §3 |
| `Spec_Builder_Design.md` | Builder layout contains the Builder switcher (§3.3) and back control (§3.4) | §3 |
| `Spec_InsightsEngine.md` | Insight "act on" action triggers deep navigation | §4 |
| `Component_BuilderNav.md` | The World/Character/Storyline tab switcher triggers §3.3 | §3.3 |

**No direct interaction:**
- `Spec_ChatEngine.md` — the chat engine writes data but doesn't trigger navigation.
- `Spec_ImageGeneration.md` — image operations don't change routes.
- `Spec_Export.md` — export is an action within the Builder, not a navigation event.
- `Spec_MCPServer.md` — the MCP Server doesn't trigger in-app navigation in v1.

---

## 8. Data Model (Preview)

This spec introduces one small new data structure and no changes to existing entities:

```typescript
// Stored in ~/StoryEngine/preferences.json — optional, non-critical
interface AppPreferences {
  lastBuilder: Record<string, "world" | "character" | "storyline">;
  // key is projectId, value is the lowercase builder route parameter
}
```

This is **not** a core entity — it's a lightweight convenience file. It does not live inside any project folder (it's cross-project). It follows the same "plain JSON, pretty-printed" convention as `project.json` but has no `.bak` file, no atomic write, and no schema version. If it's lost, nothing breaks.

---

## 9. Build Sequence (Preview)

### Phase 1 — Route configuration

1. Configure Expo Router with two routes: `/` and `/project/:projectId/:builder`
2. Implement the route parameter mapping (lowercase `:builder` ↔ Builder enum)
3. Implement invalid-route handling (§5): redirect to Start Screen or default Builder
4. Write tests: valid routes render correct screens, invalid routes redirect correctly

### Phase 2 — Transition logic

1. Implement Start Screen → Builder transition for new projects (§3.1)
2. Implement Start Screen → Builder transition for existing projects (§3.2)
3. Implement Builder → Builder switching (§3.3) with state preservation
4. Implement Builder → Start Screen (§3.4) with flush-on-close
5. Write tests: project creation navigates to correct Builder, Builder switching preserves in-memory state

### Phase 3 — Preferences

1. Implement `~/StoryEngine/preferences.json` read/write for `lastBuilder`
2. Wire it into open-project and close-project flows
3. Write tests: last-used Builder persists across close/reopen, corrupt preferences fall back gracefully

---

## 10. Out of Scope

- **Screen layout and visual design** — how the Start Screen and Builder look. See `Spec_StartScreen_Design.md` and `Spec_Builder_Design.md`.
- **Animation and transition effects** — how screen changes feel. Defined in Design Specs.
- **External deep-linking** — URLs shared with external tools or opened from outside the app. Not in v1.
- **Browser history manipulation** — beyond what Expo Router provides by default.
- **Multi-tab coordination** — known limitation in v1 (§6).
- **Route-level authentication or access control** — no user accounts in v1 (PRD §11).
- **Route-based code splitting or lazy loading** — optimization for later; v1 loads everything.
- **Mobile navigation patterns** — web-first only (HARD_RULES).

---

## 11. Open Questions

None — all questions resolved.

Structure Map §9 Open Question #3 asked whether this spec was lightweight enough to fold into `Spec_DataModel.md`. Decision: **keep it separate.** The Navigation spec owns routing, transition sequences, state preservation, and the preferences file — these are distinct concerns from the data model. A short spec is fine; folding it in would muddy the Data Model's focus.

---

## 12. Files Affected (Summary)

| File Path | Change |
|-----------|--------|
| `app/_layout.tsx` | Expo Router root layout |
| `app/index.tsx` | Start Screen route (`/`) |
| `app/project/[projectId]/[builder].tsx` | Builder route (`/project/:projectId/:builder`) |
| `src/navigation/routes.ts` | Route constants, parameter mapping (lowercase ↔ enum) |
| `src/navigation/transitions.ts` | Transition sequence helpers (create→navigate, open→navigate, close→flush→navigate) |
| `src/navigation/preferences.ts` | `lastBuilder` read/write to `preferences.json` |
| `src/navigation/__tests__/` | Unit tests for routes, transitions, preferences |

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: [repo path] | Branch: main

Spec file: docs/foundation/Spec_Navigation.md
→ Read this spec for all routes, transitions, and state preservation rules.

Also read before starting:
- docs/foundation/Spec_DataModel.md (Builder enum, Project entity)
- docs/foundation/Spec_DataPersistence.md (createProject, openProject, flush-on-close)
- docs/HARD_RULES.md (non-negotiable constraints)

Follow the Build Sequence in §9, phase by phase.

Key constraints:
- Only two routes: `/` (Start Screen) and `/project/:projectId/:builder` (Builder) (§2)
- Builder parameter is lowercase in URLs, maps to SCREAMING_SNAKE_CASE enum (§2)
- All invalid routes silently redirect — no error pages, no 404 screens (§5)
- Builder switching preserves in-memory ProjectFile — no reload (§3.3)
- Flush pending saves before navigating away from a project (§3.4)
- preferences.json is optional/non-critical — graceful fallback if missing (§6)

Start with: Phase 1 — configure Expo Router with the two routes in
app/index.tsx and app/project/[projectId]/[builder].tsx, with invalid-route
redirect handling.

Work phase by phase. After completing each phase, stop and check in before moving on.
Commit after each phase with a message like "feat(navigation): Phase 1 — route configuration".
```

---

*This spec is lightweight by design. Navigation in Story Engine is simple: two routes, four transitions, and a convenience preferences file. If future versions add screens (export preview, settings, etc.), new routes are added here.*
