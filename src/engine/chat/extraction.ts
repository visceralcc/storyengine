/**
 * Chat Engine — entity creation from parsed responses.
 *
 *   - Discovery: {@link extractDiscoveryNotes} — DiscoveryNote entities at
 *     random viewport positions with collision avoidance (Spec_DiscoveryEngine §2.2).
 *   - Development / Refinement: {@link applyConceptExtraction} — creates
 *     suggested ConceptTypes and new Concepts, applies REFINE updates, and
 *     surfaces RETHINK proposals as pending confirmations (§5.3, §5.4, §6.1).
 *
 * Both flows use injectable clocks (and an RNG for Discovery) so tests are
 * deterministic.
 *
 * Source of truth:
 *   - docs/discovery/Spec_DiscoveryEngine.md §2.2 (note placement)
 *   - docs/chat-engine/Spec_ChatEngine.md §5.3, §5.4, §6.1, §7 (concepts)
 */

import {
  createConcept,
  createConceptType,
  createDiscoveryNote,
  nowISO,
} from '../../models/factories';
import type {
  Concept,
  ConceptType,
  Dimension,
  DiscoveryNote,
  NoteColor,
  Position,
} from '../../models/types';

import type {
  EditType,
  ExtractionParseResult,
  ParsedNewConcept,
  ParsedSuggestedType,
  ParsedUpdatedConcept,
} from './parser';
import { applyRefine } from './refinement';

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

// =====================================================================
// Development / Refinement — concept extraction
// =====================================================================

export interface ConceptExtractionWarning {
  /** Distinguishes the failure path so callers can log / surface differently. */
  reason:
    | 'UNKNOWN_TYPE'           // conceptTypeLabel didn't match any ConceptType
    | 'DUPLICATE_TYPE'         // suggestedNewType collided with an existing label
    | 'NO_CONCEPT_OF_TYPE'     // updatedConcept referenced a type with no Concept
    | 'DIMENSION_MISMATCH';    // AI's dimension didn't match the ConceptType's; corrected
  /** Free-form detail line. Goes straight to console.warn — never to the user. */
  message: string;
}

export interface PendingRethink {
  conceptId: string;
  /** Trimmed label of the ConceptType for inline-confirmation copy. */
  conceptTypeLabel: string;
  newValue: string;
  sourceMessageId: string | null;
}

export interface ConceptUpdate {
  conceptId: string;
  /** REFINE updates are applied to the version in place; the updated concept is here. */
  updatedConcept: Concept;
}

export interface ApplyConceptExtractionInput {
  projectId: string;
  parsed: ExtractionParseResult;
  /** ChatMessage ID that produced this extraction. Threaded into Concept / ConceptVersion `sourceMessageId`. */
  sourceMessageId: string | null;
  conceptTypes: ConceptType[];
  concepts: Concept[];
  /**
   * Position assigned to brand-new Concepts. The workspace handles layout
   * (§5.4 "default position"), so for now we accept whatever the caller
   * passes; default is the origin.
   */
  defaultPosition?: Position;
  /** Injectable clock for created/updated timestamps. Defaults to {@link nowISO}. */
  now?: () => string;
}

export interface ApplyConceptExtractionResult {
  /** New ConceptTypes created from `suggestedNewTypes` (`isDefault: false`). */
  newConceptTypes: ConceptType[];
  /** Brand-new Concepts created from `concepts[]`. Each has exactly one ConceptVersion. */
  newConcepts: Concept[];
  /** REFINE edits already applied; the updated Concept entities are inside. */
  refinedConcepts: ConceptUpdate[];
  /** RETHINK proposals awaiting user confirmation per §6.1 — not yet applied. */
  pendingRethinks: PendingRethink[];
  /** IDs of every Concept created or refined this turn — used to populate ChatMessage.conceptIds. */
  affectedConceptIds: string[];
  /** Non-fatal issues to log. Surfaced to the caller; never shown to the user. */
  warnings: ConceptExtractionWarning[];
}

/**
 * Validate and apply a parsed §5.2 extraction response.
 *
 * Order matters:
 *   1. Create suggested ConceptTypes first so concepts in the same response
 *      can reference them (§5.3 — "check if the label matches a suggested
 *      new type from the same response").
 *   2. Create new Concepts (each with one ConceptVersion).
 *   3. Apply REFINE updates immediately (§6.1 — low-risk, auto-apply).
 *   4. Collect RETHINK proposals as pending — apply requires user confirmation.
 *
 * Validation rules (§5.3):
 *   - ConceptType match is case-insensitive; canonical casing comes from the
 *     stored ConceptType.
 *   - Dimension mismatch → use the ConceptType's dimension; warn for logging.
 *   - `value` must be non-empty after trim (the parser already trimmed).
 *   - Suggested types with a duplicate label (case-insensitive) are skipped.
 *   - updatedConcepts: when multiple Concepts of one type exist, the most
 *     recently modified one wins (§5.3).
 *
 * Pure function — does not mutate `conceptTypes` or `concepts`. The caller is
 * responsible for persisting the returned entities.
 */
export function applyConceptExtraction(
  input: ApplyConceptExtractionInput,
): ApplyConceptExtractionResult {
  const clock = input.now ?? nowISO;
  const defaultPos = input.defaultPosition ?? { x: 0, y: 0 };
  const warnings: ConceptExtractionWarning[] = [];

  // 1. Suggested ConceptTypes — create first so step-2 concepts can reference them.
  const liveTypes: ConceptType[] = [...input.conceptTypes];
  const newConceptTypes: ConceptType[] = [];
  for (const suggested of input.parsed.suggestedNewTypes) {
    const created = tryCreateSuggestedType(suggested, liveTypes, clock, input.projectId, warnings);
    if (created) {
      liveTypes.push(created);
      newConceptTypes.push(created);
    }
  }

  // 2. New Concepts.
  const newConcepts: Concept[] = [];
  const liveConcepts: Concept[] = [...input.concepts];
  for (const c of input.parsed.concepts) {
    const created = tryCreateConcept(c, liveTypes, clock, input, defaultPos, warnings);
    if (created) {
      newConcepts.push(created);
      liveConcepts.push(created);
    }
  }

  // 3 + 4. REFINE / RETHINK against the live concept list.
  const refinedConcepts: ConceptUpdate[] = [];
  const pendingRethinks: PendingRethink[] = [];
  for (const update of input.parsed.updatedConcepts) {
    applyUpdate(
      update,
      liveTypes,
      liveConcepts,
      input.sourceMessageId,
      clock,
      refinedConcepts,
      pendingRethinks,
      warnings,
    );
  }

  const affectedConceptIds = [
    ...newConcepts.map((c) => c.id),
    ...refinedConcepts.map((u) => u.conceptId),
    ...pendingRethinks.map((p) => p.conceptId),
  ];

  return { newConceptTypes, newConcepts, refinedConcepts, pendingRethinks, affectedConceptIds, warnings };
}

// --- Step 1: suggested types ---

function tryCreateSuggestedType(
  suggested: ParsedSuggestedType,
  existingTypes: ConceptType[],
  clock: () => string,
  projectId: string,
  warnings: ConceptExtractionWarning[],
): ConceptType | null {
  const collision = existingTypes.find(
    (t) => t.label.toLowerCase() === suggested.label.toLowerCase(),
  );
  if (collision) {
    warnings.push({
      reason: 'DUPLICATE_TYPE',
      message: `Suggested ConceptType "${suggested.label}" matches existing "${collision.label}"; skipped.`,
    });
    return null;
  }
  return createConceptType({
    projectId,
    label: suggested.label,
    description: suggested.description,
    dimension: suggested.dimension,
    isDefault: false,
    now: clock(),
  });
}

// --- Step 2: new concepts ---

function tryCreateConcept(
  parsed: ParsedNewConcept,
  liveTypes: ConceptType[],
  clock: () => string,
  input: ApplyConceptExtractionInput,
  defaultPos: Position,
  warnings: ConceptExtractionWarning[],
): Concept | null {
  const type = findTypeByLabel(liveTypes, parsed.conceptTypeLabel);
  if (!type) {
    warnings.push({
      reason: 'UNKNOWN_TYPE',
      message: `No ConceptType matches label "${parsed.conceptTypeLabel}" (§5.3); concept skipped.`,
    });
    return null;
  }

  // §5.3 — dimension mismatch: trust the ConceptType, warn the caller.
  let dimension: Dimension = parsed.dimension;
  if (dimension !== type.dimension) {
    warnings.push({
      reason: 'DIMENSION_MISMATCH',
      message: `AI assigned ${parsed.dimension} to "${type.label}" (canonical: ${type.dimension}); corrected.`,
    });
    dimension = type.dimension;
  }

  return createConcept({
    projectId: input.projectId,
    conceptTypeId: type.id,
    dimension,
    value: parsed.value,
    sourceMessageId: input.sourceMessageId,
    position: defaultPos,
    now: clock(),
  });
}

// --- Steps 3 + 4: updates ---

function applyUpdate(
  parsed: ParsedUpdatedConcept,
  liveTypes: ConceptType[],
  liveConcepts: Concept[],
  sourceMessageId: string | null,
  clock: () => string,
  refinedConcepts: ConceptUpdate[],
  pendingRethinks: PendingRethink[],
  warnings: ConceptExtractionWarning[],
): void {
  const type = findTypeByLabel(liveTypes, parsed.existingConceptType);
  if (!type) {
    warnings.push({
      reason: 'UNKNOWN_TYPE',
      message: `Update targets unknown ConceptType "${parsed.existingConceptType}"; skipped.`,
    });
    return;
  }

  const target = mostRecentlyUpdatedConceptOfType(liveConcepts, type.id);
  if (!target) {
    warnings.push({
      reason: 'NO_CONCEPT_OF_TYPE',
      message: `No existing Concept of type "${type.label}" to update; skipped.`,
    });
    return;
  }

  const editType: EditType = parsed.editType;
  if (editType === 'REFINE') {
    const updated = applyRefine({
      concept: target,
      newValue: parsed.newValue,
      sourceMessageId,
      now: clock(),
    });
    refinedConcepts.push({ conceptId: target.id, updatedConcept: updated });
    // Mutate the live list so a later update in the same response sees the new state.
    const idx = liveConcepts.findIndex((c) => c.id === target.id);
    if (idx !== -1) liveConcepts[idx] = updated;
    return;
  }

  // RETHINK — surface as pending; do NOT apply until the user confirms (§6.1).
  pendingRethinks.push({
    conceptId: target.id,
    conceptTypeLabel: type.label,
    newValue: parsed.newValue,
    sourceMessageId,
  });
}

function findTypeByLabel(types: ConceptType[], label: string): ConceptType | undefined {
  const needle = label.trim().toLowerCase();
  return types.find((t) => t.label.toLowerCase() === needle);
}

function mostRecentlyUpdatedConceptOfType(concepts: Concept[], typeId: string): Concept | undefined {
  const matches = concepts.filter((c) => c.conceptTypeId === typeId);
  if (matches.length === 0) return undefined;
  return matches.reduce((latest, c) => (c.updatedAt > latest.updatedAt ? c : latest));
}
