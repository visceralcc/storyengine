/**
 * Default ConceptType definitions.
 *
 * Seeded into every new project. 29 total: 11 World + 13 Character + 5 Theme.
 *
 * Source of truth: docs/foundation/Spec_DataModel.md §14 (v0.3).
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

  // Theme (5)
  { codeKey: 'theme', label: 'Theme', description: 'The abstract ideas the story explores — freedom vs. duty, the cost of truth, identity', dimension: 'THEME' },
  { codeKey: 'tone', label: 'Tone', description: 'The narrative voice and emotional register — darkly comic, melancholy, hopeful, tense', dimension: 'THEME' },
  { codeKey: 'subtext', label: 'Subtext', description: "What's being said beneath the surface of scenes, dialogue, and relationships", dimension: 'THEME' },
  { codeKey: 'motifSymbol', label: 'Motif / Symbol', description: 'Recurring images, objects, or patterns that carry meaning — the locked gate, seasonal decay', dimension: 'THEME' },
  { codeKey: 'stakes', label: 'Stakes', description: "What's at risk — the family estate, a relationship, someone's sense of self", dimension: 'THEME' },
] as const;
