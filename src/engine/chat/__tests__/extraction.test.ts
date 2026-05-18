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
  COLLISION_MAX_ATTEMPTS,
  extractDiscoveryNotes,
  NOTE_HEIGHT,
  NOTE_WIDTH,
} from '../extraction';
import { createDiscoveryNote } from '../../../models/factories';
import type { DiscoveryNote } from '../../../models/types';

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
