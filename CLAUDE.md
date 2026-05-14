# Story Engine

A web-based creative tool for building the foundational logic of fictional universes through natural language chat, built with React Native / Expo / TypeScript.

## Quick Reference

| Info | Value |
|------|-------|
| Stack | React Native / Expo / TypeScript |
| AI Text Engine | Anthropic API (Claude) |
| Image Generation | OpenAI API (DALL-E) |
| MCP Server | Node.js (local) |
| Repo | storyengine |

## Documentation Map

Read only what you need for the current task:

| Doc | Location | Read when... |
|-----|----------|--------------|
| Build Status | `docs/status/BUILD_STATUS.md` | Starting a session — check what's in progress |
| Changelog | `docs/status/CHANGELOG.md` | You need to log changes at end of session |
| Design System | `docs/design/DESIGN.md` | Touching any UI — colors, type, spacing, components |
| Hard Rules | `docs/HARD_RULES.md` | Any task — non-negotiable constraints |
| Overview | `docs/OVERVIEW.md` | First time working on this project — context and orientation |
| PRD | `docs/Spec_Story_Engine_PRD.md` | Understanding the full product vision |
| Templates | `docs/Templates_SpecDocs.md` | Writing a new spec document |
| Structure Map | `docs/Structure_Map.md` | Understanding feature organization and spec inventory |
| Foundation Specs | `docs/foundation/` | Building data model, persistence, or navigation |

## Conventions

- **Product name:** "Story Engine" (two words, title case) in UI and docs
- **Concept Types:** Always Title Case with spaces (e.g., "Time Period", "Fashion Style")
- **Creative dimensions:** Title Case (e.g., "Character", "World", "Conflict")
- **Pipeline phases:** Title Case (e.g., "Discovery", "Development", "Refinement")
- **Spec files (Tech):** `Spec_[SystemName].md`
- **Spec files (Design):** `Spec_[SurfaceArea]_Design.md`
- **Feature folders:** `lowercase-kebab-case`
- **Code values:** camelCase for object keys, SCREAMING_SNAKE_CASE for constants
- **Commits:** Use conventional commits: `feat(scope):`, `fix(scope):`, `docs(scope):`
- **End of session:** Always update `BUILD_STATUS.md` and append to `CHANGELOG.md`

## What NOT to Do

- Do not modify files outside the scope of the current task
- Do not install new dependencies without confirming first
- Do not restructure existing folders or rename files without asking
- Do not skip updating status docs at end of session
- Do not build features out of scope for v1 (see `docs/HARD_RULES.md` § Out of Scope)
