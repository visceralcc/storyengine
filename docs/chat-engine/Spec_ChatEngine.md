# Story Engine — Chat Engine Specification

**Systems Design & Data Architecture**

Version 0.2 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | May 2026 | Initial draft. Anthropic API integration, context assembly, phase-adaptive system prompts, concept extraction pipeline, stream-of-consciousness extraction, follow-up refinement, custom ConceptType creation, structured response format. |
| **0.2** | **May 2026** | **Updated for DataModel v0.3 (Conflict→Theme, Storyline removed). Dimension references changed from WORLD/CHARACTER/CONFLICT/STORYLINE to WORLD/CHARACTER/THEME throughout. Development prompt updated: Conflict is a conversational lens, not a dimension. Refinement prompt rewritten: no Storyline ConceptTypes, editorial focus on narrative coherence using existing Theme/World/Character concepts + beat framework (spec TBD). Opening message updated for THEME gravity. Base Identity references "themes" not "conflicts".** |

---

## 1. Overview

The Chat Engine is the AI pipeline that powers all chat interactions in Story Engine. It takes natural language input from the user, sends it to the Anthropic API with phase-appropriate context, and parses the structured response into entities (DiscoveryNotes, Concepts, ConceptVersions, ChatMessages).

**Design principle: One pipeline, four personalities.** The Chat Engine is a single system with a shared architecture, but its behavior adapts to the current phase. In Discovery, it's a brainstorming partner that extracts raw notes. In Development, it's a concept extractor that structures ideas into typed cards. In Refinement, it's a creative editor that shapes narrative. In Production, it's an export assistant. The pipeline mechanics (context assembly → API call → response parsing → entity creation) are identical every time — only the system prompt and response handling change.

**Consumer:** Every screen with a chat panel uses the Chat Engine. The Discovery canvas consumes it for brainstorming and stream-of-consciousness extraction (per `Spec_DiscoveryEngine.md` §7). The Workspace consumes it for concept extraction and follow-up refinement. The Insights Engine may trigger it for generating insight descriptions.

**Scope boundary — this system does NOT:**
- Render chat UI (see `Spec_Discovery_Design.md`, `Spec_Workspace_Design.md`)
- Manage canvas layout or note placement (see `Spec_DiscoveryEngine.md`)
- Generate images (see `Spec_ImageGeneration.md`)
- Generate Insights (see `Spec_InsightsEngine.md`)
- Persist entities to disk (see `Spec_DataPersistence.md` — the Chat Engine creates entities in memory; persistence handles saving them)

---

## 2. Anthropic API Integration

### 2.1 Model Selection

| Setting | Value |
|---------|-------|
| Model | `claude-sonnet-4-20250514` |
| Max tokens | `4096` |
| Temperature | `0.7` (creative tasks benefit from moderate randomness) |
| Streaming | Enabled — responses stream token-by-token for perceived responsiveness |

**Why Sonnet over Opus:** Concept extraction and brainstorming are high-volume, moderate-complexity tasks. Sonnet provides the best balance of quality, speed, and cost for v1. If extraction quality proves insufficient during testing, upgrading to Opus is a configuration change (swap the model string).

**Why not Haiku:** Creative brainstorming and nuanced concept extraction require stronger reasoning than Haiku provides. The quality tradeoff is not worth the cost savings for a creative tool.

### 2.2 API Client

The Chat Engine uses a single API client module that all phases share.

```typescript
interface ChatEngineConfig {
  model: string;                    // "claude-sonnet-4-20250514"
  maxTokens: number;                // 4096
  temperature: number;              // 0.7
  apiKey: string;                   // loaded from environment variable ANTHROPIC_API_KEY
}
```

**API key management:** The key is read from an environment variable (`ANTHROPIC_API_KEY`), never hardcoded. In development, this is set via a `.env` file (excluded from version control via `.gitignore`). In production, it's set via the deployment environment.

**Error handling:** All API calls are wrapped in try/catch. The three failure modes and their handling:

| Failure | Cause | Response |
|---------|-------|----------|
| Network error | No internet, DNS failure, timeout | Show "Unable to reach the AI. Check your connection and try again." in chat as a system message. Do not create any entities. |
| API error (4xx/5xx) | Rate limit, invalid key, server error | Show "Something went wrong with the AI service. Try again in a moment." Rate limit (429): include "You're sending messages too quickly — wait a few seconds." |
| Parse error | AI response doesn't match expected format | Fall back to treating the entire response as a plain chat message (no extraction). Log the malformed response for debugging. |

### 2.3 Streaming

Responses stream via the Anthropic SDK's streaming API. The chat panel displays tokens as they arrive — the user sees the assistant "typing" in real time.

**Streaming and structured responses:** The AI returns structured JSON (see §5) embedded within its response. During streaming, the chat panel displays the conversational portion of the response as it arrives. The structured data (extracted notes, concepts) is parsed only after the full response is received. This means notes/cards appear on the canvas/dashboard after the response completes, not token-by-token.

**Stream cancellation:** If the user sends a new message while a response is still streaming, the in-progress stream is cancelled (via `AbortController`). The partial response is discarded — no entities are created from it. The new message is sent as a fresh request.

---

## 3. Context Assembly

Every API call sends a `messages` array and a `system` prompt. The context assembly process constructs these from project state.

### 3.1 System Prompt Structure

The system prompt is assembled from three layers:

```
[Base Identity]        — who the AI is (constant across phases)
[Phase Instructions]   — what the AI should do in this phase (varies by phase)
[Project Context]      — what the AI knows about this project (varies by project state)
```

**Base Identity (constant):**

```
You are a creative collaborator working inside Story Engine, a tool for building
the foundations of stories. You help writers develop their worlds, characters,
and themes through natural conversation.

You are warm, curious, and non-judgmental. You match the user's energy — if they
are excited, share their excitement. If they are uncertain, offer gentle prompts.
You never lecture or over-explain. Short, focused responses are better than long ones.

Your job is to help ideas flow, not to impose structure prematurely.
```

**Phase Instructions:** See §4 for the complete system prompt for each phase.

**Project Context:** See §3.2 for what project state is included.

### 3.2 Project Context Block

The project context block is appended to the system prompt and gives the AI awareness of the current creative state. What's included depends on the phase:

**Discovery phase context:**

```typescript
interface DiscoveryContext {
  projectName: string;
  existingNotes: string[];           // content of all DiscoveryNotes (for awareness, not re-extraction)
  noteCount: number;
}
```

Notes are included so the AI can reference existing ideas during brainstorming ("You mentioned a mansion earlier — tell me more about that"). The note list is capped at the 50 most recent notes to stay within context limits. If more than 50 notes exist, older notes are omitted with a summary count: "Plus 23 earlier notes not shown here."

**Development phase context:**

```typescript
interface DevelopmentContext {
  projectName: string;
  activeDimension: Dimension;        // WORLD | CHARACTER | THEME
  gapAnalysis: GapAnalysis | null;   // from Discovery consolidation
  existingConcepts: ConceptSummary[]; // all concepts in this project, summarized
  conceptTypes: ConceptTypeSummary[]; // available types for the active dimension
  discoveryNotes: string[];          // raw Discovery note content (for reference)
}

interface ConceptSummary {
  type: string;                      // ConceptType label
  value: string;                     // current version's value
  dimension: Dimension;
}

interface ConceptTypeSummary {
  label: string;
  description: string;
  dimension: Dimension;
  hasExistingConcept: boolean;       // true if a Concept of this type already exists
}
```

Concept values are summarized (type label + current value), not passed as full entities. The AI doesn't need version history, IDs, or positions.

**Refinement phase context:** Same as Development. All three dimensions (World, Character, Theme) are available. The Refinement beat framework (Story Arc, Plot, Pacing, etc.) is a separate structural system not managed through ConceptTypes — see `Phase_Architecture.md` §3.

**Production phase context:** Full concept inventory across all dimensions. (Deferred — Production phase behavior is not fully specified yet.)

### 3.3 Conversation History

The `messages` array contains the conversation history for the current phase. Only messages where `phase` matches the current phase are included (per `Spec_DataModel.md` §11 — chat is scoped by phase).

**History limits:** Include the most recent 40 messages (20 user + 20 assistant pairs). Older messages are dropped from the API call but remain persisted. If the conversation is shorter than 40 messages, include all of them.

**Why 40:** Keeps the context window manageable while providing enough conversational continuity. The system prompt + project context + 40 messages should stay well within Claude Sonnet's context window for typical usage.

### 3.4 Full Request Shape

```typescript
// Assembled API request
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  temperature: 0.7,
  system: `${baseIdentity}\n\n${phaseInstructions}\n\n${projectContext}`,
  messages: conversationHistory  // ChatMessage[] mapped to { role, content }
}
```

---

## 4. Phase-Adaptive System Prompts

Each phase has its own instruction block that defines the AI's personality, extraction behavior, and response format for that phase. These are appended to the Base Identity (§3.1).

### 4.1 Discovery Phase Prompt

This prompt is fully defined in `Spec_DiscoveryEngine.md` §7.1. Reproduced here for completeness:

**Role:** Brainstorming partner. Get ideas out of the user's head.

**Key instructions:**
- When the user shares creative content (scenes, characters, settings, moods, conflicts), identify discrete ideas and return them as separate notes
- When the user asks questions or requests ideas, respond conversationally — do not create notes from AI suggestions, only from user-expressed ideas
- Do not use Concept Type labels. Do not mention "World", "Character", or "Conflict" as categories. Do not impose any structure
- Keep responses short — the canvas is the star, not the chat
- Tone: curious, encouraging, non-judgmental

**Response format:** See §5.1.

**Intent detection rules (from `Spec_DiscoveryEngine.md` §3.2–3.3):**
- User is *expressing* creative content → extraction mode (create notes)
- User is *requesting* ideas or asking questions → brainstorming mode (chat only, no notes)
- Ambiguous → default to brainstorming (under-extract, don't over-create)
- Message under 10 words → likely brainstorming unless clearly a creative fragment

### 4.2 Development Phase Prompt

**Role:** Concept extractor and creative explorer. Help the user build structured understanding of their story across World, Character, and Theme dimensions.

**Key instructions:**

```
You are now in the Development phase. The user has brainstormed raw ideas during
Discovery and is ready to develop them into structured concepts.

YOUR JOB:
1. When the user describes creative ideas, extract structured Concepts from their
   input. Each Concept has a type (from the available Concept Types) and a value.
2. Surface gaps in the user's creative thinking through natural conversation —
   not checklists. Use the gap analysis to know what's been explored and what hasn't.
3. When the user refines an existing concept ("make her taller", "actually set it
   in the 1840s"), update the existing concept rather than creating a new one.

EXTRACTION RULES:
- Assign each extracted concept to a Concept Type from the available list.
- If no existing type fits, you may suggest creating a new custom type.
- Each concept should have a clear, specific value — not just a label.
  Good: "1820s France, rural Provence" for Time Period.
  Bad: "historical" for Time Period.
- If one input contains ideas spanning multiple dimensions, extract concepts
  for each dimension. You are not limited to the currently active dimension.
- Preserve the user's voice. Extract and structure, don't rewrite.

CONVERSATIONAL LENSES:
Use these lenses to ask probing questions that deepen the user's material.
Don't announce them — weave them into natural conversation:
- Conflict — What tensions exist between characters, within characters, or
  between characters and the world?
- Motivation — What drives each character? What do they want vs. need?
- Relationships — How do characters relate to each other? What's the dynamic?
- Stakes — What's at risk? What happens if the character fails?
- Social Structure — How is the world organized? Who has power?
- Backstory — What happened before the story begins?
- Sensory Detail — What does the world look, sound, smell, feel like?

GAP EXPLORATION:
- Reference the gap analysis to understand what's been covered and what hasn't.
- For STRONG coverage: don't re-ask. Acknowledge what's established.
- For PARTIAL coverage: weave natural follow-up questions into conversation.
  "You mentioned a crumbling mansion — tell me more about what buildings look like
  in this world."
- For gaps: surface them organically, never as a checklist.
  "What drives her? What does she want more than anything?" — not "You haven't
  defined a Motivation concept."
- Prioritize gaps in the active dimension, but don't ignore cross-dimension gaps
  when they arise naturally.

TONE:
- Collaborative, not interrogative. You're exploring together, not conducting an interview.
- Match the user's energy. If they're excited, share the excitement.
- Short, focused responses. Ask one question at a time, not three.

ACTIVE DIMENSION: {activeDimension}
The user is currently focused on the {activeDimension} dimension. Prioritize
extraction and conversation for this dimension, but extract cross-dimension
concepts when the user's input warrants it.
```

**Response format:** See §5.2.

### 4.3 Refinement Phase Prompt

**Role:** Creative editor and narrative shaper. Help the user refine their concepts for coherence, depth, and narrative readiness.

**Key instructions:**

```
You are now in the Refinement phase. The user has developed concepts across
World, Character, and Theme. Now it's time to refine those concepts for
coherence, depth, and narrative readiness — preparing the story's foundation
for the structural work that follows (beat frameworks, story arcs, pacing).

YOUR JOB:
1. Help the user refine and deepen existing World, Character, and Theme concepts.
2. Identify inconsistencies or tensions between existing concepts and surface
   them as opportunities, not problems.
3. Continue to extract new concepts when the user describes ideas that don't
   have cards yet.
4. Help the user see their story from the audience's perspective — what works,
   what's missing, what contradicts.

EDITORIAL VOICE:
- You are now an editor, not just a collaborator. You can push back gently:
  "This motivation doesn't quite connect to the theme of freedom — what if..."
- Surface contradictions constructively. "Her fear of public speaking and
  her role as a leader create interesting tension — is that intentional?"
- Help the user notice when Theme concepts (tone, subtext, motifs) are
  reflected in their Character and World concepts — or when they aren't.
- Suggest connections across dimensions: "The crumbling estate (World) and
  the theme of decay — does that connect to how she's changing as a person?"

TONE:
- Thoughtful, precise, constructive. Less free-association, more craft.
- Still warm and supportive, but with editorial backbone.
```

**Response format:** See §5.2 (same as Development — Concepts with ConceptType assignments).

### 4.4 Production Phase Prompt

**Role:** Export assistant. Help the user prepare their story data for production use.

**Deferred.** The Production Handoff phase is not fully specified. When `Spec_Export.md` and `Spec_MCPServer.md` are written, this prompt will be defined. For now, Production uses the Refinement prompt as a fallback.

---

## 5. Structured Response Format

The AI returns structured data embedded in its response. The Chat Engine parses this data to create the appropriate entities. Different phases use different response structures.

### 5.1 Discovery Response Format

Used during the Discovery phase. Matches the format defined in `Spec_DiscoveryEngine.md` §3.2.

**AI instruction (included in system prompt):**

```
When you extract notes from the user's creative content, include them in a
JSON block at the end of your response, fenced with ```json markers.

Format:
{
  "notes": ["note text 1", "note text 2", ...]
}

If you are responding conversationally (brainstorming mode, no notes to extract),
do NOT include the JSON block. Just respond in natural language.

Each note should be a single discrete idea, typically 5–30 words. Extract and
separate the user's ideas — do not rephrase, formalize, or add your own
interpretation. You are a splitter, not a rewriter.
```

**Parsing logic:**

1. Check if the response contains a fenced JSON block (` ```json ... ``` `)
2. If yes: parse the JSON. Extract the `notes` array. The text before the JSON block is the `chatResponse`.
3. If no: the entire response is a `chatResponse` with no notes.
4. If JSON parsing fails: treat the entire response as a `chatResponse`. Log the parsing error.

```typescript
interface DiscoveryResponse {
  chatResponse: string;              // conversational text displayed in chat
  notes: string[];                   // extracted note contents (empty array if brainstorming mode)
}
```

### 5.2 Development / Refinement Response Format

Used during Development and Refinement phases. The AI extracts structured Concepts with Concept Type assignments.

**AI instruction (included in system prompt):**

```
When you extract concepts from the user's input, include them in a JSON block
at the end of your response, fenced with ```json markers.

Format:
{
  "concepts": [
    {
      "conceptTypeLabel": "Time Period",
      "value": "1820s France, rural Provence",
      "dimension": "WORLD"
    },
    {
      "conceptTypeLabel": "Motivation",
      "value": "Proving her father wrong — escaping the expectations placed on her",
      "dimension": "CHARACTER"
    }
  ],
  "updatedConcepts": [
    {
      "existingConceptType": "Physical Build",
      "newValue": "Tall, athletic build — she rides horses daily",
      "editType": "REFINE"
    }
  ],
  "suggestedNewTypes": [
    {
      "label": "Cultural Practice",
      "description": "Rituals, customs, and traditions that define daily life",
      "dimension": "WORLD"
    }
  ]
}

RULES:
- "concepts" contains brand-new concepts to create.
- "updatedConcepts" contains changes to existing concepts. Use "editType":
  "REFINE" for small adjustments (updates existing version in place) or
  "RETHINK" for major changes (creates a new version).
- "suggestedNewTypes" contains custom Concept Types the AI thinks should
  be added. Only suggest a new type when nothing in the existing list fits.
- Any of the three arrays can be empty or omitted if not applicable.
- If you are just chatting (no concepts to extract or update), do NOT
  include the JSON block.
- Use the exact Concept Type labels from the available types list.
- For cross-dimension concepts, extract separate entries per dimension.
```

**Parsing logic:**

```typescript
interface ExtractionResponse {
  chatResponse: string;

  concepts: {
    conceptTypeLabel: string;        // must match an existing ConceptType label
    value: string;                   // the concept content
    dimension: Dimension;            // WORLD | CHARACTER | THEME
  }[];

  updatedConcepts: {
    existingConceptType: string;     // label of the concept being updated
    newValue: string;                // the new/updated value
    editType: "REFINE" | "RETHINK"; // in-place edit vs. new version
  }[];

  suggestedNewTypes: {
    label: string;                   // proposed type label (Title Case)
    description: string;             // what this type captures
    dimension: Dimension;
  }[];
}
```

### 5.3 Response Parsing Pipeline

After the full response is received (streaming complete), the Chat Engine runs this pipeline:

```
1. SPLIT — Separate the chatResponse text from the JSON block
2. PARSE — Parse the JSON block into the phase-appropriate response type
3. VALIDATE — Check extracted data against project state
4. CREATE — Create new entities (DiscoveryNotes, Concepts, ConceptVersions)
5. PERSIST — Save the ChatMessage and new entities via persistence layer
```

**Step 3 — Validation rules:**

For new Concepts:
- `conceptTypeLabel` must match an existing ConceptType label in the project (case-insensitive match, but preserve the canonical casing from the ConceptType entity)
- If no match is found: check if the label matches a suggested new type from the same response. If so, create the new type first, then the concept. If not, log a warning and skip this concept.
- `dimension` must match the ConceptType's dimension. If mismatched, use the ConceptType's dimension (the AI may occasionally get this wrong).
- `value` must be non-empty after trimming.

For updated Concepts:
- `existingConceptType` must match an existing ConceptType label that has at least one Concept in the project
- If multiple Concepts of that type exist (rare in v1), update the most recently modified one
- `editType` must be `"REFINE"` or `"RETHINK"`. If invalid, default to `"REFINE"`.

For suggested new types:
- `label` must not match any existing ConceptType label (case-insensitive). If it does, skip the suggestion.
- `dimension` must be a valid Dimension value.

### 5.4 Entity Creation from Parsed Response

**Discovery phase:**

For each note in `notes[]`:
1. Create a `DiscoveryNote` entity with `content` set to the note text
2. Assign a random position within the current viewport (per `Spec_DiscoveryEngine.md` §2.2 collision avoidance)
3. Set `clusterId` to `null` (no cluster assignment during note creation)

Create a `ChatMessage` entity with:
- `phase: "DISCOVERY"`
- `role: "assistant"`
- `content`: the `chatResponse` text
- `conceptIds: []` (Discovery messages don't reference Concepts)

**Development / Refinement phase:**

For each concept in `concepts[]`:
1. Look up the ConceptType by label (case-insensitive match)
2. Create a `Concept` entity with a single `ConceptVersion` (version 1)
3. Set `sourceMessageId` to the ChatMessage ID being created in step 5
4. Set `position` to a default position (the workspace will handle layout — see `Spec_Workspace_Design.md`)

For each update in `updatedConcepts[]`:
1. Find the existing Concept by its ConceptType label
2. If `editType` is `"REFINE"`: update the current ConceptVersion's `value` and `updatedAt`
3. If `editType` is `"RETHINK"`: create a new ConceptVersion with incremented `versionNumber`, set it as `currentVersionId`

For each suggested type in `suggestedNewTypes[]`:
1. Create a `ConceptType` entity with `isDefault: false`
2. The suggested type is immediately available for concept extraction

Create a `ChatMessage` entity with:
- `phase`: current phase (`"DEVELOPMENT"` or `"REFINEMENT"`)
- `role: "assistant"`
- `content`: the `chatResponse` text
- `conceptIds`: IDs of all Concepts created or updated in this response

---

## 6. Follow-Up Refinement

Follow-up refinement is when the user modifies an existing concept through conversation: "Make her taller", "Actually, set it in the 1840s instead", "She's not arrogant, she's guarded."

### 6.1 How Refinement Works

The AI determines refinement intent from conversational context. It doesn't require special syntax or commands from the user. The conversation history provides enough context for the AI to understand that "Make her taller" refers to the Physical Build concept that was recently discussed.

**The AI decides whether a follow-up is a REFINE or RETHINK** based on the magnitude of change:
- "Make her taller" → `REFINE` (small adjustment, update in place)
- "Actually, she's a warrior, not a painter" → `RETHINK` (fundamental change, new version)

The AI's judgment here is best-effort. Since concept versioning is user-initiated (per HARD_RULES), the system should present RETHINK suggestions to the user for confirmation before creating a new version. In v1, the AI's `editType` is treated as a recommendation:
- `REFINE` is applied automatically (low risk — the user can undo by chatting more)
- `RETHINK` triggers a brief inline confirmation in the chat: "This is a big change — should I create a new version of [Concept Type], or update the existing one?" The user responds, and the Chat Engine acts accordingly.

### 6.2 Reference Resolution

When the user says "Make her taller," the AI needs to know which concept "her" refers to. This is handled through conversational context — the `messages` array provides the history of what was recently discussed.

**Resolution strategy:** The AI uses natural language understanding from the conversation history. No special reference system is needed. The existing Concept summaries in the project context (§3.2) tell the AI what concepts exist, and the conversation history tells it what was recently discussed.

**Ambiguity handling:** If the AI can't determine which concept the user is referring to, it asks: "Which character do you mean — [Character A] or [Character B]?" This is the AI's standard clarification behavior, not a special refinement feature.

---

## 7. Custom ConceptType Creation

New Concept Types can be created by the AI (suggested during extraction) or by the user (requested directly in chat).

### 7.1 AI-Initiated Creation

During extraction (§5.2), the AI may include `suggestedNewTypes` when the user's input describes something that doesn't fit any existing Concept Type.

**Example:** The user describes detailed cultural rituals. No default type covers "Cultural Practice." The AI suggests creating one:

```json
{
  "suggestedNewTypes": [
    {
      "label": "Cultural Practice",
      "description": "Rituals, customs, and traditions that define daily life",
      "dimension": "WORLD"
    }
  ]
}
```

**How it appears to the user:** The AI's chat response mentions the suggestion naturally: "I noticed your world has rich cultural traditions — I've created a 'Cultural Practice' concept type to capture those." The new type is created immediately and the concept is extracted using it in the same response.

**Guardrails:**
- The AI should prefer existing types over creating new ones. Only suggest a new type when nothing in the existing list is a reasonable fit.
- New type labels must be Title Case with spaces (per HARD_RULES naming conventions).
- The AI should not create types that are very similar to existing ones (e.g., don't create "Clothing Style" when "Fashion Style" exists). The system prompt includes this instruction.

### 7.2 User-Initiated Creation

The user can explicitly request a new type in chat: "Create a Concept Type called 'Signature Weapon' for characters."

**Handling:** The AI recognizes this as a type-creation request (not a concept extraction). It creates the ConceptType entity with the user's label and dimension, and confirms in chat: "Done — 'Signature Weapon' is now available as a Character concept type."

**Validation:** Same rules as AI-initiated (§5.3 validation) — no duplicate labels, valid dimension.

---

## 8. Stream-of-Consciousness Extraction

This section describes the detailed mechanics of the extraction that `Spec_DiscoveryEngine.md` §3.2 defines at a high level.

### 8.1 Extraction Quality Rules

The AI follows these rules when extracting ideas from a stream-of-consciousness input:

1. **Atomic notes.** Each note should capture one discrete idea. If an idea can be split into two independent ideas, it should be. "A woman riding a horse away from a mansion" is one idea. "She's angry but relieved" is a separate idea (emotional state, not scene description).

2. **Preserve user language.** Extract using the user's words, not the AI's interpretation. If the user says "crumbling old place," the note says "crumbling old place" — not "dilapidated estate in disrepair."

3. **No structural labels.** During Discovery, notes have no Concept Type, no dimension, no category. The AI extracts raw fragments, not structured data.

4. **Bias toward over-extraction.** When in doubt, create the note. It's easier to delete an unwanted note than to lose an idea. The user curates during review.

5. **Note length target.** Each note should be 5–30 words. Under 5 is usually too vague. Over 30 is probably two ideas that should be split.

6. **No AI-originated ideas in notes.** Notes come from the user's input only. If the AI has a brainstorming suggestion, it goes in the chat response — never as an extracted note.

### 8.2 Extraction vs. Concept Extraction

Stream-of-consciousness extraction (Discovery) and concept extraction (Development) are different operations:

| Aspect | Discovery Extraction | Development Extraction |
|--------|---------------------|----------------------|
| Input | User's raw creative stream | User's creative input |
| Output entity | `DiscoveryNote` | `Concept` + `ConceptVersion` |
| Structure applied | None — raw fragments | Concept Type + Dimension + Value |
| Placed on | Canvas at random position | Workspace as a card |
| AI role | Splitter (separate ideas) | Extractor (identify + categorize) |
| Structural labels | Forbidden | Required |

### 8.3 Long Input Handling

When the user pastes a very long input (500+ words):

- The AI should extract as many discrete ideas as warranted — there is no cap on notes/concepts per message
- For Discovery: 10–30 notes from a long stream is typical and expected
- For Development: 3–8 concepts from a long input is typical (each with more substance)
- If the input is extremely long (1000+ words), the AI should prioritize the strongest, most distinct ideas and may note in chat: "That was a rich stream — I've captured the strongest ideas. Let me know if I missed anything important."

---

## 9. Development Chat: Gap-Aware Conversation

The Development phase chat uses the gap analysis from Discovery (per `Spec_DiscoveryEngine.md` §6.3) to guide conversation intelligently.

### 9.1 Opening Message

When the user first enters Development, the chat engine sends an opening message based on the creative gravity from Discovery:

| Creative Gravity | Opening Message Pattern |
|-----------------|------------------------|
| `CHARACTER` | "Your Discovery notes had a lot of energy around a character — want to start exploring who she is?" |
| `WORLD` | "Your ideas paint a vivid world — want to start defining where and when this story lives?" |
| `THEME` | "There's a strong sense of what this story is about in your notes — want to dig into the themes and feelings driving it?" |
| `null` (no gravity) | "You've got a rich mix of ideas from Discovery. Where would you like to start — a character, a place, or what the story is about?" |

The opening message is generated once (on first entry to Development) and persisted as a ChatMessage. On subsequent visits to the Development chat, the existing conversation history is shown instead.

### 9.2 Gap Exploration Strategy

The AI does not have a fixed script. It uses the gap analysis as a background awareness, not a checklist to work through. The strategy:

1. **Let the user lead.** The user's message determines the conversation topic. The AI follows their energy.
2. **Weave gaps in naturally.** When the user's topic is adjacent to a gap, the AI bridges to it. User talks about a character's appearance → AI asks about voice/speech (a nearby gap) as a natural follow-up.
3. **Never announce gaps.** "You haven't defined a Motivation" is forbidden. "What drives her? What does she want more than anything?" is the correct approach.
4. **Respect coverage.** If the gap analysis shows `STRONG` coverage for Time Period, the AI doesn't ask "When does your story take place?" It acknowledges what's established: "Your 1820s France setting gives us a lot to work with."
5. **One gap at a time.** The AI explores one area per exchange, never rapid-fires multiple gap questions.

### 9.3 Dimension Switching in Chat

When the user shifts topics across dimensions (e.g., talking about a character's motivation leads to discussing the world's social structure), the AI:

1. Extracts concepts for both dimensions in a single response
2. Does not announce "switching dimensions" — it just follows the conversation naturally
3. Updates the `activeDimension` only if the user's primary focus has clearly shifted (multiple consecutive messages about a different dimension)

The chat is continuous across dimension switches. There is no "dimension-scoped" chat — all Development chat messages share the same conversation history (per `Spec_DataModel.md` §11).

---

## 10. Edge Cases & Rules

### API and response handling
- **Empty AI response:** If the API returns an empty string, display a fallback message in chat: "I'm having trouble responding — try rephrasing or sending your message again." No entities created.
- **Malformed JSON in response:** If the JSON block is present but doesn't parse, treat the entire response as a plain chat message. Log the error. Do not retry — the user can re-send.
- **JSON block without chat text:** If the response is only a JSON block with no conversational text, synthesize a minimal chat message: "I've captured those ideas." This prevents empty-looking chat messages.

### Concept extraction edge cases
- **Concept Type label mismatch:** AI returns a label that doesn't match any existing type (after case-insensitive comparison). Skip this concept, log a warning. The AI will usually self-correct in the next exchange.
- **Duplicate concept creation:** AI extracts a concept with the same type and very similar value to an existing concept. The Chat Engine creates it anyway — deduplication is the user's responsibility. The Insights Engine may later surface this as a "Connection" insight.
- **Zero concepts extracted from creative input:** Valid behavior if the input is too vague or abstract. The AI responds conversationally and may ask for more specifics.
- **Concept extracted for wrong dimension:** Validation corrects this by using the ConceptType's canonical dimension (§5.3). Logged for monitoring.

### Conversation edge cases
- **User sends only whitespace:** Ignore — do not send to API, do not create a ChatMessage.
- **User sends identical message twice:** Send to API normally. The AI may give a different response (non-deterministic). Both messages are persisted.
- **Very rapid messages:** If the user sends a new message while a previous response is streaming, cancel the stream (§2.3) and process the new message. The cancelled response's ChatMessage is not persisted.
- **First message in a new project (Development):** The AI has no conversation history. The system prompt + project context + gap analysis provide enough context for a meaningful opening.

### Phase transition edge cases
- **Switching from Discovery to Development mid-conversation:** Discovery chat messages are not included in the Development messages array. The conversation starts fresh, but the project context (including Discovery notes and gap analysis) provides continuity.
- **Returning to Discovery from Development:** Discovery chat messages resume from where they left off. Development messages are not shown in the Discovery chat.

---

## 11. Relationship to Other Systems

| System / File | Relationship | Section Reference |
|---------------|-------------|-------------------|
| `Spec_DataModel.md` | Creates ChatMessage, Concept, ConceptVersion, ConceptType, DiscoveryNote entities. Reads Project, PhaseState, ConceptType, Concept entities for context assembly. | §3.2, §5.4 |
| `Spec_DataPersistence.md` | Delegates entity persistence. ChatMessages saved immediately (append-only). Concepts/notes saved via the normal persistence pipeline. | §5.4 |
| `Spec_DiscoveryEngine.md` | Implements the Discovery chat behavior defined in §7. Consumes gap analysis from §6. | §4.1, §5.1, §8, §9 |
| `Spec_Navigation.md` | Reads `currentPhase` to determine which system prompt to use. Phase transitions reset the visible chat history. | §4 |
| `Spec_Discovery_Design.md` | The Discovery canvas renders notes created by the Chat Engine. The chat panel renders ChatMessages. | §5.4 |
| `Spec_Workspace_Design.md` | The workspace renders Concept cards created by the Chat Engine. The chat panel renders ChatMessages. | §5.4 |
| `Spec_InsightsEngine.md` | The Insights Engine reads Concepts created by the Chat Engine. It may also consume the gap analysis for Insight generation. | §5.4 |

**No direct interaction:**
- `Spec_ImageGeneration.md` — The Chat Engine does not trigger image generation. That is a separate user action handled by the Image Generation system.
- `Spec_Export.md` / `Spec_MCPServer.md` — The Chat Engine does not participate in export or MCP serving.

---

## 12. Data Model (Preview)

The Chat Engine does not introduce new entity types. It operates on existing entities from `Spec_DataModel.md`:

- **Creates:** `ChatMessage` (§11), `DiscoveryNote` (§6), `Concept` (§8), `ConceptVersion` (§9), `ConceptType` (§7)
- **Reads:** `Project` (§4), `PhaseState` (§5), `ConceptType` (§7), `Concept` (§8), `DiscoveryNote` (§6)

### New types introduced by this spec

```typescript
// --- Chat Engine Config ---

interface ChatEngineConfig {
  model: string;                    // "claude-sonnet-4-20250514"
  maxTokens: number;                // 4096
  temperature: number;              // 0.7
  apiKey: string;                   // from environment variable
}

// --- Context Assembly ---

interface DiscoveryContext {
  projectName: string;
  existingNotes: string[];
  noteCount: number;
}

interface DevelopmentContext {
  projectName: string;
  activeDimension: Dimension;
  gapAnalysis: GapAnalysis | null;
  existingConcepts: ConceptSummary[];
  conceptTypes: ConceptTypeSummary[];
  discoveryNotes: string[];
}

interface ConceptSummary {
  type: string;
  value: string;
  dimension: Dimension;
}

interface ConceptTypeSummary {
  label: string;
  description: string;
  dimension: Dimension;
  hasExistingConcept: boolean;
}

// --- Response Parsing ---

interface DiscoveryResponse {
  chatResponse: string;
  notes: string[];
}

interface ExtractionResponse {
  chatResponse: string;
  concepts: {
    conceptTypeLabel: string;
    value: string;
    dimension: Dimension;
  }[];
  updatedConcepts: {
    existingConceptType: string;
    newValue: string;
    editType: "REFINE" | "RETHINK";
  }[];
  suggestedNewTypes: {
    label: string;
    description: string;
    dimension: Dimension;
  }[];
}
```

---

## 13. Build Sequence (Preview)

### Phase 1 — API client and base infrastructure

1. Create the API client module with `ChatEngineConfig`
2. Implement the base `sendMessage` function: takes system prompt + messages array, returns streamed response
3. Implement streaming with `AbortController` cancellation
4. Implement error handling for network, API, and parse failures (§2.2)
5. Write unit tests: mock API responses, verify error handling for each failure mode, verify stream cancellation

### Phase 2 — Context assembly

1. Implement `assembleDiscoveryContext` — reads DiscoveryNotes, caps at 50, formats for system prompt
2. Implement `assembleDevelopmentContext` — reads Concepts (summarized), ConceptTypes, gap analysis, Discovery notes
3. Implement `assembleSystemPrompt` — combines Base Identity + Phase Instructions + Project Context
4. Implement conversation history assembly with 40-message cap
5. Write tests: context assembly produces correct structure, history capping works, context includes correct phase data

### Phase 3 — Discovery chat integration

1. Implement the Discovery system prompt (§4.1)
2. Implement response parsing for Discovery format (§5.1) — split chat text from JSON block
3. Implement DiscoveryNote creation from parsed notes (including random viewport placement)
4. Implement intent detection (extraction vs. brainstorming)
5. Write tests: extraction produces DiscoveryNotes, brainstorming produces zero notes, JSON parse errors handled gracefully

### Phase 4 — Development chat integration

1. Implement the Development system prompt (§4.2)
2. Implement response parsing for Development format (§5.2) — concepts, updates, suggested types
3. Implement Concept + ConceptVersion creation from parsed concepts
4. Implement follow-up refinement: REFINE (in-place edit) and RETHINK (new version with confirmation)
5. Implement ConceptType validation (label matching, dimension correction)
6. Write tests: concept creation with correct entity structure, refinement updates existing concepts, validation catches mismatches

### Phase 5 — Custom ConceptType creation

1. Implement AI-initiated type creation from `suggestedNewTypes`
2. Implement user-initiated type creation (detect "create a type" requests)
3. Implement deduplication check (no duplicate labels)
4. Write tests: new types created with `isDefault: false`, duplicates rejected, types immediately available for extraction

### Phase 6 — Gap-aware conversation (Development)

1. Implement the opening message based on creative gravity (§9.1)
2. Wire gap analysis into the Development system prompt context
3. Test end-to-end: Discovery notes → consolidation → gap analysis → Development chat uses gap awareness
4. Write integration tests: AI avoids re-asking STRONG coverage areas, naturally explores gaps

### Phase 7 — Refinement chat integration

1. Implement the Refinement system prompt (§4.3)
2. Verify all three dimensions (World, Character, Theme) are available in Refinement context
3. Verify concept extraction works end-to-end in Refinement (same mechanics as Development, editorial tone)
4. Write tests: concepts created with correct dimension, editorial tone in system prompt, no STORYLINE or CONFLICT dimension references

---

## 14. Out of Scope

- **Image generation.** The Chat Engine does not generate images. Image generation is triggered separately via `Spec_ImageGeneration.md`.
- **Insights generation.** The Chat Engine does not generate Insights (Suggestions, Connections, Conflicts). That is the Insights Engine's responsibility.
- **Chat UI rendering.** The Chat Engine produces data (ChatMessages, Concepts). How they are displayed is defined in the Design Specs.
- **Production phase chat.** The Production Handoff chat behavior is deferred until `Spec_Export.md` is written.
- **Multi-model support.** v1 uses Claude Sonnet only. Upgrading to Opus or mixing models per phase is a future consideration.
- **Chat history export.** Chat messages are not included in .md or JSON exports in v1.
- **Message editing or deletion.** Chat history is append-only per `Spec_DataModel.md`. No edit/delete in v1.
- **Tool use / function calling.** The Chat Engine uses plain text prompts with embedded JSON for structured output. It does not use the Anthropic tool use API in v1. This is a simplification — tool use could improve extraction reliability in a future version.
- **Offline fallback.** All chat features require an active internet connection (per HARD_RULES).

---

## 15. Open Questions

1. **Tool use vs. embedded JSON:** This spec uses embedded JSON blocks in the response for structured extraction. The Anthropic API's tool use feature would provide more reliable structured output (guaranteed JSON schema). Recommendation: start with embedded JSON (simpler to implement, easier to debug), upgrade to tool use if extraction reliability is insufficient. To be resolved during Phase 4 implementation.

2. **RETHINK confirmation UX:** §6.1 specifies that RETHINK suggestions trigger an inline confirmation in chat. The exact UX for this confirmation (inline buttons? A follow-up prompt? Auto-accept after a delay?) is a Design Spec decision. To be resolved in `Spec_Workspace_Design.md`.

3. **Context window management:** §3.3 caps conversation history at 40 messages. For very long sessions with rich project context, the total token count may approach context window limits. A token counting mechanism could dynamically adjust the history cap. Deferred to implementation — Sonnet's context window is large enough that this is unlikely to be a problem in v1.

4. **Temperature per phase:** §2.1 uses a fixed temperature of 0.7 across all phases. Discovery might benefit from higher temperature (more creative, unexpected responses) while Refinement might benefit from lower (more precise, editorial). Deferred to testing.

5. **Concept position assignment:** §5.4 sets new Concept positions to a "default position." The exact default and how the workspace handles layout for new cards needs to be defined in `Spec_Workspace_Design.md`.

---

## 16. Files Affected (Summary)

| File Path | Change |
|-----------|--------|
| `src/engine/chat/client.ts` | Anthropic API client, streaming, error handling |
| `src/engine/chat/context.ts` | Context assembly for each phase (system prompt + project context) |
| `src/engine/chat/prompts.ts` | Base Identity, phase-specific system prompt templates |
| `src/engine/chat/parser.ts` | Response parsing — split chat text from JSON, parse structured data |
| `src/engine/chat/extraction.ts` | Entity creation from parsed responses (notes, concepts, versions, types) |
| `src/engine/chat/refinement.ts` | Follow-up refinement logic (REFINE vs. RETHINK detection and application) |
| `src/engine/chat/types.ts` | ChatEngineConfig, context interfaces, response types |
| `src/engine/chat/__tests__/` | Unit tests for all above |

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: [repo path] | Branch: main

Spec file: docs/chat-engine/Spec_ChatEngine.md
→ Read this spec (v0.2) for the full AI chat pipeline: API integration,
  context assembly, phase-adaptive prompts, concept extraction, and
  follow-up refinement.

Also read before starting:
- docs/HARD_RULES.md (non-negotiable constraints)
- docs/OVERVIEW.md (project context)
- docs/foundation/Spec_DataModel.md (entity definitions — ChatMessage,
  Concept, ConceptVersion, ConceptType, DiscoveryNote, PhaseState)
- docs/foundation/Spec_DataPersistence.md (save pipeline — append-only
  chat, debounce saves)
- docs/discovery/Spec_DiscoveryEngine.md §3.2, §6, §7 (Discovery chat
  behavior, extraction rules, gap analysis)

Follow the Build Sequence in §13, phase by phase.

Key constraints:
- Model: claude-sonnet-4-20250514, max_tokens 4096, temperature 0.7 (§2.1)
- API key from environment variable ANTHROPIC_API_KEY — never hardcoded (§2.2)
- Streaming enabled — display tokens as they arrive (§2.3)
- Chat history capped at 40 messages per API call (§3.3)
- Discovery context capped at 50 most recent notes (§3.2)
- Response format: conversational text + optional fenced JSON block (§5)
- Discovery extracts DiscoveryNotes (no types). Development extracts
  Concepts (with types). Never mix these. (§8.2)
- RETHINK edits require user confirmation before creating new versions (§6.1)
- All entities are plain objects — interfaces, not classes (DataModel §15)
- Chat history is append-only — messages never edited or deleted (DataModel §11)

Start with: Phase 1 — API client in src/engine/chat/client.ts with
streaming, error handling, and AbortController cancellation.

Work phase by phase. After completing each phase, stop and check in.
Commit after each phase: "feat(chat): Phase 1 — API client and streaming".
```

---

*This spec defines the AI pipeline that powers all chat interactions in Story Engine. For Discovery-specific chat behavior (extraction rules, brainstorming vs. extraction intent), see `Spec_DiscoveryEngine.md` §3 and §7. For the visual design of chat panels, see `Spec_Discovery_Design.md` and `Spec_Workspace_Design.md`.*
