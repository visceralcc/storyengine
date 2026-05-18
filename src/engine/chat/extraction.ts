/**
 * Chat Engine — Discovery extraction.
 *
 * Turn parsed Discovery notes (from `parser.ts`) into `DiscoveryNote`
 * entities placed on the canvas. Placement follows Spec_DiscoveryEngine §2.2
 * "AI-generated placement":
 *
 *   - Random position within the current viewport bounds
 *   - Collision avoidance: up to 10 retries; on the 11th attempt the last
 *     candidate position is accepted (some overlap is acceptable)
 *   - Notes from the same extraction batch are scattered, not clustered
 *
 * The RNG and "now" timestamp are injectable so tests can be deterministic.
 *
 * Source of truth: docs/discovery/Spec_DiscoveryEngine.md §2.2.
 */

import { createDiscoveryNote, nowISO } from '../../models/factories';
import type { DiscoveryNote, NoteColor, Position } from '../../models/types';

// --- Constants (Spec_DiscoveryEngine.md §4.4) ---

export const NOTE_WIDTH = 140;
export const NOTE_HEIGHT = 140;
/** Up to 10 retries to find a non-colliding spot before accepting overlap. */
export const COLLISION_MAX_ATTEMPTS = 10;

// --- Viewport ---

/**
 * Viewport bounds expressed in canvas coordinates (per §2.1, positions are
 * absolute and integer pixels). The caller — the Discovery screen — converts
 * its current pan/zoom into these bounds before invoking extraction.
 */
export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- Inputs / outputs ---

export interface ExtractDiscoveryNotesInput {
  projectId: string;
  /** Note contents from `parseDiscoveryResponse(...).notes`. */
  noteContents: string[];
  /** Canvas-coordinate bounds of the viewport at the moment of extraction. */
  viewport: ViewportBounds;
  /** Existing notes on the canvas — used for collision avoidance. */
  existingNotes: DiscoveryNote[];
  /** Color applied to every newly placed note. Defaults to the factory default. */
  color?: NoteColor;
  /** Injectable RNG. Defaults to `Math.random`. Must return a value in [0, 1). */
  rng?: () => number;
  /** Injectable clock for `createdAt` / `updatedAt`. Defaults to {@link nowISO}. */
  now?: () => string;
}

/**
 * Build new {@link DiscoveryNote} entities at random viewport positions with
 * collision avoidance. Pure function — does not mutate `existingNotes`. The
 * caller is responsible for persisting the returned notes.
 *
 * Each note is positioned using the running set of already-placed notes from
 * this batch plus the original existing notes, so within-batch collisions
 * are also avoided where possible (§2.2 "scattered, not clustered").
 *
 * If the viewport is too small to fit a note (`width < NOTE_WIDTH` or
 * `height < NOTE_HEIGHT`), the note is anchored to the viewport's
 * top-left — there is no negative coordinate range to randomize into.
 */
export function extractDiscoveryNotes(input: ExtractDiscoveryNotesInput): DiscoveryNote[] {
  const rng = input.rng ?? Math.random;
  const clock = input.now ?? nowISO;

  const placed: DiscoveryNote[] = [];
  const obstacles = [...input.existingNotes];

  for (const content of input.noteContents) {
    const position = findNonCollidingPosition(input.viewport, obstacles, rng);
    const note = createDiscoveryNote({
      projectId: input.projectId,
      position,
      content,
      color: input.color,
      now: clock(),
    });
    placed.push(note);
    obstacles.push(note);
  }

  return placed;
}

// --- Placement ---

function findNonCollidingPosition(
  viewport: ViewportBounds,
  obstacles: DiscoveryNote[],
  rng: () => number,
): Position {
  let last: Position = randomPosition(viewport, rng);
  for (let attempt = 0; attempt < COLLISION_MAX_ATTEMPTS; attempt++) {
    const candidate = attempt === 0 ? last : randomPosition(viewport, rng);
    if (!collidesWithAny(candidate, obstacles)) {
      return candidate;
    }
    last = candidate;
  }
  // §2.2 — all attempts collided; accept the last candidate (some overlap is OK).
  return last;
}

/**
 * Random integer position whose 140×140 bounding box fits inside the
 * viewport. When the viewport is narrower or shorter than a note, the
 * possible range collapses to the viewport's origin.
 */
function randomPosition(viewport: ViewportBounds, rng: () => number): Position {
  const xRange = Math.max(0, viewport.width - NOTE_WIDTH);
  const yRange = Math.max(0, viewport.height - NOTE_HEIGHT);
  return {
    x: Math.round(viewport.x + rng() * xRange),
    y: Math.round(viewport.y + rng() * yRange),
  };
}

function collidesWithAny(pos: Position, obstacles: DiscoveryNote[]): boolean {
  for (const o of obstacles) {
    if (rectanglesOverlap(pos, o.position)) return true;
  }
  return false;
}

/**
 * Axis-aligned bounding-box overlap test for two NOTE_WIDTH × NOTE_HEIGHT
 * rectangles. Edge-touching counts as non-overlapping — two notes flush
 * against each other are not "colliding."
 */
function rectanglesOverlap(a: Position, b: Position): boolean {
  return (
    a.x < b.x + NOTE_WIDTH &&
    a.x + NOTE_WIDTH > b.x &&
    a.y < b.y + NOTE_HEIGHT &&
    a.y + NOTE_HEIGHT > b.y
  );
}
