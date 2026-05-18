/**
 * Chat Engine — follow-up refinement.
 *
 * The model's `editType` is a recommendation per §6.1:
 *   - `REFINE` → applied automatically (low risk; user can undo via chat)
 *   - `RETHINK` → triggers a chat confirmation; only applied on user OK
 *
 * Pure functions over Concept entities — no project-state lookups, no
 * mutation. The applier in `extraction.ts` decides whether to call these
 * directly (REFINE) or surface a pending action (RETHINK).
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §6.1, §5.4.
 */

import { createConceptVersion, nowISO } from '../../models/factories';
import type { Concept, ConceptVersion } from '../../models/types';

// --- REFINE ---

export interface ApplyRefineInput {
  concept: Concept;
  newValue: string;
  sourceMessageId?: string | null;
  now?: string;
}

/**
 * In-place edit of the Concept's current version (§5.4).
 *
 * Updates `value` and `updatedAt` on the version pointed to by
 * `currentVersionId`, leaves all other versions and the version count
 * untouched. The Concept's `updatedAt` is also bumped. Per §5.4 the
 * version's `sourceMessageId` is updated to point at the message that
 * caused the refine — refines are still traceable to a specific exchange
 * (HARD_RULES "show your work").
 *
 * If the concept's `currentVersionId` doesn't resolve to a stored version
 * (corrupt state), the input is returned unchanged — callers should
 * inspect the result to detect this.
 */
export function applyRefine(input: ApplyRefineInput): Concept {
  const { concept, newValue } = input;
  const now = input.now ?? nowISO();
  const sourceMessageId = input.sourceMessageId ?? null;

  const idx = concept.versions.findIndex((v) => v.id === concept.currentVersionId);
  if (idx === -1) return concept;

  const current = concept.versions[idx];
  const updatedVersion: ConceptVersion = {
    ...current,
    value: newValue,
    sourceMessageId,
    updatedAt: now,
  };
  const versions = [...concept.versions];
  versions[idx] = updatedVersion;

  return { ...concept, versions, updatedAt: now };
}

// --- RETHINK ---

export interface ApplyRethinkInput {
  concept: Concept;
  newValue: string;
  sourceMessageId?: string | null;
  now?: string;
}

/**
 * Major change — create a new {@link ConceptVersion} with an incremented
 * `versionNumber` and point `currentVersionId` at it (§5.4).
 *
 * Older versions are preserved on the Concept (DataModel §11 — concept
 * history is append-only). This is called only after the user has
 * confirmed the rethink (§6.1) — `extraction.ts` surfaces RETHINKs as
 * pending actions; the UI invokes this function once confirmation comes
 * back.
 */
export function applyRethink(input: ApplyRethinkInput): Concept {
  const { concept, newValue } = input;
  const now = input.now ?? nowISO();
  const sourceMessageId = input.sourceMessageId ?? null;

  const nextVersionNumber =
    concept.versions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;

  const newVersion = createConceptVersion({
    conceptId: concept.id,
    versionNumber: nextVersionNumber,
    value: newValue,
    sourceMessageId,
    now,
  });

  return {
    ...concept,
    versions: [...concept.versions, newVersion],
    currentVersionId: newVersion.id,
    updatedAt: now,
  };
}
