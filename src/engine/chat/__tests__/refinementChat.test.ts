/**
 * Chat Engine — Phase 7 Refinement chat integration tests.
 *
 * Per Spec_ChatEngine v0.2 (§3.2, §4.3): Refinement uses the same three
 * dimensions as Development (WORLD | CHARACTER | THEME). There is no
 * Storyline dimension or Storyline ConceptType widening; narrative-structure
 * work (arcs, beats, pacing) lives in the Refinement beat framework, a
 * separate system not managed through ConceptTypes.
 *
 * Phase 7 verifies:
 *   1. The Refinement context block includes the active dimension's
 *      ConceptTypes (and, when callers ask, all three dimensions)
 *   2. A simulated Refinement AI response extracts Theme concepts that land
 *      on the correct ConceptType with `dimension: THEME`
 *   3. The §4.3 system prompt carries the editorial-voice signals — and no
 *      stale Storyline / Conflict-as-dimension language remains
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

describe('Phase 7 — Refinement context (§3.2)', () => {
  it('exposes the active dimension only by default — same filter as Development', () => {
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
    expect(dimensions).toEqual(new Set(['CHARACTER']));
  });

  it('lets callers surface all three dimensions in Refinement via includeConceptType', () => {
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
      includeConceptType: () => true,
    });

    const dimensions = new Set(ctx.conceptTypes.map((t) => t.dimension));
    expect(dimensions).toEqual(new Set(['WORLD', 'CHARACTER', 'THEME']));

    // The five default Theme types from defaults.ts should all be present.
    const themeLabels = ctx.conceptTypes
      .filter((t) => t.dimension === 'THEME')
      .map((t) => t.label)
      .sort();
    expect(themeLabels).toEqual(['Motif / Symbol', 'Stakes', 'Subtext', 'Theme', 'Tone']);
  });
});

describe('Phase 7 — end-to-end Theme concept extraction', () => {
  it('parses + applies a Refinement AI response, attaching new Theme concepts to the right ConceptType', () => {
    const project = createProject({ name: 'P', now: '2026-05-01T00:00:00.000Z' });
    const seeded = seedDefaultConceptTypes(project.id, '2026-05-01T00:00:00.000Z');

    // Simulated Refinement-phase AI response: user described the meaning
    // layer of their story; AI extracts three Theme concepts.
    const response = [
      "Those threads cohere nicely — the gate and the inheritance speak to the same idea about who gets to choose. One thing I'd push on: does the tone hold steady all the way through?",
      '',
      '```json',
      JSON.stringify({
        concepts: [
          {
            conceptTypeLabel: 'Theme',
            value: 'The cost of self-definition when inheritance demands sameness',
            dimension: 'THEME',
          },
          {
            conceptTypeLabel: 'Tone',
            value: 'Melancholic but hopeful — golden-hour memory of trauma',
            dimension: 'THEME',
          },
          {
            conceptTypeLabel: 'Motif / Symbol',
            value: 'The locked gate — what she cannot escape vs. what she chooses to leave behind',
            dimension: 'THEME',
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

    const typesById = new Map(seeded.map((t) => [t.id, t]));
    for (const c of out.newConcepts) {
      expect(c.dimension).toBe('THEME');
      const matchingType = typesById.get(c.conceptTypeId);
      expect(matchingType?.dimension).toBe('THEME');
      expect(c.versions).toHaveLength(1);
      expect(c.versions[0].versionNumber).toBe(1);
      expect(c.sourceMessageId).toBe('msg_refinement');
    }

    const createdLabels = out.newConcepts
      .map((c) => typesById.get(c.conceptTypeId)?.label)
      .filter((l): l is string => l !== undefined)
      .sort();
    expect(createdLabels).toEqual(['Motif / Symbol', 'Theme', 'Tone']);
  });

  it('refines an existing Character concept during Refinement (§4.3 rule 3)', () => {
    // §4.3 rule 3: "Continue to extract new concepts when the user describes
    // ideas that don't have cards yet." Refinement also keeps refining
    // existing World/Character/Theme concepts.
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

  it('names the three current dimensions (World, Character, Theme) — not Conflict or Storyline', () => {
    expect(prompt).toContain('World, Character, and Theme');
    expect(prompt).not.toMatch(/Storyline/i);
    // "Conflict" may legitimately appear as a probing-question topic elsewhere,
    // but the Refinement prompt should not name a Conflict *dimension*.
    expect(prompt).not.toMatch(/and Conflict\./);
  });

  it('has no Storyline-extraction or Storyline-ConceptType language', () => {
    expect(prompt).not.toMatch(/STORYLINE EXTRACTION/i);
    expect(prompt).not.toContain('Story Arc');
    expect(prompt).not.toContain('Plot Twist');
    expect(prompt).not.toContain('Sub-plot');
    expect(prompt).not.toContain('Narrative POV');
    expect(prompt).not.toContain('Conflict Type');
    expect(prompt).not.toContain('Pacing');
  });

  it('signals the editorial voice shift (§4.3 EDITORIAL VOICE)', () => {
    expect(prompt).toContain('EDITORIAL VOICE');
    expect(prompt).toMatch(/editor, not just a collaborator/i);
    expect(prompt).toMatch(/push back gently/i);
  });

  it('connects Theme to Character and World concepts (§4.3 editorial cross-dimension)', () => {
    expect(prompt).toMatch(/theme/i);
    expect(prompt).toMatch(/(tone|subtext|motifs)/i);
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
  it('layers identity + Refinement prompt + project context including all three dimensions when requested', () => {
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
      includeConceptType: () => true,
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

    // Theme types surface in the context block
    expect(system).toContain('Theme (THEME)');
    expect(system).toContain('Tone (THEME)');
    expect(system).toContain('Motif / Symbol (THEME)');

    // No stale Storyline language leaks through
    expect(system).not.toMatch(/STORYLINE/);
    expect(system).not.toContain('Story Arc');
  });
});
