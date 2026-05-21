/**
 * Story Engine — Development story elements
 *
 * The Development Canvas renders "story elements" — the user-facing mental
 * model for Concepts (Development_Screen_Brief §1). This module defines the
 * canvas-facing `StoryElement` view model and resolves the elements to render.
 *
 * Real story elements come from Discovery's consolidation output (Concepts).
 * That pipeline isn't wired up yet, so `getStoryElements` falls back to the
 * Ready Player One sample dataset (Development_Screen_Brief §5) whenever a
 * project has no Concepts. Once consolidation lands, real Concepts take over
 * automatically — no UI change needed.
 *
 * Spec: docs/development/Spec_Development_Design.md §3.1, §6.
 */

import type { Concept, ConceptType, CreativeTag, Dimension, ProjectFile } from '../models/types';

/** A pillar is just a creative dimension viewed through the Development lens. */
export type Pillar = Dimension;

/** Canvas column order, left to right (Spec §3.1). */
export const PILLAR_ORDER: readonly Pillar[] = ['THEME', 'WORLD', 'CHARACTER'] as const;

export interface StoryElement {
  id: string;
  pillar: Pillar;
  /**
   * Card header label. For Theme/World this is the Concept Type ("Tone",
   * "Time Period"); for Character it is the character's name ("Wade Watts").
   */
  label: string;
  /** Detail View element title — the element's short name (Spec §3.2). */
  title: string;
  /** IDEA section text — the Discovery consolidation summary (Spec §3.2). */
  summary: string;
  /**
   * Card body. Theme/World render `body[0]` as a paragraph; Character renders
   * every entry as a bullet point (Spec §3.1, "Character cards use bullets").
   */
  body: string[];
  /** Core/Evolve/Set Aside — drives the ui_eval bar color (Spec §3.1). */
  creativeTag: CreativeTag;
  /** User-written expanded definition. Null until written in Development. */
  definition: string | null;
  /** Connected story elements (AI-inferred or user-added). */
  relatedIds: string[];
}

/** Character story elements render their body as bullets; others as paragraphs. */
export function isBulletElement(element: StoryElement): boolean {
  return element.pillar === 'CHARACTER';
}

// --- Concept → StoryElement mapping (used once consolidation is wired) ---

function conceptToStoryElement(concept: Concept, conceptTypes: ConceptType[]): StoryElement {
  const conceptType = conceptTypes.find((t) => t.id === concept.conceptTypeId);
  const version = concept.versions.find((v) => v.id === concept.currentVersionId);
  const value = version?.value ?? '';
  return {
    id: concept.id,
    pillar: concept.dimension,
    label: conceptType?.label ?? 'Story Element',
    title: value,
    summary: value,
    body: [value],
    creativeTag: concept.creativeTag,
    definition: concept.definition,
    relatedIds: concept.relatedConceptIds,
  };
}

/**
 * Resolve the story elements to render on the Development Canvas. Maps the
 * project's real Concepts when present; otherwise returns the sample dataset
 * so the canvas is populated before the consolidation pipeline exists.
 */
export function getStoryElements(projectFile: ProjectFile): StoryElement[] {
  if (projectFile.concepts.length > 0) {
    return projectFile.concepts.map((c) => conceptToStoryElement(c, projectFile.conceptTypes));
  }
  return SAMPLE_STORY_ELEMENTS;
}

// --- Sample dataset: Ready Player One (Development_Screen_Brief §5) ---
// Written in a "mid-development" voice — half-formed, personal, still figuring
// things out. Used until Discovery consolidation produces real Concepts.

export const SAMPLE_STORY_ELEMENTS: StoryElement[] = [
  // --- Theme ---
  {
    id: 'se_theme',
    pillar: 'THEME',
    label: 'Theme',
    title: 'Escapism vs. Reality',
    summary:
      'Escapism vs. reality — is it better to build a perfect fantasy or deal with the broken real thing?',
    body: [
      'Escapism vs. reality — is it better to build a perfect fantasy or deal with the broken real thing?',
    ],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_subtext', 'se_wade', 'se_atmosphere'],
  },
  {
    id: 'se_tone',
    pillar: 'THEME',
    label: 'Tone',
    title: 'Nostalgic Adventure',
    summary: "Nostalgic and adventurous, but there's loneliness underneath all of it.",
    body: ["Nostalgic and adventurous, but there's loneliness underneath all of it."],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_atmosphere', 'se_subtext'],
  },
  {
    id: 'se_subtext',
    pillar: 'THEME',
    label: 'Subtext',
    title: "Halliday's Loneliness",
    summary:
      "The contest isn't really about puzzles — Halliday wanted someone to understand him.",
    body: ["The contest isn't really about puzzles — Halliday wanted someone to understand him."],
    creativeTag: 'EVOLVE',
    definition: null,
    relatedIds: ['se_halliday', 'se_theme'],
  },
  {
    id: 'se_motif',
    pillar: 'THEME',
    label: 'Motif / Symbol',
    title: 'The Easter Egg',
    summary:
      'Something hidden inside something shiny — meaning buried under the surface.',
    body: ['Something hidden inside something shiny — meaning buried under the surface.'],
    creativeTag: 'EVOLVE',
    definition: null,
    relatedIds: ['se_key-objects', 'se_theme'],
  },
  {
    id: 'se_stakes',
    pillar: 'THEME',
    label: 'Stakes',
    title: 'Control of the OASIS',
    summary:
      "Control of the OASIS (basically civilization), Wade's actual life, and whether winning even matters if you lose the real world.",
    body: [
      "Control of the OASIS (basically civilization), Wade's actual life, and whether winning even matters if you lose the real world.",
    ],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_social-structure', 'se_wade'],
  },

  // --- World ---
  {
    id: 'se_time-period',
    pillar: 'WORLD',
    label: 'Time Period',
    title: '2045',
    summary: "2045 — everything's kind of falling apart.",
    body: ["2045 — everything's kind of falling apart."],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_natural-env', 'se_tech-level'],
  },
  {
    id: 'se_location',
    pillar: 'WORLD',
    label: 'Location',
    title: 'The Stacks & the OASIS',
    summary:
      'The stacks (Oklahoma City) and the OASIS — two worlds, one crumbling, one infinite.',
    body: ['The stacks (Oklahoma City) and the OASIS — two worlds, one crumbling, one infinite.'],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_atmosphere', 'se_arch-exterior'],
  },
  {
    id: 'se_arch-exterior',
    pillar: 'WORLD',
    label: 'Architecture — Exterior',
    title: 'Vertical Poverty',
    summary: 'Trailers stacked on top of each other — rusty, precarious, vertical poverty.',
    body: ['Trailers stacked on top of each other — rusty, precarious, vertical poverty.'],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_social-structure', 'se_location'],
  },
  {
    id: 'se_arch-interior',
    pillar: 'WORLD',
    label: 'Architecture — Interior',
    title: "Wade's Hideout",
    summary: "Wade's hideout is a gutted van in a junkyard, packed with scavenged gear.",
    body: ["Wade's hideout is a gutted van in a junkyard, packed with scavenged gear."],
    creativeTag: 'EVOLVE',
    definition: null,
    relatedIds: ['se_wade', 'se_arch-exterior'],
  },
  {
    id: 'se_natural-env',
    pillar: 'WORLD',
    label: 'Natural Environment',
    title: 'A Used-Up Earth',
    summary: 'The real world is used up — energy crisis, climate mess. The OASIS can be anything.',
    body: ['The real world is used up — energy crisis, climate mess. The OASIS can be anything.'],
    creativeTag: 'SET_ASIDE',
    definition: null,
    relatedIds: ['se_time-period', 'se_tech-level'],
  },
  {
    id: 'se_social-structure',
    pillar: 'WORLD',
    label: 'Social Structure',
    title: 'IOI & the Gunters',
    summary:
      'Massive inequality. IOI runs everything. Gunters are the subculture of obsessive egg hunters.',
    body: [
      'Massive inequality. IOI runs everything. Gunters are the subculture of obsessive egg hunters.',
    ],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_stakes', 'se_sorrento'],
  },
  {
    id: 'se_tech-level',
    pillar: 'WORLD',
    label: 'Technology Level',
    title: 'Broken World, Perfect VR',
    summary:
      'VR is incredible — haptic suits, full immersion — but real-world infrastructure is broken.',
    body: ['VR is incredible — haptic suits, full immersion — but real-world infrastructure is broken.'],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_time-period', 'se_atmosphere'],
  },
  {
    id: 'se_atmosphere',
    pillar: 'WORLD',
    label: 'Atmosphere / Mood',
    title: 'Grimy vs. Limitless',
    summary: 'The real world feels grimy and stuck. The OASIS feels limitless and nostalgic.',
    body: ['The real world feels grimy and stuck. The OASIS feels limitless and nostalgic.'],
    creativeTag: 'EVOLVE',
    definition: null,
    relatedIds: ['se_tone', 'se_location', 'se_theme'],
  },
  {
    id: 'se_key-objects',
    pillar: 'WORLD',
    label: 'Key Objects',
    title: 'The Three Keys',
    summary: "The three keys, Anorak's Almanac, and the extra-life quarter.",
    body: ["The three keys, Anorak's Almanac, and the extra-life quarter."],
    creativeTag: 'SET_ASIDE',
    definition: null,
    relatedIds: ['se_motif', 'se_stakes'],
  },

  // --- Character (body renders as bullets) ---
  {
    id: 'se_wade',
    pillar: 'CHARACTER',
    label: 'Wade Watts',
    title: 'Wade Watts / Parzival',
    summary:
      'An obsessive teenage gunter who lives inside the OASIS to escape a life that has left him behind.',
    body: [
      'Age — 18, just barely an adult',
      'Physical Build — out of shape; he basically lives in a chair',
      'Personality — obsessive about the hunt, lonely underneath it all',
      'Behavior — almost never leaves the OASIS; the real world is just where his body sits',
      'Motivation — win the contest, but also prove he matters and escape the stacks',
      'Fear / Weakness — being seen as he actually is: broke, overweight, nobody',
      "Background — parents gone, aunt doesn't care; raised himself in a junkyard hideout",
      'Knowledge — knows more about 1980s pop culture than anyone alive, self-taught',
      'Fashion — his avatar is curated and cool; real life is whatever he can find',
      'Relationship Role — reluctant leader of the group, unsure how to be a friend',
    ],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_theme', 'se_art3mis', 'se_arch-interior'],
  },
  {
    id: 'se_art3mis',
    pillar: 'CHARACTER',
    label: 'Art3mis',
    title: 'Art3mis / Samantha',
    summary: 'A famous gunter who cares about fixing the real world more than winning it.',
    body: [
      'Personality — sharp, guarded; cares about the real world more than Wade does',
      "Motivation — the money isn't the point; she wants to actually fix things",
      "Relationship Role — love interest, and the one who challenges Wade's worldview",
    ],
    creativeTag: 'CORE',
    definition: null,
    relatedIds: ['se_wade', 'se_theme'],
  },
  {
    id: 'se_aech',
    pillar: 'CHARACTER',
    label: 'Aech',
    title: 'Aech / Helen',
    summary: 'Wade’s closest friend and the most human connection he has.',
    body: [
      'Personality — loyal, funny, keeps things grounded',
      'Relationship Role — best friend; the most human connection Wade has',
    ],
    creativeTag: 'EVOLVE',
    definition: null,
    relatedIds: ['se_wade'],
  },
  {
    id: 'se_sorrento',
    pillar: 'CHARACTER',
    label: 'Sorrento',
    title: 'Nolan Sorrento',
    summary: 'The IOI executive hunting the egg to put the OASIS behind a paywall.',
    body: [
      "Personality — corporate, dangerous; doesn't understand the culture he's trying to own",
      'Motivation — control the OASIS and monetize everything',
    ],
    creativeTag: 'EVOLVE',
    definition: null,
    relatedIds: ['se_social-structure', 'se_stakes'],
  },
  {
    id: 'se_halliday',
    pillar: 'CHARACTER',
    label: 'Halliday',
    title: 'James Halliday / Anorak',
    summary:
      'The late creator of the OASIS, whose contest is really a search for someone who understands him.',
    body: [
      'Personality — genius, awkward, deeply lonely',
      'Motivation — find someone who gets it; someone who loved what he loved',
    ],
    creativeTag: 'SET_ASIDE',
    definition: null,
    relatedIds: ['se_subtext', 'se_key-objects'],
  },
];
