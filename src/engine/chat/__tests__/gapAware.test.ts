/**
 * Chat Engine — Phase 6 gap-aware conversation integration tests.
 *
 * Verifies the full Discovery → Development pipeline:
 *   1. Discovery notes + consolidation produces gap analysis + creative gravity
 *   2. buildDevelopmentContext lifts that state into the chat context
 *   3. formatDevelopmentContextBlock renders Strong/Partial/Unrepresented buckets
 *   4. assembleSystemPrompt layers identity → phase instructions → project context
 *
 * The piece this test cannot exercise is the AI's behavior (avoiding STRONG
 * topics, surfacing gaps naturally). That's a runtime/model concern. What we
 * CAN verify is that the prompt the model receives carries the information it
 * needs to behave that way.
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §9, §13 Phase 6.
 */

import { createDiscoveryNote, createProject } from '../../../models/factories';

import {
  assembleSystemPrompt,
  buildDevelopmentContext,
  formatDevelopmentContextBlock,
} from '../context';
import { buildPhasePrompt } from '../prompts';
import type { GapAnalysis } from '../../../models/types';

describe('Phase 6 — gap-aware Development chat (§9)', () => {
  // Realistic gap analysis: STRONG on Time Period + Location, PARTIAL on
  // Architecture, Motivation + Fear unrepresented. Models the spec's running
  // example (1820s France protagonist).
  const gapAnalysis: GapAnalysis = {
    represented: [
      { conceptTypeCodeKey: 'timePeriod', dimension: 'WORLD', confidence: 'STRONG', sourceNoteIds: [] },
      { conceptTypeCodeKey: 'location', dimension: 'WORLD', confidence: 'STRONG', sourceNoteIds: [] },
      { conceptTypeCodeKey: 'architectureExterior', dimension: 'WORLD', confidence: 'PARTIAL', sourceNoteIds: [] },
    ],
    unrepresented: ['motivation', 'fearWeakness'],
  };

  it('produces a system prompt that carries gap state into the model context', () => {
    const project = createProject({ name: 'Test Story', now: '2026-05-01T00:00:00.000Z' });
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis,
      concepts: [],
      conceptTypes: [],
      discoveryNotes: [],
    });
    const block = formatDevelopmentContextBlock(ctx);
    const system = assembleSystemPrompt({
      phase: 'DEVELOPMENT',
      projectContextBlock: block,
      activeDimension: 'CHARACTER',
    });

    // (a) Phase prompt with active dimension substituted in
    expect(system).toContain('PHASE: DEVELOPMENT');
    expect(system).toContain('ACTIVE DIMENSION: CHARACTER');

    // (b) GAP EXPLORATION instructions (§9.2) — the AI's how-to-use guidance
    expect(system).toMatch(/GAP EXPLORATION/);
    expect(system).toMatch(/STRONG coverage[\s\S]*don't re-ask/i);

    // (c) Concrete gap buckets — what the AI knows about THIS project
    expect(system).toContain('Strong coverage: Time Period, Location');
    expect(system).toContain('Partial coverage: Architecture — Exterior');
    expect(system).toContain('Unrepresented: Motivation, Fear / Weakness');
  });

  it('§9.1 + §9.2 work together: the prompt has both the gap rules AND the gap data', () => {
    // Defensive: make sure formatDevelopmentContextBlock and buildPhasePrompt
    // contribute to the same final system prompt, and neither overwrites the
    // other.
    const project = createProject({ name: 'P', now: '2026-05-01T00:00:00.000Z' });
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'WORLD',
      gapAnalysis,
      concepts: [],
      conceptTypes: [],
      discoveryNotes: ['1820s France', 'rural Provence', 'crumbling mansion'].map((content) =>
        createDiscoveryNote({
          projectId: project.id,
          position: { x: 0, y: 0 },
          content,
          now: '2026-05-02T00:00:00.000Z',
        }),
      ),
    });
    const block = formatDevelopmentContextBlock(ctx);
    const phasePrompt = buildPhasePrompt('DEVELOPMENT', { activeDimension: 'WORLD' });
    const system = assembleSystemPrompt({
      phase: 'DEVELOPMENT',
      projectContextBlock: block,
      activeDimension: 'WORLD',
    });

    expect(system).toContain(phasePrompt);
    expect(system).toContain(block);
  });

  it('handles a project with no gap analysis yet (Discovery never consolidated)', () => {
    // Pre-consolidation: gravity is null, gapAnalysis is null. The system
    // prompt should still assemble cleanly — Development can be visited
    // before consolidation, just without the gap section.
    const project = createProject({ name: 'P', now: '2026-05-01T00:00:00.000Z' });
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts: [],
      conceptTypes: [],
      discoveryNotes: [],
    });
    const block = formatDevelopmentContextBlock(ctx);
    const system = assembleSystemPrompt({
      phase: 'DEVELOPMENT',
      projectContextBlock: block,
      activeDimension: 'CHARACTER',
    });

    // GAP EXPLORATION instructions still present (model-side how-to) ...
    expect(system).toMatch(/GAP EXPLORATION/);
    // ... but no concrete bucket data (would mislead the model).
    expect(system).not.toMatch(/Strong coverage:/);
    expect(system).not.toMatch(/Partial coverage:/);
    expect(system).not.toMatch(/Unrepresented:/);
  });
});
