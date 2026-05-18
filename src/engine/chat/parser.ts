/**
 * Chat Engine — response parser.
 *
 * The model returns conversational text with an optional fenced JSON block at
 * the end (§5). The chat panel displays the text; the JSON block (if present
 * and well-formed) carries the structured extraction payload.
 *
 *   - Discovery: `{ notes: string[] }` per §5.1 → {@link parseDiscoveryResponse}
 *   - Development / Refinement: `{ concepts, updatedConcepts, suggestedNewTypes }`
 *     per §5.2 → {@link parseExtractionResponse}
 *
 * Both reuse {@link extractJsonBlock} to split chat text from the JSON block.
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §5, §10.
 */

import type { Dimension } from '../../models/types';

// --- Generic splitter ---

export interface JsonBlockSplit {
  /** Conversational text with the fenced block removed and outer whitespace trimmed. */
  text: string;
  /** Raw JSON contents from inside the fence, or null if no block was found. */
  json: string | null;
}

// Captures the contents of a ```json ... ``` block. Tolerates whitespace and
// blank lines around the fence; non-greedy body match so a closing ``` ends
// the capture at the first one. We accept ```json (with the language tag)
// only — §5.1 / §5.2 prescribe that exact opener, and accepting bare ```
// would risk swallowing prose snippets the model formats as code.
const JSON_BLOCK_RE = /```json\s*([\s\S]*?)```/g;

/**
 * Pull the trailing fenced JSON block out of a response. If multiple ```json
 * blocks appear (rare; the spec asks for one), the LAST one wins — that's
 * the conventional location per §5 and matches the format examples.
 */
export function extractJsonBlock(response: string): JsonBlockSplit {
  const matches = Array.from(response.matchAll(JSON_BLOCK_RE));
  if (matches.length === 0) {
    return { text: response.trim(), json: null };
  }
  const last = matches[matches.length - 1];
  const before = response.slice(0, last.index ?? 0);
  const after = response.slice((last.index ?? 0) + last[0].length);
  const text = (before + after).trim();
  return { text, json: last[1].trim() };
}

// --- Discovery (§5.1) ---

export interface DiscoveryParseResult {
  /** Conversational text to render in the chat panel. Never empty after parse. */
  chatResponse: string;
  /** Extracted note contents in source order. Empty when brainstorming. */
  notes: string[];
  /**
   * Present when a fenced JSON block was found but didn't parse as the
   * Discovery schema. Callers should log this for debugging (§10) and treat
   * the response as plain chat (notes will be empty).
   */
  parseError: Error | null;
}

/**
 * Synthetic chat message used when the model returns only a JSON block with
 * no surrounding prose (§10 "JSON block without chat text"). Keeps the chat
 * panel from showing an empty assistant message.
 */
export const EMPTY_CHAT_SYNTHETIC = "I've captured those ideas.";

/**
 * Parse a Discovery-phase response (§5.1).
 *
 *   1. SPLIT — separate chatResponse text from the JSON block
 *   2. PARSE — `{ "notes": string[] }` (notes may be empty or absent)
 *   3. FALLBACK — on JSON parse failure: return the entire response as the
 *      chat text, no notes, parseError set. The caller logs this; the user
 *      sees a normal assistant reply.
 *
 * The function never throws. All failure modes are encoded in the result.
 */
export function parseDiscoveryResponse(response: string): DiscoveryParseResult {
  const split = extractJsonBlock(response);

  // Brainstorming mode — no JSON block, no extraction.
  if (split.json === null) {
    return {
      chatResponse: split.text.length > 0 ? split.text : EMPTY_CHAT_SYNTHETIC,
      notes: [],
      parseError: null,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(split.json);
  } catch (err) {
    // §10 — malformed JSON: treat the entire response as plain chat.
    return {
      chatResponse: response.trim(),
      notes: [],
      parseError: err instanceof Error ? err : new Error(String(err)),
    };
  }

  const notes = readNotesArray(parsed);
  if (notes === null) {
    return {
      chatResponse: response.trim(),
      notes: [],
      parseError: new Error(
        'Discovery response JSON did not match { notes: string[] } schema.',
      ),
    };
  }

  // §10 — JSON-only response: synthesize a minimal chat message so the panel
  // never shows a blank assistant bubble.
  const chatResponse = split.text.length > 0 ? split.text : EMPTY_CHAT_SYNTHETIC;
  return { chatResponse, notes, parseError: null };
}

/**
 * Return the `notes` array if the parsed value is a Discovery-shaped object
 * with a string[] in `.notes`. Returns an empty array when `notes` is
 * missing or explicitly empty (both are valid — brainstorming-mode responses
 * may include `{}` defensively). Returns null if the shape is wrong.
 */
function readNotesArray(parsed: unknown): string[] | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as { notes?: unknown };
  if (obj.notes === undefined) return [];
  if (!Array.isArray(obj.notes)) return null;
  // Per §8.1 "preserve user language" — we accept the AI's strings verbatim
  // but skip any non-string entries defensively.
  const cleaned: string[] = [];
  for (const n of obj.notes) {
    if (typeof n === 'string' && n.trim().length > 0) cleaned.push(n);
  }
  return cleaned;
}

// --- Development / Refinement (§5.2) ---

const VALID_DIMENSIONS: ReadonlySet<Dimension> = new Set([
  'WORLD',
  'CHARACTER',
  'CONFLICT',
  'STORYLINE',
]);

export type EditType = 'REFINE' | 'RETHINK';

export interface ParsedNewConcept {
  conceptTypeLabel: string;
  value: string;
  dimension: Dimension;
}

export interface ParsedUpdatedConcept {
  existingConceptType: string;
  newValue: string;
  /**
   * Per §5.3 validation: an invalid value here defaults to `'REFINE'`
   * (the safer choice — small edits, no version history pollution).
   */
  editType: EditType;
}

export interface ParsedSuggestedType {
  label: string;
  description: string;
  dimension: Dimension;
}

export interface ExtractionParseResult {
  chatResponse: string;
  concepts: ParsedNewConcept[];
  updatedConcepts: ParsedUpdatedConcept[];
  suggestedNewTypes: ParsedSuggestedType[];
  /** Set when a fenced JSON block was found but the shape was wrong. See {@link DiscoveryParseResult.parseError}. */
  parseError: Error | null;
}

/**
 * Parse a Development- or Refinement-phase response (§5.2). Never throws.
 *
 * Three top-level arrays are optional — any combination can appear:
 *   - `concepts`         brand-new Concepts to create
 *   - `updatedConcepts`  refinements / rethinks of existing Concepts
 *   - `suggestedNewTypes` custom ConceptTypes the AI wants to add
 *
 * Schema-level validation only — the applier in `extraction.ts` does the
 * project-state validation (label matching, dimension correction, duplicate
 * detection) per §5.3.
 *
 * Failure modes mirror {@link parseDiscoveryResponse}:
 *   - No fenced block → all arrays empty, no error (chat-only response)
 *   - Malformed JSON  → entire response treated as plain chat, parseError set
 *   - Wrong root shape (e.g. array instead of object) → parseError set
 */
export function parseExtractionResponse(response: string): ExtractionParseResult {
  const split = extractJsonBlock(response);

  if (split.json === null) {
    return {
      chatResponse: split.text.length > 0 ? split.text : EMPTY_CHAT_SYNTHETIC,
      concepts: [],
      updatedConcepts: [],
      suggestedNewTypes: [],
      parseError: null,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(split.json);
  } catch (err) {
    return {
      chatResponse: response.trim(),
      concepts: [],
      updatedConcepts: [],
      suggestedNewTypes: [],
      parseError: err instanceof Error ? err : new Error(String(err)),
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      chatResponse: response.trim(),
      concepts: [],
      updatedConcepts: [],
      suggestedNewTypes: [],
      parseError: new Error(
        'Extraction response JSON root was not an object (§5.2).',
      ),
    };
  }

  const obj = parsed as Record<string, unknown>;
  const concepts = readNewConcepts(obj.concepts);
  const updatedConcepts = readUpdatedConcepts(obj.updatedConcepts);
  const suggestedNewTypes = readSuggestedTypes(obj.suggestedNewTypes);

  const chatResponse = split.text.length > 0 ? split.text : EMPTY_CHAT_SYNTHETIC;
  return { chatResponse, concepts, updatedConcepts, suggestedNewTypes, parseError: null };
}

function readNewConcepts(raw: unknown): ParsedNewConcept[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedNewConcept[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const conceptTypeLabel = typeof e.conceptTypeLabel === 'string' ? e.conceptTypeLabel.trim() : '';
    const value = typeof e.value === 'string' ? e.value.trim() : '';
    const dimension = readDimension(e.dimension);
    if (!conceptTypeLabel || !value || !dimension) continue;
    out.push({ conceptTypeLabel, value, dimension });
  }
  return out;
}

function readUpdatedConcepts(raw: unknown): ParsedUpdatedConcept[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedUpdatedConcept[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const existingConceptType = typeof e.existingConceptType === 'string' ? e.existingConceptType.trim() : '';
    const newValue = typeof e.newValue === 'string' ? e.newValue.trim() : '';
    if (!existingConceptType || !newValue) continue;
    // §5.3 — invalid editType defaults to REFINE.
    const editType: EditType = e.editType === 'RETHINK' ? 'RETHINK' : 'REFINE';
    out.push({ existingConceptType, newValue, editType });
  }
  return out;
}

function readSuggestedTypes(raw: unknown): ParsedSuggestedType[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedSuggestedType[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const label = typeof e.label === 'string' ? e.label.trim() : '';
    const description = typeof e.description === 'string' ? e.description.trim() : '';
    const dimension = readDimension(e.dimension);
    if (!label || !dimension) continue;
    out.push({ label, description, dimension });
  }
  return out;
}

function readDimension(raw: unknown): Dimension | null {
  if (typeof raw !== 'string') return null;
  const upper = raw.toUpperCase();
  return VALID_DIMENSIONS.has(upper as Dimension) ? (upper as Dimension) : null;
}
