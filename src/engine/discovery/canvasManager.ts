/**
 * Discovery canvas — core note operations.
 *
 * Phase 1 of the Discovery Engine build sequence: note creation, editing,
 * positioning, and deletion. Pure functions that operate on plain entity
 * objects and return new entity objects (no mutation). The UI/state layer is
 * responsible for owning the canvas's note list and applying these results.
 *
 * Source of truth: docs/discovery/Spec_DiscoveryEngine.md §2, §3.1, §11.
 */

import { createDiscoveryNote, nowISO } from '../../models/factories';
import type { DiscoveryCluster, DiscoveryNote, Position } from '../../models/types';

// --- Single-note operations ---

export interface CreateNoteInput {
  projectId: string;
  position: Position;
  content?: string;
  now?: string;
}

/**
 * Creates a fresh DiscoveryNote at the given canvas position.
 *
 * Per §2.2 "Manual placement," a note is created at the tapped position and
 * immediately enters edit mode with empty content. AI-extracted notes pass
 * their content in at creation time.
 */
export function createNote(input: CreateNoteInput): DiscoveryNote {
  return createDiscoveryNote({
    projectId: input.projectId,
    position: input.position,
    content: input.content ?? '',
    now: input.now,
  });
}

/**
 * Returns a copy of the note with `content` replaced and `updatedAt` bumped.
 *
 * Callers should check {@link isNoteEmpty} after editing — per §3.1, notes
 * whose content is empty after edit-end are automatically deleted (zero-content
 * notes are never persisted). Trimming is intentionally NOT applied here so the
 * stored value preserves whatever the user typed; "empty" is the trim check.
 */
export function updateNoteContent(
  note: DiscoveryNote,
  content: string,
  now: string = nowISO(),
): DiscoveryNote {
  return { ...note, content, updatedAt: now };
}

/**
 * Returns a copy of the note with a new position and `updatedAt` bumped.
 * Used on drag-end (§2.3).
 */
export function updateNotePosition(
  note: DiscoveryNote,
  position: Position,
  now: string = nowISO(),
): DiscoveryNote {
  return { ...note, position: { x: position.x, y: position.y }, updatedAt: now };
}

/**
 * True if the note's content is empty or whitespace-only.
 * Drives the §3.1 "empty notes are automatically deleted" rule.
 */
export function isNoteEmpty(note: DiscoveryNote): boolean {
  return note.content.trim().length === 0;
}

// --- Collection operations ---

export function findNote(notes: DiscoveryNote[], noteId: string): DiscoveryNote | undefined {
  return notes.find((n) => n.id === noteId);
}

/**
 * Removes the note from the list and strips its ID from any cluster's
 * `noteIds`. Clusters that end up empty are dropped — per §4.5, a cluster
 * disappears automatically when its last note is gone.
 */
export interface DeleteNoteResult {
  notes: DiscoveryNote[];
  clusters: DiscoveryCluster[];
}

export function deleteNote(
  notes: DiscoveryNote[],
  clusters: DiscoveryCluster[],
  noteId: string,
): DeleteNoteResult {
  const filteredNotes = notes.filter((n) => n.id !== noteId);
  const updatedClusters = clusters
    .map((c) =>
      c.noteIds.includes(noteId)
        ? { ...c, noteIds: c.noteIds.filter((id) => id !== noteId) }
        : c,
    )
    .filter((c) => c.noteIds.length > 0);
  return { notes: filteredNotes, clusters: updatedClusters };
}
