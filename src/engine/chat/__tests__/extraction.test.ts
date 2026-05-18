/**
 * Chat Engine — Discovery extraction tests.
 *
 * Phase 3 coverage from Spec_DiscoveryEngine §2.2:
 *   - Random position falls inside viewport bounds (incl. NOTE size offset)
 *   - Empty notes input → no notes returned, no RNG calls
 *   - Collision avoidance: returns a non-overlapping position when one is available
 *   - Last-attempt fallback: accepts overlap after 10 collisions
 *   - Batch placement: within-batch collisions also avoided
 *   - Viewport smaller than a note: position pinned to viewport origin
 */

import {
  applyConceptExtraction,
  COLLISION_MAX_ATTEMPTS,
  extractDiscoveryNotes,
  NOTE_HEIGHT,
  NOTE_WIDTH,
} from '../extraction';
import {
  createConcept,
  createConceptType,
  createDiscoveryNote,
} from '../../../models/factories';
import type { Concept, ConceptType, DiscoveryNote } from '../../../models/types';
import type { ExtractionParseResult } from '../parser';

const PROJECT_ID = 'proj_test';
const VIEWPORT = { x: 0, y: 0, width: 1000, height: 800 };

/** Build an RNG that returns a queued sequence of values, then 0 forever. */
function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => {
    const v = i < seq.length ? seq[i] : 0;
    i++;
    return v;
  };
}

describe('extractDiscoveryNotes', () => {
  it('returns an empty array when the notes input is empty', () => {
    const rng = jest.fn(() => 0.5);
    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: [],
      viewport: VIEWPORT,
      existingNotes: [],
      rng,
    });
    expect(out).toEqual([]);
    expect(rng).not.toHaveBeenCalled();
  });

  it('places notes at integer positions inside the viewport bounds', () => {
    // rng = 0 → top-left of placement range; rng = 0.999 → bottom-right
    const rng = seqRng([0, 0, 0.999, 0.999]);
    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: ['a', 'b'],
      viewport: VIEWPORT,
      existingNotes: [],
      rng,
      now: () => '2026-05-18T12:00:00.000Z',
    });

    expect(out).toHaveLength(2);
    expect(out[0].position).toEqual({ x: 0, y: 0 });
    // NOTE: rng=0.999, range = 1000-140 = 860 → round(0.999*860) = 859
    expect(out[1].position).toEqual({ x: 859, y: 659 });
    for (const n of out) {
      expect(Number.isInteger(n.position.x)).toBe(true);
      expect(Number.isInteger(n.position.y)).toBe(true);
      expect(n.position.x).toBeGreaterThanOrEqual(VIEWPORT.x);
      expect(n.position.y).toBeGreaterThanOrEqual(VIEWPORT.y);
      expect(n.position.x + NOTE_WIDTH).toBeLessThanOrEqual(VIEWPORT.x + VIEWPORT.width);
      expect(n.position.y + NOTE_HEIGHT).toBeLessThanOrEqual(VIEWPORT.y + VIEWPORT.height);
    }
  });

  it('passes the projectId, content, and clock through to the factory', () => {
    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: ['hello'],
      viewport: VIEWPORT,
      existingNotes: [],
      rng: () => 0,
      now: () => '2026-05-18T12:00:00.000Z',
    });
    const [note] = out;
    expect(note.projectId).toBe(PROJECT_ID);
    expect(note.content).toBe('hello');
    expect(note.createdAt).toBe('2026-05-18T12:00:00.000Z');
    expect(note.updatedAt).toBe('2026-05-18T12:00:00.000Z');
    expect(note.clusterId).toBeNull();
  });

  it('avoids existing notes by retrying random positions (§2.2)', () => {
    // Existing note at (0,0); first rng attempt collides, second attempt doesn't.
    const existing: DiscoveryNote[] = [
      createDiscoveryNote({ projectId: PROJECT_ID, position: { x: 0, y: 0 } }),
    ];
    // attempt 1: (0, 0) — collides
    // attempt 2: (860, 660) — clear
    const rng = seqRng([0, 0, 1, 1]);

    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: ['x'],
      viewport: VIEWPORT,
      existingNotes: existing,
      rng,
    });

    expect(out).toHaveLength(1);
    expect(out[0].position).not.toEqual({ x: 0, y: 0 });
  });

  it('accepts overlap after COLLISION_MAX_ATTEMPTS collisions (§2.2 last-attempt fallback)', () => {
    // Whole viewport blocked by a wall of notes — every random position collides.
    const wall: DiscoveryNote[] = [];
    for (let x = 0; x <= VIEWPORT.width - NOTE_WIDTH; x += 1) {
      // One note per pixel column would be 861 notes — that's overkill but covers all
      // x positions exactly. Instead place coarse notes that overlap every candidate.
      wall.push(
        createDiscoveryNote({ projectId: PROJECT_ID, position: { x, y: 0 } }),
      );
      if (wall.length > 5) break;
    }
    // To guarantee any candidate collides, blanket the viewport with one big note.
    const blocker = createDiscoveryNote({
      projectId: PROJECT_ID,
      position: { x: -50, y: -50 }, // overlaps everything in the viewport at NOTE_WIDTHxHEIGHT
    });
    // Add many overlapping blockers so any (x,y) collides.
    const blockers: DiscoveryNote[] = [];
    for (let x = -NOTE_WIDTH; x < VIEWPORT.width + NOTE_WIDTH; x += 50) {
      for (let y = -NOTE_HEIGHT; y < VIEWPORT.height + NOTE_HEIGHT; y += 50) {
        blockers.push(createDiscoveryNote({ projectId: PROJECT_ID, position: { x, y } }));
      }
    }

    const rng = jest.fn(() => 0.5);
    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: ['x'],
      viewport: VIEWPORT,
      existingNotes: [blocker, ...blockers],
      rng,
    });

    // 2 RNG calls per attempt (x + y), so COLLISION_MAX_ATTEMPTS × 2 calls.
    expect(rng).toHaveBeenCalledTimes(COLLISION_MAX_ATTEMPTS * 2);
    expect(out).toHaveLength(1);
  });

  it('avoids within-batch collisions when placing multiple notes', () => {
    // First note placed at (0,0). Second note tries (0,0) (collides with first),
    // then (500,500) (clear).
    const rng = seqRng([0, 0, 0, 0, 0.5, 0.5]);
    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: ['a', 'b'],
      viewport: VIEWPORT,
      existingNotes: [],
      rng,
    });

    expect(out).toHaveLength(2);
    expect(out[0].position).toEqual({ x: 0, y: 0 });
    expect(out[1].position).not.toEqual({ x: 0, y: 0 });
  });

  it('pins position to the viewport origin when the viewport is smaller than a note', () => {
    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: ['x'],
      // tiny viewport — width < NOTE_WIDTH and height < NOTE_HEIGHT
      viewport: { x: 100, y: 200, width: 50, height: 50 },
      existingNotes: [],
      rng: () => 0.99,
    });
    expect(out[0].position).toEqual({ x: 100, y: 200 });
  });

  it('respects viewport.x / viewport.y offset (pan)', () => {
    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: ['x'],
      viewport: { x: 500, y: 1000, width: 1000, height: 800 },
      existingNotes: [],
      rng: () => 0,
    });
    expect(out[0].position).toEqual({ x: 500, y: 1000 });
  });

  it('passes the requested color through to the factory', () => {
    const out = extractDiscoveryNotes({
      projectId: PROJECT_ID,
      noteContents: ['x'],
      viewport: VIEWPORT,
      existingNotes: [],
      rng: () => 0,
      color: 'GREEN',
    });
    expect(out[0].color).toBe('GREEN');
  });
});

// =====================================================================
// applyConceptExtraction (§5.3, §5.4, §6.1)
// =====================================================================

const SOURCE_MSG_ID = 'msg_source';

function makeType(label: string, dimension: ConceptType['dimension']): ConceptType {
  return createConceptType({
    projectId: PROJECT_ID,
    label,
    description: `${label} description`,
    dimension,
    isDefault: true,
    now: '2026-05-01T00:00:00.000Z',
  });
}

function makeConceptOfType(type: ConceptType, value: string, updatedAt: string): Concept {
  const c = createConcept({
    projectId: PROJECT_ID,
    conceptTypeId: type.id,
    dimension: type.dimension,
    value,
    now: updatedAt,
  });
  // Force updatedAt for last-modified comparisons
  return { ...c, updatedAt };
}

function emptyParsed(overrides: Partial<ExtractionParseResult> = {}): ExtractionParseResult {
  return {
    chatResponse: '',
    concepts: [],
    updatedConcepts: [],
    suggestedNewTypes: [],
    parseError: null,
    ...overrides,
  };
}

describe('applyConceptExtraction — new concepts (§5.3, §5.4)', () => {
  it('creates Concepts with exactly one ConceptVersion, threading sourceMessageId', () => {
    const motivation = makeType('Motivation', 'CHARACTER');
    const parsed = emptyParsed({
      concepts: [
        { conceptTypeLabel: 'Motivation', value: 'Proving her father wrong', dimension: 'CHARACTER' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: SOURCE_MSG_ID,
      conceptTypes: [motivation],
      concepts: [],
      now: () => '2026-05-18T12:00:00.000Z',
    });

    expect(out.newConcepts).toHaveLength(1);
    const created = out.newConcepts[0];
    expect(created.conceptTypeId).toBe(motivation.id);
    expect(created.dimension).toBe('CHARACTER');
    expect(created.versions).toHaveLength(1);
    expect(created.versions[0].value).toBe('Proving her father wrong');
    expect(created.versions[0].versionNumber).toBe(1);
    expect(created.sourceMessageId).toBe(SOURCE_MSG_ID);
    expect(out.affectedConceptIds).toEqual([created.id]);
    expect(out.warnings).toEqual([]);
  });

  it('matches ConceptType labels case-insensitively (§5.3)', () => {
    const motivation = makeType('Motivation', 'CHARACTER');
    const parsed = emptyParsed({
      concepts: [
        { conceptTypeLabel: 'motivation', value: 'x', dimension: 'CHARACTER' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [motivation],
      concepts: [],
    });
    expect(out.newConcepts).toHaveLength(1);
    expect(out.newConcepts[0].conceptTypeId).toBe(motivation.id);
  });

  it('corrects a mismatched dimension to the ConceptType canonical and warns', () => {
    const timePeriod = makeType('Time Period', 'WORLD');
    const parsed = emptyParsed({
      concepts: [
        { conceptTypeLabel: 'Time Period', value: '1820s', dimension: 'CHARACTER' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [timePeriod],
      concepts: [],
    });
    expect(out.newConcepts[0].dimension).toBe('WORLD');
    expect(out.warnings.map((w) => w.reason)).toEqual(['DIMENSION_MISMATCH']);
  });

  it('skips concepts whose label matches no ConceptType, warns, and continues', () => {
    const motivation = makeType('Motivation', 'CHARACTER');
    const parsed = emptyParsed({
      concepts: [
        { conceptTypeLabel: 'Nope', value: 'x', dimension: 'CHARACTER' },
        { conceptTypeLabel: 'Motivation', value: 'y', dimension: 'CHARACTER' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [motivation],
      concepts: [],
    });
    expect(out.newConcepts).toHaveLength(1);
    expect(out.warnings.map((w) => w.reason)).toEqual(['UNKNOWN_TYPE']);
  });
});

describe('applyConceptExtraction — suggested new types (§7.1)', () => {
  it('creates a ConceptType then uses it for a concept in the same response (§5.3)', () => {
    const parsed = emptyParsed({
      suggestedNewTypes: [
        { label: 'Cultural Practice', description: 'Rituals + customs', dimension: 'WORLD' },
      ],
      concepts: [
        { conceptTypeLabel: 'Cultural Practice', value: 'Sunday market', dimension: 'WORLD' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [],
      concepts: [],
    });
    expect(out.newConceptTypes).toHaveLength(1);
    expect(out.newConceptTypes[0].label).toBe('Cultural Practice');
    expect(out.newConceptTypes[0].isDefault).toBe(false);
    expect(out.newConcepts).toHaveLength(1);
    expect(out.newConcepts[0].conceptTypeId).toBe(out.newConceptTypes[0].id);
    expect(out.warnings).toEqual([]);
  });

  it('skips a suggested type when its label already exists (case-insensitive)', () => {
    const existing = makeType('Time Period', 'WORLD');
    const parsed = emptyParsed({
      suggestedNewTypes: [{ label: 'time period', description: 'dup', dimension: 'WORLD' }],
    });
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
});

describe('applyConceptExtraction — REFINE updates (§6.1)', () => {
  it('applies REFINE in place, returns the updated Concept, no pending', () => {
    const motivation = makeType('Motivation', 'CHARACTER');
    const concept = makeConceptOfType(motivation, 'before', '2026-05-10T00:00:00.000Z');
    const parsed = emptyParsed({
      updatedConcepts: [
        { existingConceptType: 'Motivation', newValue: 'after', editType: 'REFINE' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: SOURCE_MSG_ID,
      conceptTypes: [motivation],
      concepts: [concept],
      now: () => '2026-05-18T12:00:00.000Z',
    });

    expect(out.pendingRethinks).toEqual([]);
    expect(out.refinedConcepts).toHaveLength(1);
    const updated = out.refinedConcepts[0].updatedConcept;
    expect(updated.versions).toHaveLength(1);
    expect(updated.versions[0].value).toBe('after');
    expect(updated.versions[0].sourceMessageId).toBe(SOURCE_MSG_ID);
  });

  it('updates the most recently modified Concept when multiple of one type exist (§5.3)', () => {
    const fear = makeType('Fear / Weakness', 'CHARACTER');
    const older = makeConceptOfType(fear, 'older', '2026-05-01T00:00:00.000Z');
    const newer = makeConceptOfType(fear, 'newer', '2026-05-10T00:00:00.000Z');
    const parsed = emptyParsed({
      updatedConcepts: [
        { existingConceptType: 'Fear / Weakness', newValue: 'updated', editType: 'REFINE' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [fear],
      concepts: [older, newer],
    });
    expect(out.refinedConcepts).toHaveLength(1);
    expect(out.refinedConcepts[0].conceptId).toBe(newer.id);
  });

  it('warns and skips a REFINE that targets a type with no existing Concept', () => {
    const fear = makeType('Fear / Weakness', 'CHARACTER');
    const parsed = emptyParsed({
      updatedConcepts: [
        { existingConceptType: 'Fear / Weakness', newValue: 'x', editType: 'REFINE' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [fear],
      concepts: [],
    });
    expect(out.refinedConcepts).toEqual([]);
    expect(out.warnings.map((w) => w.reason)).toEqual(['NO_CONCEPT_OF_TYPE']);
  });
});

describe('applyConceptExtraction — RETHINK proposals (§6.1)', () => {
  it('surfaces RETHINK as pending and does NOT modify the concept', () => {
    const fear = makeType('Fear / Weakness', 'CHARACTER');
    const concept = makeConceptOfType(fear, 'before', '2026-05-10T00:00:00.000Z');
    const parsed = emptyParsed({
      updatedConcepts: [
        { existingConceptType: 'Fear / Weakness', newValue: 'after', editType: 'RETHINK' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: SOURCE_MSG_ID,
      conceptTypes: [fear],
      concepts: [concept],
    });

    expect(out.refinedConcepts).toEqual([]);
    expect(out.pendingRethinks).toEqual([
      {
        conceptId: concept.id,
        conceptTypeLabel: 'Fear / Weakness',
        newValue: 'after',
        sourceMessageId: SOURCE_MSG_ID,
      },
    ]);
    expect(out.affectedConceptIds).toEqual([concept.id]);
  });
});

describe('applyConceptExtraction — bookkeeping', () => {
  it('aggregates affectedConceptIds across new + refined + pending', () => {
    const motivation = makeType('Motivation', 'CHARACTER');
    const fear = makeType('Fear / Weakness', 'CHARACTER');
    const fearConcept = makeConceptOfType(fear, 'before', '2026-05-10T00:00:00.000Z');
    const parsed = emptyParsed({
      concepts: [{ conceptTypeLabel: 'Motivation', value: 'new', dimension: 'CHARACTER' }],
      updatedConcepts: [
        { existingConceptType: 'Fear / Weakness', newValue: 'after', editType: 'RETHINK' },
      ],
    });
    const out = applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed,
      sourceMessageId: null,
      conceptTypes: [motivation, fear],
      concepts: [fearConcept],
    });
    expect(out.affectedConceptIds).toHaveLength(2);
    expect(out.affectedConceptIds).toContain(out.newConcepts[0].id);
    expect(out.affectedConceptIds).toContain(fearConcept.id);
  });

  it('does not mutate the caller-supplied concepts or conceptTypes arrays', () => {
    const motivation = makeType('Motivation', 'CHARACTER');
    const concept = makeConceptOfType(motivation, 'before', '2026-05-10T00:00:00.000Z');
    const typesSnapshot = JSON.parse(JSON.stringify([motivation]));
    const conceptsSnapshot = JSON.parse(JSON.stringify([concept]));

    applyConceptExtraction({
      projectId: PROJECT_ID,
      parsed: emptyParsed({
        suggestedNewTypes: [{ label: 'New', description: 'd', dimension: 'WORLD' }],
        concepts: [{ conceptTypeLabel: 'New', value: 'v', dimension: 'WORLD' }],
        updatedConcepts: [{ existingConceptType: 'Motivation', newValue: 'next', editType: 'REFINE' }],
      }),
      sourceMessageId: null,
      conceptTypes: [motivation],
      concepts: [concept],
    });

    expect([motivation]).toEqual(typesSnapshot);
    expect([concept]).toEqual(conceptsSnapshot);
  });
});
