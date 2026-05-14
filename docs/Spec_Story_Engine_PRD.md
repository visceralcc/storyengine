# Story Engine — Product Requirements Document

**Creative Pipeline for Visual Storytelling**

Version 0.3 | May 2026 | PRD

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Apr 2026 | Initial draft. Full vision, feature inventory, data model overview. |
| 0.2 | Apr 2026 | All open questions resolved. Unified project model, DALL-E for images, local-first architecture, Insights Panel, concept versioning. |
| **0.3** | **May 2026** | **Major rewrite. Three separate Builders replaced by four-phase creative pipeline (Discovery → Development → Refinement → Production Handoff). Unified workspace replaces Builder switching. "Storyline" reframed as "Conflict" dimension in Development. Start Screen simplified to two options. Concept cards are now phase-appropriate — absent in Discovery, emerging in Development, primary surface in Refinement.** |

---

## 1. What Story Engine Is

Story Engine is a web-based creative tool that helps writers, game designers, filmmakers, and content creators build the foundational logic of fictional (or non-fictional) universes — their worlds, characters, and storylines — in a structured, exportable format.

**Design Principle: Structure through conversation, revealed progressively.** The user talks about their creative vision in natural language. Story Engine listens, discovers what the user cares about most, and gradually structures their thinking — from raw creative sparks into organized, exportable concepts. The user never fills out forms. They never declare "I'm building a world" or "I'm building a character" upfront. They talk, and the system discovers the creative gravity — what's pulling them — and structures accordingly.

**What Story Engine is NOT:** It is not a final production tool. It doesn't render video, animate characters, or compile game code. Its purpose is to produce the *underlying logic* — structured data, concept definitions, and visual references — that other tools consume. Think of it as the writer's room and concept art studio, not the soundstage.

---

## 2. Who It's For

**Primary users:**
- Independent filmmakers and screenwriters building story bibles
- Game designers defining world lore, character rosters, and narrative arcs
- YouTube/TikTok/internet video creators developing recurring characters and worlds
- Creative directors at studios building pitch materials and concept packages

**Common thread:** These users have strong creative vision but need help *structuring* that vision into something tangible, shareable, and machine-readable. They are not necessarily developers — they think in images, vibes, and narrative, not in data models.

---

## 3. Why It Matters

Creative projects fail when the world-building lives only in someone's head. Story Engine externalizes it — making creative vision:

- **Visible** — concept cards show the current state of the world/character/storyline at a glance
- **Structured** — every idea is categorized into a Concept Type, making it searchable and referenceable
- **Exportable** — the structured output (code and .md files) can feed directly into production tools via an MCP Server
- **Collaborative** — a shared source of truth that a team can reference (future capability)

The new pipeline model adds a fifth quality: **Progressive.** Creative ideas start loose and unstructured, then get sharper and more organized as the user moves through phases. The tool matches the way creative people actually think — divergent first, convergent later.

---

## 4. Core Concept: Concept Types

This is the foundational abstraction of Story Engine. Everything the user describes eventually gets categorized into **Concept Types** — labeled categories that represent a specific dimension of a World, Character, or Conflict/Storyline.

### How it works

1. The user describes their creative vision in natural language
2. The AI engine identifies discrete concepts within the input
3. Each concept is assigned a **Concept Type** label
4. The concept appears as a **card** in the workspace, organized by its Concept Type

**Phase-sensitivity:** Concept Types don't appear immediately. During Discovery (§5.2), ideas are raw and fluid — structuring them too early kills creative momentum. Concept Types emerge during Development (§5.3) as ideas crystallize. By Refinement (§5.4), Concept cards are the primary working surface.

### Example

**User input during Development:**
> "She lives in 1820s France, very wealthy, enjoys escaping Paris to see her horses and spending time painting with her sister."

**Engine extracts:**

| Concept Type | Value | Dimension |
|---|---|---|
| Time Period | 1820s | World |
| Location | France (Paris, rural estate) | World |
| Socioeconomic Class | Upper class / wealthy | World + Character |
| Activity | Horseback riding, painting | Character |
| Relationship | Sister (close bond, shared creative interests) | Character |
| Character Trait | Escapist, artistic, nature-seeking | Character |

Each row becomes a card in the workspace. Concept Types are not a fixed list — the system can generate new ones as the user's input demands — but there are default sets per creative dimension (see §5.3).

### Concept Type properties

Each Concept Type instance carries:
- **Label** — the Concept Type name (e.g., "Time Period")
- **Value** — the specific content (e.g., "1820s")
- **Dimension** — which creative dimension it belongs to (World, Character, or Conflict)
- **Confidence** — how clearly the AI inferred this from user input (system-internal, not shown to user in v1)
- **Related concepts** — links to other Concept Types that were extracted from the same input
- **Source text** — the original user input that generated this concept

---

## 5. The Creative Pipeline

Story Engine guides users through four phases. Each phase has a clear purpose, a clear transformation of the creative material, and a clear output that feeds the next phase. The AI's role evolves across phases — from listening in Discovery to proposing structure in Development to challenging consistency in Refinement.

**Critical principle: phases are not gates.** Users can move backward and forward freely. A Refinement insight might send the user back to Development to rethink a character. A Development realization might reopen Discovery to brainstorm a new direction. The phases describe the *kind of creative work* being done, not a rigid sequence. The tool tracks where the user is and adapts its behavior accordingly.

### 5.1 Start Screen

The entry point. Two options:

- **Start New Story** → creates a new Project and opens the Discovery phase
- **Open Existing Project** → opens a project list to resume work at whatever phase the user left off

The old v0.2 model asked users to declare their starting point: "Start New World," "Start New Character," or "Start New Storyline." This forced a premature decision. Most creative people don't start with a clean category — they start with a spark (a character moment, a visual, a conflict, a mood). Story Engine now discovers what the user cares about most during Discovery, rather than making them declare it.

**Unified Project Model:** A Project is a single container that holds everything — all creative dimensions, all phases, all concepts. There are no separate "sections" to navigate between.

### 5.2 Phase 1: Discovery

**Purpose:** Get raw creative ideas out of the user's head in an unfiltered, freeform way. Volume over structure. No judgment, no categorization — just creative sparks.

**Interaction model:** A freeform ideation canvas inspired by post-it workshops. The user places notes freely — fragments, images, moods, character sketches, world details, conflict ideas, dialogue snippets, visual references. Anything goes. The AI is available as a brainstorming partner if the user wants it, but it doesn't impose structure.

**What the user sees:** A canvas of loose notes. No Concept Type cards — those come later. No dimension labels (World / Character / Conflict). Just raw creative material on a surface.

**AI role during ideation:** Mostly passive. Available if the user asks for help brainstorming ("Give me five ideas for why she'd leave Paris"), but never interrupts or categorizes on its own. The priority is creative flow, not organization.

**Discovering creative gravity:** As the user fills the canvas, the AI quietly tracks which creative dimension is getting the most energy. A user who writes mostly about a character's psychology and backstory has character-first gravity. A user who writes mostly about a place and its rules has world-first gravity. A user who writes about tension and stakes has conflict-first gravity. This gravity reading informs how the AI presents Development (§5.3) — it leads with the dimension the user cares about most.

**Consolidation (closing Discovery):** When the user is ready to move forward, the AI performs consolidation — identifying themes, grouping related notes, and surfacing patterns across the raw material. This is the bridge from divergent thinking to structured development. The user reviews and adjusts the groupings before moving on.

**Consolidation output:** A set of thematic clusters with suggested labels, ready to be explored as structured concepts in Development.

### 5.3 Phase 2: Development

**Purpose:** Explore and define the three creative dimensions — Character, World, and Conflict — and the relationships between them.

**Interaction model:** A unified workspace with a persistent chat panel and an emerging card surface. The user talks about their story naturally. The AI tracks which dimension is active (Character, World, or Conflict) and connects ideas across dimensions automatically.

**Three creative dimensions (not three screens):** Character, World, and Conflict are not separate screens the user navigates between. They are lenses on the same creative material. The user talks about whatever they're thinking about. If they describe a character's motivation, that's Character. If they describe the city where the character lives, that's World. If they describe the tension between the character and their sister, that's Conflict. The AI tags and organizes — the user just talks.

**Why "Conflict" instead of "Storyline":** In Development, the user is discovering what tensions drive the story — what characters want, what stands in their way, how the world creates pressure. "Conflict" captures this more accurately than "Storyline," which implies a fully formed narrative arc. The full Storyline (arc, beats, plot, pacing) emerges later in Refinement, when conflict gets shaped into narrative structure.

**Concept cards emerge:** This is where Concept Types appear. As the user describes ideas in the chat, the AI extracts concepts and assigns them types. Cards appear on the workspace, organized by dimension. The user can manually create, edit, and rearrange cards.

**Default Concept Types for each dimension:**

#### World Dimension

| Concept Type | Description | Example |
|---|---|---|
| Time Period | When the world exists | "1820s", "Year 2847", "Timeless" |
| Location | Where the world exists (macro and micro) | "France — Paris + rural Provence" |
| Visual Style | The overall aesthetic language | "Baroque opulence meets gritty realism" |
| Architecture — Exterior | Building exteriors, cityscapes, skylines | "Haussmann-era limestone facades" |
| Architecture — Interior | Interior spaces, furnishing style | "Ornate but dusty, neglected grandeur" |
| Natural Environment | Landscape, climate, weather, flora, fauna | "Rolling lavender fields, mild Mediterranean" |
| Key Objects | Significant objects in the world | "Grandfather's pocket watch, the iron gate" |
| Transportation | How people and things move | "Horse-drawn carriages, canal boats" |
| Technology Level | What technology exists and how it's used | "Pre-industrial, candle-lit, hand-written letters" |
| Social Structure | How society is organized | "Rigid class hierarchy, landed aristocracy" |
| Atmosphere / Mood | The emotional texture of the world | "Romantic melancholy, fading glory" |

#### Character Dimension

| Concept Type | Description | Example |
|---|---|---|
| Gender | Gender identity and presentation | "Woman, presents femininely" |
| Age | Age or age range | "Late 20s" |
| Physical Build | Height, weight, body type | "Tall, slender, graceful posture" |
| Facial Features | Face shape, eyes, hair, distinguishing marks | "High cheekbones, dark eyes, scar on left temple" |
| Fashion Style | Clothing, accessories, aesthetic | "Elegant but slightly disheveled; favors dark silks" |
| Voice & Speech | How they sound and how they talk | "Low, measured, dry humor" |
| Personality Trait | Psychological characteristics | "Arrogant, fiercely intelligent, privately insecure" |
| Behavioral Pattern | How they act in the world | "Avoids crowds, gravitates to animals" |
| Knowledge & Education | What they know and how they learned it | "Self-taught botanist, formally uneducated" |
| Motivation | What drives them | "Proving her father wrong" |
| Fear / Weakness | What limits or threatens them | "Terrified of public speaking, prone to self-sabotage" |
| Relationship Role | How they relate to other characters | "Protective older sister, reluctant mentor" |
| Background | Origin story, key life events | "Grew up on the estate, mother died young" |

#### Conflict Dimension

| Concept Type | Description | Example |
|---|---|---|
| Central Conflict | The core tension driving the story | "Her desire for freedom vs. family obligation" |
| Internal Conflict | Tension within a character | "Self-doubt, impostor syndrome" |
| Interpersonal Conflict | Tension between characters | "Sibling rivalry masked as protectiveness" |
| Societal Conflict | Tension between characters and the world | "A woman's ambition in a rigid patriarchy" |
| Stakes | What's at risk | "The family estate, the sister relationship" |
| Catalyst | What sets the conflict in motion | "Discovery of the mother's hidden letters" |
| Escalation | How tension increases over time | "Each attempt to help makes things worse" |
| Theme | The abstract ideas the story explores | "Freedom vs. duty, the cost of truth" |
| Subtext | What's being said beneath the surface | "Every argument about the horses is really about control" |

**Cross-dimension connections:** Because all dimensions live in the same workspace and the same conversation, the AI naturally identifies connections between them. A Character's "Motivation" concept might link to a Conflict's "Central Conflict." A World's "Social Structure" might create the conditions for a "Societal Conflict." These connections are surfaced through the Insights Panel (§5.7) and displayed as visual links between cards when relevant.

**Image generation:** At any point during Development, the system can generate still images (not video) to represent concepts visually. These attach to cards as visual references. Powered by DALL-E (OpenAI API). Users can also upload their own found images.

### 5.4 Phase 3: Refinement

**Purpose:** Put everything in service of the storyline arc. Take the characters, world, and conflicts developed in Phase 2 and shape them into a coherent narrative with structure, pacing, and beats.

**Interaction model:** Concept cards are the primary working surface. The chat shifts from exploration to challenge mode — the AI asks pointed questions about narrative logic, consistency, and gaps. "Your protagonist's motivation doesn't connect to the climax — what drives her in Act 3?" "The world's technology level doesn't support this plot point — is that intentional?"

**What changes from Development:**
- **Conflict → Storyline.** The raw conflicts from Development get shaped into narrative structure. New Concept Types appear that are specific to story construction.
- **Concept cards dominate.** In Development, cards emerge alongside chat. In Refinement, cards are the main thing — the user works directly with them, rearranging, versioning, and refining.
- **AI behavior shifts.** The AI becomes an editor, not a brainstorming partner. It challenges weak connections, identifies plot holes, and suggests structural improvements.
- **Insights Panel activates.** Cross-dimension analysis runs continuously, surfacing Suggestions, Connections, and Conflicts (§5.7).

**Storyline Concept Types (added in Refinement):**

| Concept Type | Description | Example |
|---|---|---|
| Story Arc | The macro shape of the narrative | "Coming of age", "The chosen one" |
| Plot | The sequence of major events | "Discovers the letter → confronts uncle → flees to Paris" |
| Plot Twist | Surprising revelations or reversals | "The uncle was protecting her all along" |
| Sub-plot | Secondary narrative threads | "The sister's secret romance with the stable hand" |
| Conflict Type | The nature of the central tension | "Internal (self-doubt) + interpersonal (sibling rivalry)" |
| Tone | The narrative voice and feel | "Darkly comic, emotionally restrained" |
| Pacing | How time moves in the story | "Slow burn first two acts, rapid escalation in third" |
| Narrative POV | Whose perspective the story is told from | "Third person limited, following the protagonist" |

These Storyline types join the existing Character, World, and Conflict cards from Development. The full concept graph is now visible and workable.

### 5.5 Phase 4: Production Handoff

**Purpose:** Package the structured creative output for consumption by external tools.

**Interaction model:** The user reviews the full concept graph, selects what to export, and chooses a format. The AI can suggest which concepts are production-ready and which still have gaps.

**Export formats:**
- `.md` files — human-readable concept documentation organized by dimension
- Code/JSON — structured data representing the full concept graph

**MCP Server:** A Story Engine MCP Server that external tools can connect to, allowing them to query the world, character, and storyline data. Target integrations include:
- AI video generators (Google Gemini, NanoBanana, OpenAI Video)
- Audio/voice tools (ElevenLabs)
- Game engines (Unreal Engine, Unity, Roblox)
- Custom engines

The MCP Server exposes concepts as queryable resources — an external tool can ask "What does the protagonist look like?" or "Describe the world's visual style" and get structured responses.

**Architecture:** Local-first for v1 proof of concept. The MCP Server runs alongside the app on the user's machine.

### 5.6 Chat Interface (Persistent across Phases)

Every phase includes a chat panel. The chat behavior adapts to the current phase:

- **Discovery:** Brainstorming partner. Helps generate ideas without imposing structure. Available but not pushy.
- **Development:** Concept extractor. Parses input to identify Concept Types and values. Asks clarifying questions. Supports follow-up refinement ("Make her taller", "Actually, set it in the 1840s instead").
- **Refinement:** Creative editor. Challenges narrative logic, identifies gaps, suggests structural improvements.
- **Production Handoff:** Export assistant. Helps review readiness and configure output.

The chat is powered by an AI model via the Anthropic API for text/concept extraction, and the OpenAI API (DALL-E) for image generation.

### 5.7 Insights Panel

A dedicated panel (collapsible sidebar or overlay) that acts as an "inbox of ideas" from the AI. It surfaces three categories of insight, each displayed as small cards within the panel:

**Suggestions** — Ideas for improving or enriching an existing concept. Example: "Your protagonist's motivation ('proving her father wrong') could connect to the World's social structure — consider how rigid class hierarchy reinforces that pressure."

**Connections** — Observations about relationships between concepts across dimensions. Example: "The 'escapist' character trait and the 'rural estate' location seem linked — the estate may represent freedom from Paris/society."

**Conflicts** — Contradictions between concepts that the user can either resolve or deliberately accept. Example: "The character is described as 'formally uneducated' but the storyline has her writing legal documents. Intentional or needs revision?"

The user can dismiss, accept, or act on each insight. Acting on an insight opens the relevant concept for editing.

**Phase behavior:** The Insights Panel is quiet during Discovery (too early for structural analysis). It begins surfacing connections during Development. It runs at full capacity during Refinement, where cross-dimension consistency matters most.

### 5.8 Card Dashboard

The workspace displays Concept cards that the user can rearrange freely.

**Card anatomy:**
- **Title** — the Concept Type label (e.g., "Time Period")
- **Content** — the current value/description
- **Dimension badge** — subtle indicator showing World, Character, or Conflict
- **Image** — optional visual reference (AI-generated via DALL-E or user-uploaded found content)
- **Version indicator** — if the concept has versions (v1, v2, v3), shows the current version with ability to browse history
- **Source indicator** — subtle mark showing which chat message generated this concept
- **Edit controls** — ability to manually edit, delete, or regenerate

**Card layout:**
- Cards are freely rearrangeable by the user via drag-and-drop
- No enforced grouping — the user organizes in whatever way makes sense to their creative process
- The system may suggest initial placement by dimension or Concept Type, but the user has full control

**Card styling (per design language):**
- Rounded corners: 4px to 12px range
- Background: white
- Surface: light gray accents
- Typography: Barlow (headings/labels) + Noto Serif (body/descriptions)
- Type size: minimum 12pt, maximum 36pt

**Phase behavior:** No cards during Discovery. Cards emerge during Development. Cards are the primary surface during Refinement.

---

## 6. Data Model Overview

### Project
The top-level container. Each project holds all creative material across all phases — Discovery notes, Development concepts, Refinement storyline, and export configuration.

### Discovery Note
A raw creative fragment placed on the Discovery canvas. Unstructured text, image reference, or mood/vibe snippet. No Concept Type assigned. Grouped into thematic clusters during consolidation.

### Concept
A single extracted idea. Belongs to a Project. Has a Concept Type, a value, and metadata (source text, timestamps, related concepts, creative dimension).

### Concept Type
A category label (e.g., "Time Period", "Fashion Style"). Each creative dimension has a set of default Concept Types, but both the AI and the user can create new ones. User-created Concept Types are first-class — they behave identically to defaults.

### Concept Version
A concept can have multiple versions (v1, v2, v3). When the user significantly rethinks a concept, they can choose to either revise the current version in-place (for refinements like "make her taller") or create a new version (for major rethinks like "actually, she's a warrior, not a painter"). All versions are preserved and browsable.

### Image
A visual reference attached to a Concept or Discovery Note. Can be AI-generated (via DALL-E) or user-uploaded found content. Stores the generation prompt (if AI-generated), the source, and the image file reference.

### Chat Message
A single message in the conversation. Linked to the Concepts it generated or modified. Chat history is continuous across phases within a project.

### Insight
An AI-generated observation surfaced in the Insights Panel. Has a type (Suggestion, Connection, or Conflict), references the relevant Concepts, and tracks whether the user has dismissed, accepted, or acted on it.

### Phase State
Tracks which phase the project is currently in and what state that phase is in (e.g., Discovery in-progress vs. consolidated, Development active dimension, Refinement completion status).

---

## 7. Design Principles

1. **Chat-first, not form-first.** The user should never feel like they're filling out a database. They talk; the system listens and structures.

2. **Show your work.** Every AI categorization should be traceable back to the user's original input. No magic black boxes.

3. **Concept Types are the lingua franca.** Everything in the system — UI cards, exported .md files, MCP Server responses — speaks in Concept Types. This is the shared vocabulary.

4. **Progressive structure.** Don't impose organization before the user is ready. Discovery is freeform. Development introduces structure. Refinement demands it. Match the tool's rigidity to the phase of creative work.

5. **Dimensions, not destinations.** Character, World, and Conflict are lenses on the same material — not separate places the user navigates to. The workspace is one space; the dimensions are how the AI organizes what's in it.

6. **Export is a first-class citizen.** The system is designed from day one to produce output that other tools can consume. Internal data structures should map cleanly to external formats.

7. **Minimal, warm, editorial UI.** White and light gray palette. Barlow + Noto Serif. Rounded corners. The tool should feel like a sketchbook, not a spreadsheet.

---

## 8. Technical Platform

- **Framework:** React Native / TypeScript / Expo (web-based)
- **AI Backend:** Anthropic API (Claude) for chat, concept extraction, insights, and phase-adaptive behavior
- **Image Generation:** OpenAI API (DALL-E) for AI-generated concept art; also supports user-uploaded found images
- **Data Persistence:** Local server for v1 proof of concept; cloud migration path for later
- **Export:** .md files and structured JSON
- **MCP Server:** Local Node.js-based MCP server for v1; deployable cloud service in future version
- **Connectivity:** Online required (AI chat, image generation, and Insights all depend on API calls)

---

## 9. Visual Language Summary

| Property | Value |
|---|---|
| Color Palette | White (#FFFFFF), Light Gray (#F5F5F5, #E8E8E8), Dark text (#1A1A1A) |
| Corner Radius | 4px – 12px range |
| Heading Font | Barlow (Google Fonts) |
| Body Font | Noto Serif (Google Fonts) |
| Minimum Type Size | 12pt |
| Maximum Type Size | 36pt |
| Layout Pattern | Unified workspace: chat panel + phase-adaptive canvas/card surface |
| Card Style | White background, subtle gray border/shadow, rounded corners |
| Overall Feel | Clean, editorial, sketchbook-like |

---

## 10. Build Sequence (High Level)

This is the recommended order for building, driven by dependencies:

**Phase 1 — Foundation**
- Data model (Project, Discovery Note, Concept, Concept Type, Chat Message, Phase State)
- Basic project creation and persistence (local server)
- Navigation between Start Screen and workspace
- Phase state management (tracking current phase, transitions)

**Phase 2 — Discovery**
- Freeform canvas for Discovery Notes
- Note placement and arrangement
- AI brainstorming partner (optional, chat-based)
- Consolidation flow (AI groups notes into thematic clusters)

**Phase 3 — Chat Engine**
- Chat interface component with phase-adaptive behavior
- Integration with Anthropic API
- Concept extraction from natural language (Development phase)
- Custom Concept Type creation (user and AI-initiated)

**Phase 4 — Development Workspace**
- Card dashboard with drag-and-drop
- Concept cards rendering (with dimension badge, version indicator)
- Chat → card pipeline (input generates cards)
- Manual card editing and concept versioning (v1, v2, v3)
- Dimension tracking (Character / World / Conflict)

**Phase 5 — Refinement**
- Storyline Concept Types added to workspace
- AI editor behavior (challenge mode)
- Cross-dimension consistency checking

**Phase 6 — Insights Panel**
- Cross-dimension concept analysis
- Suggestions, Connections, and Conflicts generation
- Insights Panel UI (inbox-style card list)
- Accept / dismiss / act-on workflow

**Phase 7 — Image Generation**
- Integration with OpenAI API (DALL-E)
- User image upload support (found content)
- Image attachment to Concept cards and Discovery Notes
- Image display on cards

**Phase 8 — Production Handoff (Export & MCP Server)**
- .md file export
- JSON export
- Local MCP Server implementation
- Readiness review UI

---

## 11. What's Explicitly Out of Scope (v1)

- Video generation or animation of any kind
- Audio or voice generation
- Real-time collaboration (multi-user editing)
- Mobile-native optimization (web-first)
- Pre-built template worlds/characters/storylines
- Marketplace or sharing between users
- User accounts and authentication (local-first in v1)
- Offline mode (online required; offline capability is a future consideration)
- Cloud deployment of MCP Server (local-only in v1)
- Cross-device project syncing (local-only in v1)

---

## 12. Resolved Decisions

All original open questions have been resolved. Documented here for reference:

| # | Question | Decision |
|---|---|---|
| 1 | Project structure | **Unified project.** One project contains all creative material across all phases. No separate sections or linking needed. |
| 2 | Image generation provider | **DALL-E (OpenAI API).** Also supports user-uploaded found content (photos, reference images). |
| 3 | Concept Type extensibility | **Fully extensible.** Each dimension has default Concept Types, but both the AI and the user can create new ones. User-created types are first-class. |
| 4 | Data persistence | **Local server for v1.** Proof of concept runs locally. Cloud migration is a future path if the tool proves valuable. |
| 5 | MCP Server architecture | **Local for v1.** Runs alongside the app on the user's machine. Cloud-deployed version is a future consideration. |
| 6 | Concept editing vs. versioning | **Both.** Small refinements ("make her taller") edit the concept in-place. Major rethinks can create a new version (v1, v2, v3). The user decides when something is a refinement vs. a new version. All versions are preserved and browsable. |
| 7 | Card organization | **Free-form, user-controlled.** Cards are drag-and-drop rearrangeable. No enforced grouping. The creative process dictates the layout. |
| 8 | Image scope | **Mixed sources.** AI-generated concept art (via DALL-E) and user-uploaded found content (reference photos, illustrations, etc.). |
| 9 | Cross-dimension feedback UI | **Insights Panel.** A dedicated panel with three categories: Suggestions (enrichment ideas), Connections (cross-concept relationships), and Conflicts (contradictions to resolve or accept). Functions like an idea inbox. |
| 10 | Offline capability | **Online required for v1.** AI chat, image generation, and Insights all depend on API calls. Offline mode is a future consideration. |
| 11 | Creative pipeline model | **Four phases: Discovery → Development → Refinement → Production Handoff.** Replaces the three-Builder (World/Character/Storyline) model from v0.2. Users don't declare a starting dimension — the tool discovers creative gravity during Discovery. |
| 12 | Start Screen options | **Two options: "Start New Story" and "Open Existing Project."** The old "Start New World / Character / Storyline" buttons are removed. |
| 13 | Workspace model | **One unified workspace.** Character, World, and Conflict are creative dimensions the user moves between fluidly, not three separate screens. The AI tracks which dimension is active. |
| 14 | Conflict vs. Storyline naming | **"Conflict" in Development, "Storyline" in Refinement.** During Development, the third dimension is Conflict (the tensions driving the story). In Refinement, conflict gets shaped into the full Storyline (arc, beats, plot, pacing). |
| 15 | Concept card phase behavior | **Phase-appropriate.** No cards during Discovery (too early). Cards emerge during Development. Cards are the primary working surface in Refinement. |

---

## 13. Open Questions

No blocking questions remain. The following are noted for future consideration as development progresses:

1. **Image resolution and quality settings:** What DALL-E model/size to use by default, and whether users can choose quality levels.
2. **Concept Type merging:** If two Concept Types end up describing the same thing (e.g., user creates "Clothing" when "Fashion Style" already exists), should the system suggest merging them?
3. **Project file format:** The exact format of the local project file (single JSON file, folder of files, database, etc.) — to be resolved in the Data Persistence Tech Spec.
4. **Discovery canvas implementation:** Whether the freeform canvas uses a spatial layout (like a whiteboard with positioned notes) or a simpler list/grid of notes. To be resolved in the Discovery Design Spec.
5. **Phase transition UX:** How the user moves between phases — explicit buttons, AI-suggested transitions, or a combination. To be resolved in the Navigation and Workspace Design Specs.
6. **Consolidation depth:** How much the AI reorganizes during Discovery consolidation — light grouping vs. deeper synthesis with suggested labels and summaries. To be resolved in the Discovery Engine Spec.
7. **Conflict dimension defaults:** Whether the 9 default Conflict Concept Types are the right set, or whether some should move to the Storyline types that appear in Refinement. To be resolved during Development spec writing.

---

## 14. Change Log: v0.2 → v0.3

This section documents every significant change between v0.2 and v0.3 for traceability.

### Structural changes

| Area | v0.2 | v0.3 |
|------|------|------|
| Creative model | Three separate Builders (World, Character, Storyline) | Four-phase pipeline (Discovery → Development → Refinement → Production Handoff) |
| Start Screen | Four options (New World, New Character, New Storyline, Open Existing) | Two options (Start New Story, Open Existing Project) |
| Workspace | Three Builder screens with split layout, user navigates between them | One unified workspace; Character/World/Conflict are dimensions, not destinations |
| Third dimension | "Storyline" as a Builder with its own screen | "Conflict" in Development (tensions); shapes into "Storyline" in Refinement (narrative structure) |
| Concept cards | Present from the start in every Builder | Phase-appropriate: absent in Discovery, emerging in Development, primary in Refinement |
| Discovery phase | Did not exist | New: freeform ideation canvas + AI consolidation |
| Production Handoff | Export & MCP Server as a feature | Elevated to a full pipeline phase with readiness review |

### What stayed the same

- Concept Types abstraction and properties
- Default Concept Types per dimension (World: 11, Character: 13)
- Data model entities (Project, Concept, Concept Type, Concept Version, Image, Chat Message, Insight)
- Tech stack (React Native / TypeScript / Expo, Anthropic API, DALL-E, local MCP Server)
- Visual language (colors, fonts, corner radius, editorial feel)
- Insights Panel concept (Suggestions, Connections, Conflicts)
- Card anatomy and styling
- Free-form card layout with drag-and-drop
- Concept versioning model (in-place edits vs. new versions)
- All out-of-scope items
- Export formats (.md, JSON) and MCP Server architecture

### New entities

- **Discovery Note** — raw creative fragment on the Discovery canvas (no Concept Type)
- **Phase State** — tracks current phase and phase-specific state per project

### Terminology changes

| v0.2 term | v0.3 term | Reason |
|-----------|-----------|--------|
| Builder | Dimension | Dimensions are lenses, not places |
| Builder origin | Dimension | Same concept, new name |
| World Builder / Character Builder / Storyline Builder | World dimension / Character dimension / Conflict dimension | Not separate screens anymore |
| Cross-Builder feedback | Cross-dimension feedback | Follows from Builder → Dimension rename |

---

*This PRD is a living document. Next step: Update BUILD_STATUS.md, HARD_RULES.md, and Structure_Map.md to reflect the new pipeline model, then resume the Ideas-to-Code spec writing process.*
