/**
 * Default ConceptType definitions.
 *
 * Seeded into every new project. 41 total: 11 World + 13 Character + 9 Conflict + 8 Storyline.
 *
 * Source of truth: docs/foundation/Spec_DataModel.md §14.
 */

import type { Dimension } from './types';

export interface DefaultConceptTypeDef {
  codeKey: string;
  label: string;
  description: string;
  dimension: Dimension;
}

export const DEFAULT_CONCEPT_TYPES: readonly DefaultConceptTypeDef[] = [
  // World (11)
  { codeKey: 'timePeriod', label: 'Time Period', description: 'When the world exists', dimension: 'WORLD' },
  { codeKey: 'location', label: 'Location', description: 'Where the world exists (macro and micro)', dimension: 'WORLD' },
  { codeKey: 'visualStyle', label: 'Visual Style', description: 'The overall aesthetic language', dimension: 'WORLD' },
  { codeKey: 'architectureExterior', label: 'Architecture — Exterior', description: 'Building exteriors, cityscapes, skylines', dimension: 'WORLD' },
  { codeKey: 'architectureInterior', label: 'Architecture — Interior', description: 'Interior spaces, furnishing style', dimension: 'WORLD' },
  { codeKey: 'naturalEnvironment', label: 'Natural Environment', description: 'Landscape, climate, weather, flora, fauna', dimension: 'WORLD' },
  { codeKey: 'keyObjects', label: 'Key Objects', description: 'Significant objects in the world', dimension: 'WORLD' },
  { codeKey: 'transportation', label: 'Transportation', description: 'How people and things move', dimension: 'WORLD' },
  { codeKey: 'technologyLevel', label: 'Technology Level', description: "What technology exists and how it's used", dimension: 'WORLD' },
  { codeKey: 'socialStructure', label: 'Social Structure', description: 'How society is organized', dimension: 'WORLD' },
  { codeKey: 'atmosphereMood', label: 'Atmosphere / Mood', description: 'The emotional texture of the world', dimension: 'WORLD' },

  // Character (13)
  { codeKey: 'gender', label: 'Gender', description: 'Gender identity and presentation', dimension: 'CHARACTER' },
  { codeKey: 'age', label: 'Age', description: 'Age or age range', dimension: 'CHARACTER' },
  { codeKey: 'physicalBuild', label: 'Physical Build', description: 'Height, weight, body type', dimension: 'CHARACTER' },
  { codeKey: 'facialFeatures', label: 'Facial Features', description: 'Face shape, eyes, hair, distinguishing marks', dimension: 'CHARACTER' },
  { codeKey: 'fashionStyle', label: 'Fashion Style', description: 'Clothing, accessories, aesthetic', dimension: 'CHARACTER' },
  { codeKey: 'voiceSpeech', label: 'Voice & Speech', description: 'How they sound and how they talk', dimension: 'CHARACTER' },
  { codeKey: 'personalityTrait', label: 'Personality Trait', description: 'Psychological characteristics', dimension: 'CHARACTER' },
  { codeKey: 'behavioralPattern', label: 'Behavioral Pattern', description: 'How they act in the world', dimension: 'CHARACTER' },
  { codeKey: 'knowledgeEducation', label: 'Knowledge & Education', description: 'What they know and how they learned it', dimension: 'CHARACTER' },
  { codeKey: 'motivation', label: 'Motivation', description: 'What drives them', dimension: 'CHARACTER' },
  { codeKey: 'fearWeakness', label: 'Fear / Weakness', description: 'What limits or threatens them', dimension: 'CHARACTER' },
  { codeKey: 'relationshipRole', label: 'Relationship Role', description: 'How they relate to other characters', dimension: 'CHARACTER' },
  { codeKey: 'background', label: 'Background', description: 'Origin story, key life events', dimension: 'CHARACTER' },

  // Conflict (9)
  { codeKey: 'centralConflict', label: 'Central Conflict', description: 'The core tension driving the story', dimension: 'CONFLICT' },
  { codeKey: 'internalConflict', label: 'Internal Conflict', description: 'Tension within a character', dimension: 'CONFLICT' },
  { codeKey: 'interpersonalConflict', label: 'Interpersonal Conflict', description: 'Tension between characters', dimension: 'CONFLICT' },
  { codeKey: 'societalConflict', label: 'Societal Conflict', description: 'Tension between characters and the world', dimension: 'CONFLICT' },
  { codeKey: 'stakes', label: 'Stakes', description: "What's at risk", dimension: 'CONFLICT' },
  { codeKey: 'catalyst', label: 'Catalyst', description: 'What sets the conflict in motion', dimension: 'CONFLICT' },
  { codeKey: 'escalation', label: 'Escalation', description: 'How tension increases over time', dimension: 'CONFLICT' },
  { codeKey: 'theme', label: 'Theme', description: 'The abstract ideas the story explores', dimension: 'CONFLICT' },
  { codeKey: 'subtext', label: 'Subtext', description: "What's being said beneath the surface", dimension: 'CONFLICT' },

  // Storyline (8) — available in Refinement
  { codeKey: 'storyArc', label: 'Story Arc', description: 'The macro shape of the narrative', dimension: 'STORYLINE' },
  { codeKey: 'plot', label: 'Plot', description: 'The sequence of major events', dimension: 'STORYLINE' },
  { codeKey: 'plotTwist', label: 'Plot Twist', description: 'Surprising revelations or reversals', dimension: 'STORYLINE' },
  { codeKey: 'subPlot', label: 'Sub-plot', description: 'Secondary narrative threads', dimension: 'STORYLINE' },
  { codeKey: 'conflictType', label: 'Conflict Type', description: 'The nature of the central tension (synthesis of Conflict dimension)', dimension: 'STORYLINE' },
  { codeKey: 'tone', label: 'Tone', description: 'The narrative voice and feel', dimension: 'STORYLINE' },
  { codeKey: 'pacing', label: 'Pacing', description: 'How time moves in the story', dimension: 'STORYLINE' },
  { codeKey: 'narrativePov', label: 'Narrative POV', description: 'Whose perspective the story is told from', dimension: 'STORYLINE' },
] as const;
