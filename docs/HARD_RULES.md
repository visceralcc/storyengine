# Story Engine — Hard Rules

Non-negotiable constraints that apply across all specs and all implementation. Claude Code must follow these without exception. Updated only by explicit decision — never inferred or relaxed.

---

## Platform & Stack

- **Framework:** React Native / TypeScript / Expo (web target)
- **AI text/concept engine:** Anthropic API (Claude)
- **Image generation:** OpenAI API (DALL-E)
- **MCP Server:** Node.js
- **Online required:** All AI features (chat, concept extraction, Insights, image generation) require active internet connection

---

## Visual Language

| Rule | Constraint |
|------|-----------|
| Color palette | White (#FFFFFF), Light Gray (#F5F5F5, #E8E8E8), Dark text (#1A1A1A) |
| Corner radius | Minimum 4px, maximum 12px — no sharp corners, no circles |
| Heading font | Barlow (Google Fonts) |
| Body font | Noto Serif (Google Fonts) |
| Minimum type size | 12pt — nothing smaller, ever |
| Maximum type size | 36pt — nothing larger, ever |
| Overall feel | Clean, editorial, sketchbook-like — not a spreadsheet, not a dashboard tool |

---

## Creative Pipeline

- **Four phases, not three Builders.** The creative pipeline is Discovery → Development → Refinement → Production Handoff. There are no separate "Builder" screens.
- **Phases are not gates.** Users can move backward and forward freely between phases. The tool adapts its behavior to the current phase, but never locks the user out of a previous phase.
- **Dimensions, not destinations.** Character, World, and Conflict are creative dimensions within a unified workspace — not separate screens to navigate between. The AI tracks which dimension is active.
- **Phase-appropriate structure.** No Concept Type cards during Discovery (too early). Cards emerge during Development. Cards are the primary surface during Refinement. Never impose structure before the user is ready.
- **Conflict → Storyline progression.** The third dimension is "Conflict" during Development (tensions driving the story). In Refinement, conflict shapes into "Storyline" (arc, beats, plot, pacing). These are the same material at different levels of structure.

---

## Data Architecture

- **One project = one container.** A project holds all creative material across all phases — Discovery notes, Development concepts, Refinement storyline, export configuration. Never separate projects linked together.
- **Concept Types are first-class.** Default types and user-created types behave identically. No second-class treatment of custom types.
- **Concept versioning is user-initiated.** The system never auto-creates versions. The user explicitly chooses "revise in place" vs. "create new version."
- **Local-first in v1.** All data persists on the user's machine via local server. No cloud dependencies for data storage.
- **Discovery Notes are not Concepts.** Raw notes placed during Discovery are a distinct entity. They don't have Concept Types. They become Concepts only when the user moves to Development and the AI extracts structure.

---

## AI Behavior

- **Chat-first, not form-first.** Users describe ideas in natural language. The system extracts structure — users never fill out forms or pick from dropdowns to create concepts.
- **Show your work.** Every AI-generated concept must be traceable to the user input that produced it. No unexplained concepts.
- **Suggest, don't dictate.** The Insights Panel (Suggestions, Connections, Conflicts) surfaces ideas. It never auto-modifies concepts. The user always decides.
- **Phase-adaptive behavior.** The AI's role changes by phase: brainstorming partner in Discovery, concept extractor in Development, creative editor in Refinement, export assistant in Production Handoff.
- **Concept Types are the shared language.** UI cards, exported .md files, MCP Server responses, and internal data all use Concept Types as the common vocabulary.

---

## Naming Conventions

- **Project folder:** `storyengine` (lowercase, one word)
- **Product name in UI/docs:** "Story Engine" (two words, title case)
- **Concept Types in prose:** Title Case with spaces (e.g., "Time Period", "Fashion Style", "Story Arc")
- **Creative dimensions in prose:** Title Case (e.g., "Character", "World", "Conflict")
- **Pipeline phases in prose:** Title Case (e.g., "Discovery", "Development", "Refinement", "Production Handoff")
- **Spec files (Tech):** `Spec_[SystemName].md` (e.g., `Spec_ChatEngine.md`)
- **Spec files (Design):** `Spec_[SurfaceArea]_Design.md` (e.g., `Spec_Workspace_Design.md`)
- **Screen docs:** `Screen_[Name].md` (e.g., `Screen_StartScreen.md`)
- **Component docs:** `Component_[Name].md` (e.g., `Component_ConceptCard.md`)
- **Logic docs:** `Logic_[Name].md` (e.g., `Logic_ConceptExtraction.md`)
- **Feature folders:** `lowercase-kebab-case` (e.g., `chat-engine/`, `start-screen/`, `discovery/`)
- **Code values:** camelCase for object keys, SCREAMING_SNAKE_CASE for constants

---

## Deprecated Terminology (v0.2 → v0.3)

These terms from v0.2 are no longer used. If they appear in existing specs, they must be updated:

| Deprecated term | Replacement | Reason |
|----------------|-------------|--------|
| Builder | Dimension (for World/Character/Conflict) or Phase (for pipeline stages) | Builders were separate screens; dimensions are lenses within a unified workspace |
| World Builder | World dimension | Not a separate screen |
| Character Builder | Character dimension | Not a separate screen |
| Storyline Builder | Conflict dimension (Development) / Storyline (Refinement) | Reframed as tension-first in Development |
| Builder origin | Dimension | Same concept, new name |
| "Start New World/Character/Storyline" | "Start New Story" | Discovery phase handles creative entry point |

---

## Out of Scope (v1) — Do Not Build

These are explicitly excluded from v1. Do not implement, stub, or scaffold them:

- Video or animation generation
- Audio or voice generation
- Real-time collaboration / multi-user editing
- Offline mode
- Cloud deployment of MCP Server
- Cross-device project syncing
- User accounts or authentication
- Pre-built template projects
- Marketplace or sharing features
- Mobile-native optimization (web-first only)
