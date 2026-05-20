# Story Engine — Development Screen Design Brief

**Pre-spec conceptual decisions and Figma design requirements.**

May 2026

**CONFIDENTIAL**

---

## Purpose

This document captures the conceptual decisions made during the Development screen thought experiment (May 2026 thread). It provides the creative direction and example content Charlie needs to design the Figma screens. Once Figma designs are complete, this brief feeds into writing `Spec_Development_Design.md`.

---

## 1. Core Concept: Story Elements

Every idea that emerges during Development — whether it's "1820s France" or "freedom vs. duty" or "she's tall and fierce" — is a **story element**. The Development screen is where the user defines, connects, and prioritizes story elements.

"Story elements" is the user-facing mental model. Under the hood, each story element is a Concept with a ConceptType, but the user thinks in terms of creative building blocks, not database taxonomy.

---

## 2. UX Structure

### Three levels of depth

1. **Dimension level** — Character, World, Theme (three containers)
2. **Element level** — Individual story elements within each dimension (e.g., "Motivation," "Time Period," "Tone")
3. **Definition level** — Rich content inside each element (text descriptions, images, AI conversation, references)

### Focus model, not dashboard model

- Default view shows **one dimension at a time** with its elements
- Other two dimensions visible in a collapsed or minimized state — enough to show they exist and how populated they are, not enough to overwhelm
- Tapping a dimension expands it; others recede
- Creative gravity from Discovery determines which dimension is expanded first

### Element detail as focused view

- Tapping a story element opens a focused view (slide-in panel, expanded card, or overlay — design to determine)
- In detail view: write about the element, add images (uploaded or AI-generated), see related elements across dimensions, chat with AI about this specific element
- Rest of workspace dims or compresses during detail view

### Relationships shown contextually, not globally

- When focused on an element, its connections to other elements (including cross-dimension) are visible
- Possibly as chips/pills, a "related" section, or small linked references
- No global relationship web overlaid on the overview — that creates visual chaos
- The AI can surface relationships through conversation

---

## 3. Element Prioritization: Core / Evolve / Set Aside

A three-state tag the user applies to any story element. Answers the question: "What role does this element play in my story right now?"

| Tag | Meaning | Visual Treatment |
|-----|---------|-----------------|
| **Core** | This is central to the story — it stays | Prominent: larger, always visible, full contrast |
| **Evolve** | This needs more work, more thinking, more conversation | Present but with a visual signal that it's in motion |
| **Set Aside** | Not serving the story right now — parked, not deleted | Receded: dimmed, collapsed, or tucked away |

### Design implications

- The tag gives the AI a signal: deepen Core elements, leave Set Aside alone unless the user brings them up
- Interaction method TBD in Figma: could be long-press, swipe, small icons, contextual menu
- Set Aside elements are still accessible — "Set Aside" is gentle, not destructive

---

## 4. What to Design in Figma

### Essential screens (design these first)

1. **Development overview — one dimension focused.** The main screen. One dimension container expanded showing its story elements. The other two dimensions collapsed/minimized. Chat panel present. This establishes the entire spatial model. Show the CHARACTER dimension focused (per creative gravity from Discovery).

2. **Dimension in focus vs. receded.** What does an expanded dimension look like with its elements visible? What do the receded dimensions look like — label + count? Collapsed strip? Just enough presence to orient without competing.

3. **Story element card.** The atomic unit. What does a single element look like in the overview? Does it show: just a label ("Motivation")? Label + value snippet? The Core/Evolve/Set Aside tag? Different treatment for populated vs. empty elements?

4. **Element detail view.** What happens when the user taps a story element. Where they write, add images, see related elements across dimensions. Key decision: slide-in panel, expanded card, modal overlay, or full-screen takeover?

### Secondary screens (design after the essentials)

5. **Core / Evolve / Set Aside interaction.** How the user applies or changes the tag. How each state looks visually.

6. **Relationships between elements.** How connections appear when focused on an element. The cross-dimension links.

7. **Empty/sparse state.** What Development looks like when the user just arrived from Discovery — dimension containers exist but few/no Concept cards yet. Needs to feel inviting, not barren.

8. **Chat panel in Development context.** Same as Discovery's panel or different? Does it show which dimension it's currently focused on? Visual feedback when AI creates a card from conversation?

---

## 5. Example Content: Ready Player One (Development-stage voice)

Use this content in the Figma comp. Written in a "mid-development" voice — half-formed, personal, still figuring things out.

### Character

**Wade Watts / Parzival**
- **Age:** 18, just barely an adult
- **Physical Build:** Out of shape — lives in a chair, basically
- **Personality Trait:** Obsessive about the hunt, lonely underneath it all
- **Behavioral Pattern:** Almost never leaves the OASIS — the real world is just where his body sits
- **Motivation:** Win the contest. But also... prove he matters? Escape the stacks?
- **Fear / Weakness:** Being seen as he actually is — broke, overweight, nobody
- **Background:** Parents gone, aunt doesn't care, raised himself in a junkyard hideout
- **Knowledge & Education:** Knows more about 1980s pop culture than anyone alive, self-taught
- **Fashion Style:** Avatar is curated and cool. Real life is whatever he can find
- **Relationship Role:** Reluctant leader of the group, doesn't totally know how to be a friend

**Art3mis / Samantha**
- **Personality Trait:** Sharp, guarded, cares about the real world more than Wade does
- **Motivation:** The money isn't the point — she wants to actually fix things
- **Relationship Role:** Love interest but also the one who challenges Wade's worldview

**Aech / Helen**
- **Personality Trait:** Loyal, funny, keeps things grounded
- **Relationship Role:** Best friend — the most human connection Wade has

**Sorrento**
- **Personality Trait:** Corporate, dangerous, doesn't actually understand the culture he's trying to own
- **Motivation:** Control the OASIS, monetize everything

**Halliday**
- **Personality Trait:** Genius, awkward, deeply lonely
- **Motivation:** Find someone who gets it — someone who loves what he loved

### World

- **Time Period:** 2045 — everything's kind of falling apart
- **Location:** The stacks (Oklahoma City) and the OASIS — two worlds, one crumbling, one infinite
- **Architecture — Exterior:** Trailers stacked on top of each other, rusty, precarious — vertical poverty
- **Architecture — Interior:** Wade's hideout is a gutted van in a junkyard, packed with scavenged gear
- **Natural Environment:** Real world is used up — energy crisis, climate mess. OASIS can be anything
- **Social Structure:** Massive inequality. IOI runs everything. Gunters are the subculture of obsessive egg hunters
- **Technology Level:** VR is incredible (haptic suits, full immersion) but real-world infrastructure is broken
- **Atmosphere / Mood:** Real world feels grimy and stuck. OASIS feels limitless and nostalgic
- **Key Objects:** The three keys, Anorak's Almanac, the extra life quarter

### Theme

- **Theme:** Escapism vs. reality — is it better to build a perfect fantasy or deal with the broken real thing?
- **Tone:** Nostalgic and adventurous but there's loneliness underneath all of it
- **Subtext:** The contest isn't really about puzzles — Halliday wanted someone to understand him
- **Motif / Symbol:** The Easter egg — something hidden inside something shiny, meaning buried under surface
- **Stakes:** Control of the OASIS (basically civilization), Wade's actual life, whether winning even matters if you lose the real world

---

## 6. Key Design Principles to Hold

- **Concentrated UI.** As little extra UI as possible. The screen should focus on what's important to the user right now.
- **Not visually overwhelming.** The hierarchy (dimensions → elements → detail) should feel navigable, not like boxes-within-boxes.
- **Relationships visible but not cluttered.** The user should see how elements connect — to help develop the story — without a tangled web.
- **Creative, not managerial.** This should feel like a creative workspace, not a project management tool. The tags (Core/Evolve/Set Aside) are creative decisions, not status updates.

---

## 7. Reference Points

- **Discovery screen** (`Spec_Discovery_Design.md`) — the chat panel pattern, the overall visual language, the editorial sketchbook feel
- **Phase_Architecture.md §3** — Development phase definition, progressive disclosure model
- **Phase_Architecture.md §5.2** — Development AI personality rules (what the AI does and doesn't do)
- **Spec_ChatEngine.md §4.2** — Development system prompt (extraction rules, conversational lenses, gap exploration strategy)
- **Spec_DataModel.md §14** — The 29 default ConceptTypes across three dimensions (the "vocabulary" of story elements)

---

*This brief feeds into `Spec_Development_Design.md`, which will be written after Figma designs are reviewed.*
