/**
 * Chat Engine — custom ConceptType creation (Phase 5).
 *
 * AI-initiated type creation (§7.1) is exercised by `extraction.test.ts`.
 * Phase 5 adds the *user-initiated* path (§7.2): "Create a Concept Type
 * called Signature Weapon for characters." The model is prompted to route
 * this through `suggestedNewTypes`, so the same parser + applier pipeline
 * handles it end-to-end. These tests verify that integration plus the prompt
 * guidance that drives the model's behavior.
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §7.1, §7.2, §13.
 */

import { createConceptType } from '../../../models/factories';

import { applyConceptExtraction } from '../extraction';
import { parseExtractionResponse } from '../parser';
import { buildPhasePrompt } from '../prompts';

const PROJECT_ID = 'proj_test';

describe('Phase 5 — user-initiated ConceptType creation (§7.2)', () => {
  // Simulated AI response to: "Create a Concept Type called Signature Weapon for characters."
  // The Development prompt instructs the model to route type-creation requests
  // through `suggestedNewTypes` and confirm in the chat reply.
  const aiResponse = [
    "Done — Signature Weapon is now available as a Character concept type.",
    '',
    '```json',
    JSON.stringify({
      suggestedNewTypes: [
        {
          label: 'Signature Weapon',
          description: 'A weapon associated with a specific character',
          dimension: 'CHARACTER',
        },
      ],
    }),
    '```',
  ].join('\n');

  it('parses and applies the request end-to-end, creating the type with isDefault:false', () => {
    const parsed = parseExtractionResponse(aiResponse);
    expect(parsed.parseError).toBeNull();
    expect(parsed.suggestedNewTypes).toHaveLength(1);
    expect(parsed.chatResponse).toContain('Signature Weapon');

    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: 'msg_user_request',
      conceptTypes: [],
      concepts: [],
      now: () => '2026-05-18T12:00:00.000Z',
    });

    expect(out.newConceptTypes).toHaveLength(1);
    const [created] = out.newConceptTypes;
    expect(created.label).toBe('Signature Weapon');
    expect(created.dimension).toBe('CHARACTER');
    expect(created.isDefault).toBe(false);
    expect(out.warnings).toEqual([]);
  });

  it('allows a concept to be extracted against the newly created type in the same response', () => {
    // User says: "Create a Signature Weapon type for characters, and give her a custom curved dagger."
    const response = [
      "Done — Signature Weapon is now available, and I've captured the dagger as her weapon.",
      '',
      '```json',
      JSON.stringify({
        suggestedNewTypes: [
          { label: 'Signature Weapon', description: 'Weapon tied to a character', dimension: 'CHARACTER' },
        ],
        concepts: [
          { conceptTypeLabel: 'Signature Weapon', value: 'A custom curved dagger', dimension: 'CHARACTER' },
        ],
      }),
      '```',
    ].join('\n');

    const parsed = parseExtractionResponse(response);
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: 'msg_user_request',
      conceptTypes: [],
      concepts: [],
    });

    expect(out.newConceptTypes).toHaveLength(1);
    expect(out.newConcepts).toHaveLength(1);
    expect(out.newConcepts[0].conceptTypeId).toBe(out.newConceptTypes[0].id);
    expect(out.newConcepts[0].versions[0].value).toBe('A custom curved dagger');
  });

  it('rejects a user-initiated request that duplicates an existing label (case-insensitive)', () => {
    // User asks for "time period" but Time Period already exists.
    const existing = createConceptType({
      projectId: PROJECT_ID,
      label: 'Time Period',
      description: 'When the world exists',
      dimension: 'WORLD',
      isDefault: true,
      now: '2026-05-01T00:00:00.000Z',
    });
    const response =
      '```json\n{"suggestedNewTypes":[{"label":"time period","description":"x","dimension":"WORLD"}]}\n```';

    const parsed = parseExtractionResponse(response);
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [existing],
      concepts: [],
    });

    expect(out.newConceptTypes).toEqual([]);
    expect(out.warnings.map((w) => w.reason)).toEqual(['DUPLICATE_TYPE']);
  });

  it('makes a newly created type immediately available for refinement updates', () => {
    // Two-turn flow simulated in a single applier call: type created, then
    // an updatedConcept hopefully would... actually `updatedConcepts` requires
    // an existing Concept of that type, so this scenario verifies that a brand
    // new type with no concepts yet returns NO_CONCEPT_OF_TYPE rather than
    // UNKNOWN_TYPE — proving the type was registered before the update phase.
    const response = [
      '```json',
      JSON.stringify({
        suggestedNewTypes: [
          { label: 'Signature Weapon', description: 'Weapon tied to a character', dimension: 'CHARACTER' },
        ],
        updatedConcepts: [
          { existingConceptType: 'Signature Weapon', newValue: 'a curved dagger', editType: 'REFINE' },
        ],
      }),
      '```',
    ].join('\n');

    const parsed = parseExtractionResponse(response);
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [],
      concepts: [],
    });

    expect(out.newConceptTypes).toHaveLength(1);
    expect(out.warnings.map((w) => w.reason)).toEqual(['NO_CONCEPT_OF_TYPE']);
  });
});

describe('Phase 5 — Development prompt guidance', () => {
  // We test the prompt content directly so the §7 guardrails can't silently
  // drift away from the spec. The model is the thing that has to follow them,
  // but the prompt is the contract we control.
  const prompt = buildPhasePrompt('DEVELOPMENT', { activeDimension: 'CHARACTER' });

  it('explicitly addresses user-initiated type-creation requests (§7.2)', () => {
    expect(prompt).toMatch(/User-initiated/i);
    expect(prompt).toMatch(/create a concept type called/i);
  });

  it('requires Title Case labels per HARD_RULES', () => {
    expect(prompt).toMatch(/Title Case/);
  });

  it('includes the near-duplicate guardrail from §7.1', () => {
    expect(prompt).toMatch(/Clothing Style/);
    expect(prompt).toMatch(/Fashion Style/);
  });

  it('confirms new types are immediately usable in the same response (§5.3)', () => {
    expect(prompt).toMatch(/immediately/i);
  });
});
