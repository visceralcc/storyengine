/**
 * Chat Engine — Phase 7 Refinement chat integration tests.
 *
 * The Refinement system prompt (§4.3) and the Storyline ConceptType context
 * widening (§3.2 "Refinement context: Same as Development, plus Storyline
 * ConceptTypes") both shipped with Phase 2. Phase 7 verifies the end-to-end
 * flow:
 *
 *   1. Seeded Storyline ConceptTypes are visible to the Refinement context
 *   2. A simulated Refinement AI response extracts Storyline concepts that
 *      land on the correct ConceptType with `dimension: STORYLINE`
 *   3. The system prompt for Refinement carries the §4.3 editorial-voice
 *      signals (not just the Development copy)
 *
 * What we cannot unit-test: the AI's actual editorial behavior at runtime —
 * that's a model concern. We test that the prompt and context it receives
 * are correct.
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §3.2, §4.3, §13 Phase 7.
 */

import { createProject, seedDefaultConceptTypes } from '../../../models/factories';

import {
  assembleSystemPrompt,
  buildDevelopmentContext,
  formatDevelopmentContextBlock,
} from '../context';
import { applyConceptExtraction } from '../extraction';
import { parseExtractionResponse } from '../parser';
import { buildPhasePrompt } from '../prompts';

const PROJECT_ID = 'proj_test';

describe('Phase 7 — Refinement context widening (§3.2)', () => {
  it('exposes both the active dimension AND Storyline ConceptTypes when phase=REFINEMENT', () => {
    const project = createProject({ name: 'Test Story', now: '2026-05-01T00:00:00.000Z' });
    const seeded = seedDefaultConceptTypes(project.id, '2026-05-01T00:00:00.000Z');

    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts: [],
      conceptTypes: seeded,
      discoveryNotes: [],
      phase: 'REFINEMENT',
    });

    const dimensions = new Set(ctx.conceptTypes.map((t) => t.dimension));
    // CHARACTER from active + STORYLINE from refinement widening — no WORLD / CONFLICT.
    expect(dimensions).toEqual(new Set(['CHARACTER', 'STORYLINE']));

    // The eight default Storyline types from defaults.ts should all be present.
    const storylineLabels = ctx.conceptTypes
      .filter((t) => t.dimension === 'STORYLINE')
      .map((t) => t.label)
      .sort();
    expect(storylineLabels).toEqual([
      'Conflict Type',
      'Narrative POV',
      'Pacing',
      'Plot',
      'Plot Twist',
      'Story Arc',
      'Sub-plot',
      'Tone',
    ]);
  });

  it('excludes Storyline types in DEVELOPMENT (only active dimension)', () => {
    const project = createProject({ name: 'P', now: '2026-05-01T00:00:00.000Z' });
    const seeded = seedDefaultConceptTypes(project.id, '2026-05-01T00:00:00.000Z');

    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts: [],
      conceptTypes: seeded,
      discoveryNotes: [],
      phase: 'DEVELOPMENT',
    });

    const dimensions = new Set(ctx.conceptTypes.map((t) => t.dimension));
    expect(dimensions).toEqual(new Set(['CHARACTER']));
  });
});

describe('Phase 7 — end-to-end Storyline concept extraction', () => {
  it('parses + applies a Storyline AI response, attaching the new Concept to the right ConceptType', () => {
    const project = createProject({ name: 'P', now: '2026-05-01T00:00:00.000Z' });
    const seeded = seedDefaultConceptTypes(project.id, '2026-05-01T00:00:00.000Z');

    // Simulated Refinement-phase AI response: user described arc + tone +
    // narrative POV; AI extracts three Storyline concepts.
    const response = [
      "Captured those — the arc and tone read as deliberate. One thing I'd push on: does the first-person POV serve the dual timeline you just described?",
      '',
      '```json',
      JSON.stringify({
        concepts: [
          {
            conceptTypeLabel: 'Story Arc',
            value: 'Coming-of-age — escape from inheritance to self-defined identity',
            dimension: 'STORYLINE',
          },
          {
            conceptTypeLabel: 'Tone',
            value: 'Melancholic but hopeful — golden-hour memory of trauma',
            dimension: 'STORYLINE',
          },
          {
            conceptTypeLabel: 'Narrative POV',
            value: 'First-person retrospective, present-tense flashbacks',
            dimension: 'STORYLINE',
          },
        ],
      }),
      '```',
    ].join('\n');

    const parsed = parseExtractionResponse(response);
    expect(parsed.parseError).toBeNull();
    expect(parsed.concepts).toHaveLength(3);

    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: 'msg_refinement',
      conceptTypes: seeded,
      concepts: [],
      now: () => '2026-05-18T12:00:00.000Z',
    });

    expect(out.warnings).toEqual([]);
    expect(out.newConcepts).toHaveLength(3);

    const labelToType = new Map(seeded.map((t) => [t.label, t]));
    for (const c of out.newConcepts) {
      expect(c.dimension).toBe('STORYLINE');
      const expectedType = [...labelToType.values()].find((t) => t.id === c.conceptTypeId);
      expect(expectedType?.dimension).toBe('STORYLINE');
      expect(c.versions).toHaveLength(1);
      expect(c.versions[0].versionNumber).toBe(1);
      expect(c.sourceMessageId).toBe('msg_refinement');
    }

    const createdLabels = out.newConcepts
      .map((c) => labelToType.get([...labelToType.entries()].find(([, t]) => t.id === c.conceptTypeId)?.[0] ?? '')?.label)
      .sort();
    expect(createdLabels).toEqual(['Narrative POV', 'Story Arc', 'Tone']);
  });

  it('correctly handles a Refinement response that updates a Character concept (§4.3 rule 4)', () => {
    // §4.3 rule 4: "Continue to refine World, Character, and Conflict concepts
    // as needed." Refinement isn't Storyline-only.
    const project = createProject({ name: 'P', now: '2026-05-01T00:00:00.000Z' });
    const seeded = seedDefaultConceptTypes(project.id, '2026-05-01T00:00:00.000Z');
    const motivation = seeded.find((t) => t.label === 'Motivation');
    if (!motivation) throw new Error('seed missing Motivation');

    // Existing Character concept the user wants to refine during Refinement
    const { createConcept } = require('../../../models/factories');
    const existing = createConcept({
      projectId: PROJECT_ID,
      conceptTypeId: motivation.id,
      dimension: 'CHARACTER',
      value: 'proving father wrong',
      now: '2026-05-10T00:00:00.000Z',
    });

    const response =
      '```json\n{"updatedConcepts":[{"existingConceptType":"Motivation","newValue":"reclaiming the version of herself her father erased","editType":"REFINE"}]}\n```';

    const parsed = parseExtractionResponse(response);
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: 'msg_refinement',
      conceptTypes: seeded,
      concepts: [existing],
      now: () => '2026-05-18T12:00:00.000Z',
    });

    expect(out.refinedConcepts).toHaveLength(1);
    expect(out.refinedConcepts[0].updatedConcept.versions[0].value).toBe(
      'reclaiming the version of herself her father erased',
    );
  });
});

describe('Phase 7 — Refinement prompt content (§4.3)', () => {
  const prompt = buildPhasePrompt('REFINEMENT');

  it('identifies the phase explicitly', () => {
    expect(prompt).toContain('PHASE: REFINEMENT');
  });

  it('lists the eight Storyline ConceptTypes by name (§4.3 STORYLINE EXTRACTION)', () => {
    expect(prompt).toContain('Story Arc');
    expect(prompt).toContain('Plot');
    expect(prompt).toContain('Plot Twist');
    expect(prompt).toContain('Sub-plot');
    expect(prompt).toContain('Conflict Type');
    expect(prompt).toContain('Tone');
    expect(prompt).toContain('Pacing');
    expect(prompt).toContain('Narrative POV');
  });

  it('signals the editorial voice shift (§4.3 EDITORIAL VOICE)', () => {
    expect(prompt).toContain('EDITORIAL VOICE');
    expect(prompt).toMatch(/editor, not just a collaborator/i);
    expect(prompt).toMatch(/push back gently/i);
  });

  it('preserves the §5.2 response-format protocol (same as Development)', () => {
    expect(prompt).toContain('"concepts"');
    expect(prompt).toContain('"updatedConcepts"');
    expect(prompt).toContain('"suggestedNewTypes"');
  });

  it('differs from the Development prompt — not a copy-paste', () => {
    const development = buildPhasePrompt('DEVELOPMENT', { activeDimension: 'CHARACTER' });
    expect(prompt).not.toContain('PHASE: DEVELOPMENT');
    expect(prompt).not.toContain('ACTIVE DIMENSION');
    expect(development).not.toContain('EDITORIAL VOICE');
  });
});

describe('Phase 7 — assembled Refinement system prompt', () => {
  it('layers identity + Refinement prompt + Refinement-shaped project context', () => {
    const project = createProject({ name: 'Test Story', now: '2026-05-01T00:00:00.000Z' });
    const seeded = seedDefaultConceptTypes(project.id, '2026-05-01T00:00:00.000Z');
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts: [],
      conceptTypes: seeded,
      discoveryNotes: [],
      phase: 'REFINEMENT',
    });
    const block = formatDevelopmentContextBlock(ctx);
    const system = assembleSystemPrompt({
      phase: 'REFINEMENT',
      projectContextBlock: block,
      activeDimension: 'CHARACTER',
    });

    // Phase prompt picked correctly
    expect(system).toContain('PHASE: REFINEMENT');
    expect(system).toContain('EDITORIAL VOICE');

    // Storyline types surface in the context block
    expect(system).toContain('Story Arc (STORYLINE)');
    expect(system).toContain('Narrative POV (STORYLINE)');
  });
});
