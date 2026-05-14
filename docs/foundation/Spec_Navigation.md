# Story Engine — Navigation Specification

**Systems Design & Data Architecture**

Version 0.2 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial draft. Two routes, four transitions, Builder switching, preferences file. |
| **0.2** | **May 2026** | **Revised for PRD v0.3 pipeline model. Two routes become three (Start Screen, Discovery, Workspace). Builder switching replaced by phase transitions and dimension tracking within unified workspace. Preferences file updated for phase + dimension tracking.** |

---

## 1. Overview

Navigation defines how the user moves between screens in Story Engine — what routes exist, what data each route requires, and what happens to in-memory state during transitions.

**Design principle: Navigation is invisible until it's broken.** The user should never think about navigation. Moving from Discovery to Development should feel like the creative work naturally deepening, not like launching a new application. Switching from World thinking to Character thinking should feel like turning a page in a sketchbook, not changing screens. Routes exist to support the illusion of a single continuous creative workspace.

**Consumer:** The web app shell (Expo Router) reads this spec to configure routes. The Start Screen uses it to know where to navigate on project creation/open. The Discovery canvas uses it for the consolidation → Development transition. The workspace uses it for phase-adaptive behavior. The Insights Panel uses it to navigate to a specific Concept when the user acts on an insight.

**Scope boundary — this system does NOT:**
- Define how screens look or feel (see Design Specs)
- Define animation or transition effects (see Design Specs)
- Handle external deep-linking or URL sharing (not in v1)
- Manage multi-tab coordination (known limitation in v1)

---

## 2. Route Table

Story Engine has three routes:

| Route | URL Pattern | Screen | Parameters |
|-------|-------------|--------|------------|
| Start Screen | `/` | Start Screen | None |
| Discovery | `/project/:projectId/discovery` | Discovery Canvas | `projectId` — the project's ID |
| Workspace | `/project/:projectId/workspace` | Unified Workspace | `projectId` — the project's ID |

### Parameter mapping

- `:projectId` is the project's `id` field (e.g., `proj_V1StGjHk7`)

### What happened to the Builder route

In v0.1, the route was `/project/:projectId/:builder` where `:builder` was `world`, `character`, or `storyline`. This is gone. The three Builders are replaced by a single unified Workspace where dimensions are tracked in-memory, not in the URL. The active dimension (World, Character, Conflict) is part of the workspace's internal state, not a route parameter.

**Why not a `:phase` parameter?** The route distinguishes Discovery (a distinct canvas UI) from Workspace (the card-based workspace), but Development vs. Refinement is not a route change — it's a phase-state change within the workspace. The workspace adapts its behavior based on the project's `currentPhase`, but the URL stays the same.

**Why not `/project/:projectId/:phase`?** Production Handoff is the fourth phase, but it may live within the workspace UI as a panel or mode rather than a separate screen. Keeping the route as `/workspace` is future-compatible — if Production Handoff gets its own screen later, a new route can be added.

---

## 3. Transitions

### 3.1 Create New Project (Start Screen → Discovery)

Triggered by: "Start New Story" button on the Start Screen.

1. Call `createProject` (per `Spec_DataPersistence.md` §6) — generates project with `currentPhase: DISCOVERY`
2. Navigate to `/project/:projectId/discovery`
3. The Discovery canvas loads with an empty canvas (no notes yet)

### 3.2 Open Existing Project (Start Screen → Discovery or Workspace)

Triggered by: selecting a project from the project list on the Start Screen.

1. Call `openProject` (per `Spec_DataPersistence.md` §6) — loads the ProjectFile
2. Read the project's `currentPhase`:
   - If `DISCOVERY` → navigate to `/project/:projectId/discovery`
   - If `DEVELOPMENT`, `REFINEMENT`, or `PRODUCTION` → navigate to `/project/:projectId/workspace`
3. Optionally read `preferences.json` for `lastDimension` to restore the last active dimension in the workspace

### 3.3 Discovery → Workspace (Completing Discovery)

Triggered by: user completing the consolidation review in Discovery.

1. Update the project's `currentPhase` to `DEVELOPMENT`
2. Update `phaseState.discovery.status` to `CONSOLIDATED`
3. Trigger a `flush` save
4. Navigate to `/project/:projectId/workspace`
5. The workspace loads in Development mode, seeded with creative gravity context from Discovery

### 3.4 Workspace: Phase Transitions (Development ↔ Refinement ↔ Production)

Triggered by: user advancing or regressing phases within the workspace.

Phase transitions within the workspace do **not** change the URL. They update the project's `currentPhase` and trigger a `flush` save. The workspace re-renders with phase-appropriate behavior:

- **Development → Refinement:** Storyline ConceptTypes become available. AI behavior shifts to editor mode. Insights Panel activates fully.
- **Refinement → Development:** Storyline concepts persist. AI behavior reverts to exploration mode. User can add more concepts.
- **Refinement → Production:** Export/MCP options become available. (If Production Handoff becomes a separate screen in the future, this transition would become a route change.)

### 3.5 Workspace → Discovery (Phase Regression)

Triggered by: user returning to Discovery from the workspace.

1. Trigger a `flush` save (save all current workspace state)
2. Update the project's `currentPhase` to `DISCOVERY`
3. Update `phaseState.discovery.status` to `IN_PROGRESS` (allows adding new notes)
4. Navigate to `/project/:projectId/discovery`
5. The Discovery canvas loads with all existing notes visible

### 3.6 Dimension Switching (Within Workspace)

Triggered by: user shifting creative focus between World, Character, and Conflict within the workspace.

Dimension switching is **not navigation.** No route change, no URL change, no screen change. It's an in-memory state update within the workspace:

1. Update `phaseState.development.lastActiveDimension` to the new dimension
2. The workspace may filter or highlight cards by dimension
3. The chat engine may adjust its extraction behavior for the active dimension
4. Trigger a `debounce` save (not flush — dimension switching is frequent)

### 3.7 Close Project (Discovery or Workspace → Start Screen)

Triggered by: user navigating back to the Start Screen from any project screen.

1. Trigger a `flush` save (cancel any pending debounce, write immediately)
2. Update `preferences.json` with the project's last phase and last active dimension
3. Release the in-memory ProjectFile
4. Navigate to `/`

---

## 4. Deep Navigation from Insights

When the user acts on an insight in the Insights Panel (clicks "Go to concept"), the navigation needs to scroll to and highlight a specific Concept card in the workspace.

**This is NOT a route change.** The Insights Panel is part of the workspace. Acting on an insight:

1. Identifies the target Concept (from `insight.referencedConceptIds`)
2. Determines the target Concept's dimension
3. If the workspace is currently filtered to a different dimension, switches the view to include the target dimension
4. Scrolls the card dashboard to the target Concept card
5. Highlights the card (visual pulse or outline — defined in Design Spec)

---

## 5. Invalid Route Handling

| Invalid State | Recovery |
|---------------|----------|
| `/project/:projectId/discovery` with non-existent `projectId` | Redirect to `/` (Start Screen) |
| `/project/:projectId/workspace` with non-existent `projectId` | Redirect to `/` (Start Screen) |
| `/project/:projectId` (missing screen segment) | Redirect based on `currentPhase`: Discovery → `/discovery`, else → `/workspace` |
| Any unrecognized path | Redirect to `/` (Start Screen) |
| `/project/:projectId/:builder` (v0.1 URL format) | Redirect to `/project/:projectId/workspace` |

**No error pages.** Invalid routes silently redirect. There is no 404 screen, no "project not found" page. If a project doesn't exist, the user lands back on the Start Screen. Clean and simple.

---

## 6. State Preservation

### What's preserved during navigation

| Transition | State Preserved |
|------------|----------------|
| Discovery → Workspace | In-memory ProjectFile stays loaded. No reload needed. |
| Workspace → Discovery | In-memory ProjectFile stays loaded. Workspace state (card positions, scroll position) preserved. |
| Dimension switching | Everything — it's not a navigation event, just an in-memory filter change. |
| Phase transition (Dev ↔ Ref) | Everything — same route, same in-memory state. |
| Any screen → Start Screen | ProjectFile is flushed and released. Returning to the project reloads from disk. |

### Browser back/forward buttons

Expo Router handles browser history by default. Pressing back from the workspace goes to the Start Screen (or the previous route in history). No custom back-button handling needed in v1.

### Multiple browser tabs

Not supported in v1. If the user opens the same project in two tabs, each tab loads its own copy. Saves from one tab overwrite the other. Known limitation.

---

## 7. Relationship to Other Systems

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| `Spec_DataModel.md` | Uses Phase enum and Dimension enum for state tracking, Project entity for routing | §2, §3 |
| `Spec_DataPersistence.md` | Calls `createProject`, `openProject`, `listProjects` during transitions; triggers `flush` on close and phase changes | §3.1–§3.7 |
| `Spec_StartScreen_Design.md` | Start Screen layout triggers transitions §3.1 and §3.2 | §3 |
| `Spec_Discovery_Design.md` | Discovery canvas triggers transition §3.3 (consolidation complete) and §3.7 (close) | §3 |
| `Spec_Workspace_Design.md` | Workspace contains phase nav (§3.4), dimension switching (§3.6), and back control (§3.7) | §3 |
| `Spec_InsightsEngine.md` | Insight "act on" action triggers deep navigation within the workspace | §4 |

**No direct interaction:**
- `Spec_ChatEngine.md` — the chat engine writes data but doesn't trigger navigation.
- `Spec_ImageGeneration.md` — image operations don't change routes.
- `Spec_Export.md` — export is an action within the workspace, not a navigation event.
- `Spec_MCPServer.md` — the MCP Server doesn't trigger in-app navigation in v1.

---

## 8. Data Model (Preview)

This spec extends the AppPreferences structure (not a core entity — convenience data only):

```typescript
// Stored in ~/StoryEngine/preferences.json — optional, non-critical
interface AppPreferences {
  lastPhase: Record<string, Phase>;           // key: projectId, value: last active phase
  lastDimension: Record<string, Dimension>;   // key: projectId, value: last active dimension
}
```

This replaces the v0.1 `lastBuilder` field. It does not live inside any project folder (it's cross-project). If lost, nothing breaks — all lookups fall back to defaults.

---

## 9. Build Sequence (Preview)

### Phase 1 — Route configuration

1. Configure Expo Router with three routes: `/`, `/project/:projectId/discovery`, `/project/:projectId/workspace`
2. Implement invalid-route handling (§5): redirect to Start Screen or correct screen based on `currentPhase`
3. Implement legacy URL redirect (`/project/:projectId/:builder` → workspace)
4. Write tests: valid routes render correct screens, invalid routes redirect correctly, legacy URLs redirect

### Phase 2 — Transition logic

1. Implement Start Screen → Discovery transition for new projects (§3.1)
2. Implement Start Screen → Discovery or Workspace transition for existing projects (§3.2)
3. Implement Discovery → Workspace transition (§3.3) with phase state updates
4. Implement Workspace → Discovery regression (§3.5) with state preservation
5. Implement close-project transition (§3.7) with flush-on-close
6. Write tests: project creation navigates to Discovery, phase-based routing works, flush triggers on close

### Phase 3 — In-workspace state management

1. Implement phase transitions within the workspace (§3.4) — Development ↔ Refinement ↔ Production
2. Implement dimension switching (§3.6) — in-memory state update, no route change
3. Implement deep navigation from Insights (§4) — scroll-to-card behavior
4. Write tests: phase transitions update `currentPhase`, dimension switching updates `lastActiveDimension`, insight navigation finds the target card

### Phase 4 — Preferences

1. Implement `~/StoryEngine/preferences.json` read/write for `lastPhase` and `lastDimension`
2. Wire into open-project and close-project flows
3. Write tests: last phase/dimension persists across close/reopen, corrupt preferences fall back gracefully

---

## 10. Out of Scope

- **Screen layout and visual design** — how screens look. See Design Specs.
- **Animation and transition effects** — how screen changes feel. Defined in Design Specs.
- **External deep-linking** — URLs shared with external tools or opened from outside the app. Not in v1.
- **Browser history manipulation** — beyond what Expo Router provides by default.
- **Multi-tab coordination** — known limitation in v1 (§6).
- **Route-level authentication or access control** — no user accounts in v1 (PRD §11).
- **Route-based code splitting or lazy loading** — optimization for later.
- **Mobile navigation patterns** — web-first only (HARD_RULES).

---

## 11. Open Questions

None — all questions resolved.

The v0.1 question about whether this spec should fold into `Spec_DataModel.md` remains resolved: **keep it separate.** Navigation owns routing, phase transitions, dimension tracking, and preferences — distinct concerns from the data model.

---

## 12. Files Affected (Summary)

| File Path | Change |
|-----------|--------|
| `app/_layout.tsx` | Expo Router root layout |
| `app/index.tsx` | Start Screen route (`/`) |
| `app/project/[projectId]/discovery.tsx` | Discovery route |
| `app/project/[projectId]/workspace.tsx` | Workspace route |
| `src/navigation/routes.ts` | Route constants, parameter mapping |
| `src/navigation/transitions.ts` | Transition sequence helpers (create, open, close, phase change, dimension switch) |
| `src/navigation/preferences.ts` | `lastPhase` and `lastDimension` read/write |
| `src/navigation/__tests__/` | Unit tests for routes, transitions, preferences |

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: [repo path] | Branch: main

Spec file: docs/foundation/Spec_Navigation.md
→ Read this spec (v0.2) for all routes, transitions, and state preservation rules.

Also read before starting:
- docs/foundation/Spec_DataModel.md (v0.2 — Phase enum, Dimension enum, Project entity)
- docs/foundation/Spec_DataPersistence.md (v0.2 — createProject, openProject, flush-on-close)
- docs/HARD_RULES.md (non-negotiable constraints)

Follow the Build Sequence in §9, phase by phase.

Key constraints:
- Three routes: `/`, `/project/:projectId/discovery`, `/project/:projectId/workspace` (§2)
- Dimension switching is NOT a route change — it's in-memory state within the workspace (§3.6)
- Phase transitions within the workspace are NOT route changes — they update currentPhase (§3.4)
- All invalid routes silently redirect — no error pages, no 404 screens (§5)
- Flush pending saves before navigating away from a project (§3.7)
- preferences.json is optional/non-critical — graceful fallback if missing (§8)

Start with: Phase 1 — configure Expo Router with the three routes in
app/index.tsx, app/project/[projectId]/discovery.tsx, and
app/project/[projectId]/workspace.tsx, with invalid-route redirect handling.

Work phase by phase. After completing each phase, stop and check in before moving on.
Commit after each phase with a message like "feat(navigation): Phase 1 — route configuration".
```

---

*This spec is lightweight by design. Navigation in Story Engine is simple: three routes, phase transitions within the workspace, and dimension switching as in-memory state. If future versions add screens (Production Handoff as a separate screen, settings, etc.), new routes are added here.*
