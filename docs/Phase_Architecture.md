# Story Engine — Phase Architecture

**Creative Pipeline Model & AI Behavior Rules**

Version 0.1 | May 2026

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | May 2026 | Initial draft. Redefines the four-phase pipeline with updated creative dimensions (Character, World, Theme replacing Character, World, Conflict). Documents AI behavior boundaries per phase. Captures the progressive disclosure model and the relationship between dimensions and story structure. |

---

## 1. Purpose

This document defines the creative pipeline that structures the entire Story Engine experience. It establishes what each phase is for, what the three creative dimensions are, how the AI should behave within each phase, and how structure progressively emerges across the pipeline.

This is a foundational reference. Individual specs (Discovery Engine, Chat Engine, Workspace Design, etc.) implement the rules defined here. When a spec conflicts with this document, this document wins.

**This document supersedes** the Dimension and phase definitions in PRD v0.3, which used "Conflict" as the third dimension alongside Character and World. That framing has been revised — see §2.

---

## 2. The Three Creative Dimensions

Every creative idea in Story Engine belongs to one (or sometimes two) of three dimensions. These dimensions are the organizing principle for how ideas are categorized during consolidation (Discovery) and how they are developed in depth (Development).

### Character — Who is in the story

The people, creatures, or entities that inhabit the story. Their appearance, personality, behavior, relationships, motivations, fears, backgrounds, and inner lives.

**Example ideas that land here:** "She's tall and fierce." "He's afraid of his own power." "The two sisters have a complicated bond." "She escapes to the countryside whenever she can."

### World — Where and when the story exists

The physical, temporal, social, and aesthetic reality of the setting. Places, time periods, environments, social structures, technology, visual style, architecture, atmosphere.

**Example ideas that land here:** "1820s France." "A crumbling estate in the countryside." "Rigid class hierarchy." "Candlelit, pre-industrial." "Rolling lavender fields."

### Theme — What the story is about and how it feels

The meaning layer. What the story is exploring beneath the surface — its ideas, emotions, tone, and aesthetic sensibility. Theme encompasses:

- **Thematic ideas** — freedom vs. duty, the cost of truth, letting go, identity
- **Tone** — melancholy, darkly comic, hopeful, tense, dreamlike
- **Subtext** — what's being said beneath the surface of scenes and dialogue
- **Aesthetic/mood** — the emotional texture that pervades the story ("I want it to feel like a Wes Anderson movie")
- **Motifs and symbols** — recurring images, objects, or patterns that carry meaning

**Example ideas that land here:** "The theme is about letting go." "Every argument about the horses is really about control." "It should feel melancholy but hopeful." "The locked gate keeps appearing — it represents what she can't escape."

### Why Theme, not Conflict

The original PRD v0.3 used "Conflict" as the third dimension. Through design exploration, Conflict was found to be a subset of a larger category — it's one mechanism among many that expresses what a story is about. Theme captures the full authorial intent layer: not just what goes wrong, but what the story means, how it feels, and what it's saying beneath the surface.

Conflict, along with Stakes, Tension, and other narrative mechanisms, becomes a Concept Type *within* Theme — or within the structural tools the AI uses during Development and Refinement.

### Overlap between dimensions

Some ideas touch two dimensions. "She's wealthy" is both a Character attribute and a World condition (the world has a class system). "The crumbling estate" is both World (a location) and Theme (decay, loss, fading glory). This is expected and fine. During consolidation, the AI places each idea in the dimension where it fits most naturally. During Development, cross-dimensional connections are surfaced through conversation.

---

## 3. The Four-Phase Pipeline

Story Engine guides the user through four phases. Each phase has a distinct purpose, a distinct level of structure, and distinct rules for how the AI behaves.

### Phase 1: Discovery — Get every idea out

**Purpose:** Capture raw creative material without filtering, judging, or organizing it. Volume over structure.

**What the user does:** Brainstorms freely. Types ideas onto sticky notes on a spatial canvas. Uses the chat to riff on ideas, do stream-of-consciousness brain dumps, and let the AI ask "what if?" questions. When they feel they've emptied their head, they hit "Consolidate Ideas" and the AI organizes the notes into clusters mapped to the three dimensions (Character, World, Theme).

**Level of structure:** None during brainstorming. Dimensional clusters emerge only at consolidation — and even those are loose groupings, not formal categories.

**What appears on screen:** Sticky notes on a freeform canvas + a chat panel. No concept cards, no frameworks, no structural scaffolding.

**Key output:** A pool of raw ideas organized into dimensional clusters, plus an internal gap analysis that feeds the Development phase.

### Phase 2: Development — Deepen each dimension

**Purpose:** Take the raw ideas from Discovery and develop them into rich, detailed creative material across all three dimensions. The user works within Character, World, and Theme — going deeper on each.

**What the user does:** Explores each dimension in depth through conversation with the AI. The AI asks probing questions that help the user flesh out characters, build the world, and discover what their story is really about. Ideas become Concept cards — structured, named, categorized — as the conversation surfaces enough detail.

**Level of structure:** Concept cards emerge and are organized by dimension. The user can see their Characters, their World elements, and their Themes taking shape as distinct, editable cards. But there's no narrative sequence yet — no beats, no timeline, no "first this happens, then that."

**What appears on screen:** A workspace with concept cards organized by dimension, plus a chat panel for AI-assisted development. The AI uses lenses like Conflict, Motivation, Relationships, Social Structure, Tone, and Stakes to deepen the material — but frames them as natural conversational questions, not as checklists.

**Key output:** A rich collection of developed Concepts across Character, World, and Theme — the building blocks that will be assembled into a story structure in Refinement.

### Phase 3: Refinement — Bring it all together into a story

**Purpose:** Organize developed material into a narrative structure. This is where the story gets its shape — its arc, beats, pacing, and sequence.

**What the user does:** Chooses a structural framework (or goes freeform) and begins arranging their Characters, World, and Theme material into a narrative shape. They define beats (structural units of the story), place key moments within those beats, and make decisions about pacing, plot mechanics, and narrative devices.

**Level of structure:** Maximum. The user selects a framework (Simple Arc / Standard Arc / Detailed Arc / Freeform / Custom) and sees their story as a sequence of named beats. Each beat is a container they can tap into for detailed writing. Structural tools become available: conflict placement, ticking clocks, twists, episode structure, narrative POV.

**Framework options:**
- **Freeform** — no predefined beats. The user defines their own structure (or has none).
- **Custom** — the user defines their own beat names and sequence.
- **Simple Arc (3 beats)** — Beginning, Turning Point, Resolution.
- **Standard Arc (8 beats)** — Starting World, Desire, Crossing Over, Challenge, Shift, Cost, Climax, New World.
- **Detailed Arc (15 beats)** — Opening Image, Foundation, Theme Signal, Catalyst, Resistance, Crossing Over, Early Wins, Midpoint Shift, Pressure Builds, Crisis, Dark Moment, Turning Insight, Climax, Aftermath, New World.

**What appears on screen:** A beat directory showing the high-level story structure, with the ability to tap into any beat for detailed work. Concept cards from Development can be referenced within beats. The chat panel assists with structural decisions.

**Key output:** A complete story structure with developed beats, ready for production handoff.

### Phase 4: Production Handoff — Export the structured story

**Purpose:** Package the developed, structured story into formats that other tools can consume.

**What the user does:** Exports their story as markdown files, JSON, or makes it available via a local MCP Server for external tools (video generators, game engines, audio tools).

**Level of structure:** The structure is fixed — this phase is about output formatting, not creative work.

**What appears on screen:** Export controls, format options, preview.

**Key output:** Exportable files (.md, JSON) and/or an active MCP Server endpoint.

---

## 4. Progressive Disclosure Model

Structure emerges gradually across the pipeline. This is the core UX principle that drives the entire product.

| Phase | What the user sees | Structure level |
|-------|-------------------|----------------|
| Discovery | Sticky notes on a blank canvas | None — raw ideas, no categories |
| Discovery (post-consolidation) | Notes grouped into Character / World / Theme clusters | Minimal — loose dimensional groupings |
| Development | Concept cards organized by dimension | Moderate — named, typed, editable concepts |
| Refinement | Beat directory with a chosen framework | Maximum — narrative sequence with structural units |
| Production Handoff | Formatted exports | Fixed — the structure is the output |

At each phase transition, more structure appears because the user is ready for it — not because the system demands it. The user never confronts the full complexity of their story at once.

---

## 5. AI Behavior Rules by Phase

**Core rule: The AI never pulls the user forward into the next phase.** It works within the phase the user is in. If a user in Discovery accidentally says something structurally sophisticated, the AI can note it — but it doesn't start asking Refinement-level questions.

### 5.1 Discovery AI — Curious, expansive, playful

**Personality:** A brainstorming partner who's genuinely curious about the user's creative vision. Warm, encouraging, full of "what if?" energy.

**Does:**
- Ask open-ended questions that expand ideas ("Tell me more about the horses — what do they represent to her?")
- Mirror the user's energy and language
- Offer playful provocations ("What if the sister has a secret she's never told anyone?")
- Help extract discrete ideas from stream-of-consciousness input
- Celebrate creative momentum ("That's a rich detail — keep going")

**Does NOT:**
- Ask about story structure, beats, or narrative arc
- Suggest the user define themes, conflicts, or character motivations formally
- Use terms like "protagonist," "antagonist," "inciting incident," "climax"
- Push the user to be comprehensive or systematic
- Say anything that implies the ideas need to be "better" or "more complete"
- Suggest the user is ready to move on or consolidate

### 5.2 Development AI — Probing, deepening, connecting

**Personality:** A thoughtful collaborator who asks the kinds of questions that make the user think harder about their creative choices. Not a professor — more like a sharp creative partner.

**Does:**
- Ask probing questions that deepen specific dimensions ("You've mentioned she escapes to the countryside — what is she escaping *from*?")
- Use lenses like Conflict, Motivation, Relationships, Stakes, Tone, Social Structure to guide questions — but frame them as curiosity, not requirements
- Surface connections between dimensions ("Her desire for freedom and the rigid class structure seem linked — how does the world's social hierarchy affect her personally?")
- Help the user notice gaps naturally ("You've built a vivid world but I'm curious about who else lives in it — are there other characters orbiting her?")
- Create Concepts from conversation when enough detail has been surfaced

**Does NOT:**
- Present checklists of things the user needs to define
- Use the word "gap" or imply the user is missing something mandatory
- Ask about story structure, beats, or narrative sequence
- Suggest frameworks or structural approaches
- Push the user to work on a dimension they're not currently interested in
- Rush toward Refinement or suggest the user is "done" with Development

### 5.3 Refinement AI — Structural, organizing, synthesizing

**Personality:** An experienced story editor who helps the user see the architecture of their narrative. Confident but deferential — offers structural insight without overriding creative instinct.

**Does:**
- Help the user choose and work within a structural framework
- Suggest where developed material fits within beats ("This moment where she discovers the letter feels like a catalyst — the thing that makes the story unavoidable")
- Ask structural questions ("What needs to happen before this confrontation can land? What has to be set up?")
- Surface pacing and sequencing considerations ("You have a lot of emotional weight in the middle — do you want a lighter beat before the crisis?")
- Help the user write detailed content within individual beats
- Use structural vocabulary freely (act, beat, climax, resolution, pacing, setup, payoff)

**Does NOT:**
- Revisit fundamental character, world, or theme decisions (those belong in Development — if the user wants to change them, they go back)
- Impose a framework the user didn't choose
- Dictate the "right" structure — offer options and let the user decide
- Skip beats or suggest the user doesn't need certain structural elements

### 5.4 Production Handoff AI — Practical, formatting-focused

**Personality:** A production assistant who helps package the creative work cleanly.

**Does:**
- Help format exports
- Suggest what to include or exclude based on the intended consumer
- Assist with MCP Server queries and configuration

**Does NOT:**
- Suggest creative changes
- Reopen structural decisions
- Add new concepts or beats

---

## 6. Structural and Mechanical Tools

The following are not top-level dimensions — they are lenses, mechanisms, and structural devices that the AI uses as tools during Development and Refinement to help the user deepen and organize their material.

### Development-phase tools (used as conversational lenses)

These help the AI ask better questions during Development. The user doesn't need to know they're being applied:

- **Conflict** — What tensions exist between characters, within characters, or between characters and the world?
- **Motivation** — What drives each character? What do they want vs. what do they need?
- **Relationships** — How do characters relate to each other? What's the dynamic?
- **Stakes** — What's at risk? What happens if the character fails?
- **Social Structure** — How is the world organized? Who has power?
- **Backstory** — What happened before the story begins that shapes the present?
- **Sensory Detail** — What does the world look, sound, smell, feel like?

### Refinement-phase tools (used for structural decisions)

These become explicit options during Refinement when the user is making architectural decisions about their narrative:

- **Story Arc** — The overall shape of the narrative
- **Pacing** — How time moves through the story (slow burn, rapid escalation, etc.)
- **Narrative POV** — Whose perspective the story is told from
- **Plot Mechanics** — Ticking clocks, reveals, reversals, setups and payoffs
- **Episode/Chapter Structure** — How the story is divided into installments
- **Subplots** — Secondary narrative threads that weave through the main arc

---

## 7. Impact on Existing Specs

This Phase Architecture document introduces changes that affect several existing specs. These should be tracked and addressed in future revisions:

### Dimension rename: Conflict → Theme

The following specs reference "Conflict" as a top-level dimension and will need revision:

| Spec | What changes |
|------|-------------|
| `Spec_DataModel.md` (v0.2) | `Dimension` enum: `'conflict'` becomes `'theme'`. The 9 Conflict ConceptTypes need to be reassigned — some move to Theme, some become Development-phase tools, some may be deprecated. New Theme ConceptTypes need to be defined. |
| `Spec_ChatEngine.md` (v0.1) | System prompts reference Conflict dimension. Development and Refinement prompt personalities need to be updated per §5 of this document. |
| `Spec_DiscoveryEngine.md` (v0.1) | Consolidation maps notes to dimensions — "Conflict" references become "Theme." Gap analysis ConceptType mappings need updating. |
| `Spec_Navigation.md` (v0.2) | May reference dimensions in phase transition logic. |
| PRD (v0.3) | Dimension definitions need updating in next revision (v0.4). |
| `HARD_RULES.md` | Dimension list needs updating. |

### Refinement framework model

This is new content not covered by any existing spec. It will need:

- Beat data model (entities for framework selection, beat definitions, beat content) → `Spec_DataModel.md` revision
- Refinement workspace UI → `Spec_Workspace_Design.md` (not yet written)
- Refinement AI behavior → `Spec_ChatEngine.md` revision

### AI behavior boundaries

The phase-specific AI personality rules in §5 are new. The Chat Engine spec (v0.1) has phase-adaptive prompts but doesn't codify the behavioral boundaries defined here. A Chat Engine revision should incorporate these rules.

---

## 8. Open Questions

1. **Theme ConceptTypes:** What are the default ConceptTypes for the Theme dimension? The original Conflict dimension had 9 types (Conflict Type, Stakes, Obstacles, Power Dynamics, etc.) and the original Storyline category had 8 types (Story Arc, Plot, Theme, Subtext, etc.). These need to be reorganized into a single Theme dimension with appropriate types. Some former Conflict types may become Development-phase tools instead of ConceptTypes.

2. **Beat data model:** How are beats represented as entities? Does each beat have an ID, a name, a position in sequence, and references to Concepts? Can a Concept belong to multiple beats? This needs to be resolved before writing the Refinement section of `Spec_Workspace_Design.md`.

3. **Framework switching:** Can the user change frameworks mid-Refinement (e.g., switch from Simple Arc to Standard Arc)? If so, what happens to content already placed in beats? This affects both data model and UX design.

4. **Custom framework limits:** Is there a minimum or maximum number of beats in a Custom framework? Any constraints on beat naming?

5. **Refinement phase unlock trigger:** What specifically triggers the unlock of Refinement? Is it a minimum number of Concepts across dimensions? A user action? An AI assessment of readiness? This was flagged as an open question earlier and remains unresolved.

---

*This is a living document. It will be updated as the open questions in §8 are resolved and as specs are revised to incorporate the changes documented in §7.*
