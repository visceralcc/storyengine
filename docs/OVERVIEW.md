# Story Engine — Project Overview

A quick-reference guide to what Story Engine is, how it's structured, and where to find things. Read this first if you're new to the project.

---

## What Is Story Engine?

Story Engine is a web-based creative tool for building the foundational logic of fictional universes. Users describe their creative vision through natural language chat, and the system progressively structures their ideas — from raw creative sparks into organized, visual, exportable concepts.

It covers three creative dimensions:
- **World** — places, time periods, environments, visual styles, technology
- **Character** — appearance, personality, behavior, relationships, motivations
- **Conflict** — tensions, stakes, themes, subtext, catalysts

These dimensions are not separate screens. They are lenses on the same creative material within a unified workspace. The AI tracks which dimension is active and connects ideas across all three.

The output is not a finished product (no video, no game, no animation). The output is structured data and documentation that other tools consume — via exported .md files, JSON, or a local MCP Server.

---

## Core Abstraction: Concept Types

Everything in Story Engine revolves around **Concept Types**. A Concept Type is a labeled category (like "Time Period" or "Fashion Style" or "Central Conflict") that represents one dimension of a World, Character, or Conflict.

When a user types something like *"She lives in 1820s France and loves painting,"* the system extracts concepts: Time Period → 1820s, Location → France, Activity → Painting. Each concept becomes a card in the workspace.

Each creative dimension (World, Character, Conflict) has default Concept Types, but users and the AI can create new ones at any time.

Concept Types are phase-appropriate — they don't appear during Discovery (too early). They emerge during Development as ideas crystallize. They become the primary working surface during Refinement.

---

## The Creative Pipeline

Story Engine guides users through four phases of creative work:

1. **Discovery** — Freeform ideation. Post-it-style notes on a canvas. Volume over structure. The AI listens and discovers the user's creative gravity (character-first, world-first, or conflict-first). Closes with AI consolidation that groups notes into themes.

2. **Development** — Structured exploration. The user talks naturally about their story in a chat panel. The AI extracts Concept Types and creates cards on the workspace. Character, World, and Conflict dimensions emerge and connect. This is where the creative material takes shape.

3. **Refinement** — Narrative shaping. Conflict gets shaped into Storyline (arc, beats, plot, pacing). The AI shifts into editor mode — challenging weak connections, identifying gaps, suggesting improvements. Concept cards are the primary working surface. The Insights Panel runs at full capacity.

4. **Production Handoff** — Export and delivery. The structured output gets packaged as .md files, JSON, or made available via a local MCP Server for external tools to consume.

Phases are not gates — users move forward and backward freely. The tool adapts its behavior to the current phase.

---

## Key Screens

1. **Start Screen** — Two options: "Start New Story" or "Open Existing Project"
2. **Discovery Canvas** — Freeform note placement + consolidation review
3. **Workspace** — Unified surface for Development and Refinement: chat panel + card dashboard + dimension tracking
4. **Insights Panel** — AI-generated Suggestions, Connections, and Conflicts across dimensions
5. **Production Handoff** — Export configuration and readiness review

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App framework | React Native / TypeScript / Expo (web) |
| AI text engine | Anthropic API (Claude) |
| Image generation | OpenAI API (DALL-E) |
| Data storage | Local server (v1) |
| Export formats | .md files, JSON |
| External access | Local MCP Server (Node.js) |

---

## Document Map

This project follows the **Ideas-to-Code** process. Documents are organized by level:

**Level 1 (one document, the big picture):**
- `Spec_Story_Engine_PRD.md` — the full product requirements document (v0.3)

**Companion documents (process and rules):**
- `BUILD_STATUS.md` — what's done, what's in progress, what's next
- `HARD_RULES.md` — non-negotiable constraints
- `OVERVIEW.md` — this file
- `Templates_SpecDocs.md` — templates for Tech Specs, Design Specs, and Buildable Units
- `Structure_Map.md` — feature organization, spec inventory, and writing order

**Level 2 (one per feature/system):**
- Tech Specs for systems and engines (9 total)
- Design Specs for screens and flows (4 total)
- Three foundation specs exist from Phase A and need revision for the v0.3 pipeline model

**Level 3 (many per feature — not yet written):**
- Screen docs, Component docs, Logic docs — each scoped tightly enough for Claude Code to build

---

## Feature Folders

| Folder | What it covers |
|--------|---------------|
| `foundation/` | Data model, persistence, navigation, phase management |
| `start-screen/` | Entry point screen |
| `discovery/` | Freeform ideation canvas, consolidation, creative gravity |
| `chat-engine/` | AI pipeline, concept extraction, phase-adaptive behavior |
| `workspace/` | Unified workspace for Development + Refinement |
| `insights/` | Cross-dimension analysis engine + Insights Panel UI |
| `images/` | DALL-E integration + user image uploads |
| `export/` | .md/JSON export + local MCP Server |

---

## Current Status

**Phase:** Implementing. See `BUILD_STATUS.md` for detailed progress.

**Completed:** PRD v0.3, companion documents, templates, structure map v0.2, foundation specs (DataModel, DataPersistence, Navigation), Discovery specs (Engine + Design), and entry-flow design specs (Splash, Project Chooser, Step Menu). Code-side: project scaffolded (Expo SDK 52 + TypeScript + Jest), DataModel/DataPersistence/Discovery Engine Phase 1 implementations passing 51 tests, full entry-flow UI shipped, Discovery Screen UI shell complete end-to-end (Phases 1–6) with the consolidation engine still stubbed.

**Next:** Wire the Discovery UI to real persistence and AI — write `Spec_ChatEngine.md`, implement Discovery Engine Phases 2–5 (consolidation, gap analysis, re-consolidation), and DataPersistence Phase 2 (project lifecycle / save-to-disk).
