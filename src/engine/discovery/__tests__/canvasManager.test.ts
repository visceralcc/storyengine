import { createDiscoveryNote } from '../../../models/factories';
import type { DiscoveryCluster, DiscoveryNote } from '../../../models/types';
import {
  createNote,
  deleteNote,
  findNote,
  isNoteEmpty,
  updateNoteContent,
  updateNotePosition,
} from '../canvasManager';

const NANOID_BODY = /^[A-Za-z0-9_-]{8}$/;

function makeNote(overrides: Partial<DiscoveryNote> = {}): DiscoveryNote {
  return createDiscoveryNote({
    projectId: 'proj_test',
    position: { x: 0, y: 0 },
    ...overrides,
  });
}

describe('createNote', () => {
  it('creates a dnote_-prefixed note at the given position with empty content', () => {
    const note = createNote({
      projectId: 'proj_a',
      position: { x: 200, y: 300 },
    });
    expect(note.id.startsWith('dnote_')).toBe(true);
    expect(NANOID_BODY.test(note.id.slice('dnote_'.length))).toBe(true);
    expect(note.projectId).toBe('proj_a');
    expect(note.content).toBe('');
    expect(note.position).toEqual({ x: 200, y: 300 });
    expect(note.clusterId).toBeNull();
    expect(note.imageId).toBeNull();
  });

  it('accepts pre-filled content (AI extraction path)', () => {
    const note = createNote({
      projectId: 'proj_a',
      position: { x: 50, y: 50 },
      content: 'A woman riding a horse away from a mansion',
    });
    expect(note.content).toBe('A woman riding a horse away from a mansion');
  });
});

describe('updateNoteContent', () => {
  it('returns a new note with replaced content and a bumped updatedAt', () => {
    const original = makeNote({ content: 'first draft' });
    const edited = updateNoteContent(original, 'revised draft', '2026-05-14T10:00:00.000Z');
    expect(edited.content).toBe('revised draft');
    expect(edited.updatedAt).toBe('2026-05-14T10:00:00.000Z');
    expect(edited.id).toBe(original.id);
    expect(edited.position).toEqual(original.position);
  });

  it('does not mutate the input note', () => {
    const original = makeNote({ content: 'first draft' });
    const snapshot = { ...original };
    updateNoteContent(original, 'something else');
    expect(original).toEqual(snapshot);
  });

  it('preserves the user\'s text verbatim (no auto-trim)', () => {
    const note = updateNoteContent(makeNote(), '  with surrounding spaces  ');
    expect(note.content).toBe('  with surrounding spaces  ');
  });
});

describe('isNoteEmpty', () => {
  it('treats empty strings, whitespace, and newlines as empty', () => {
    expect(isNoteEmpty(makeNote({ content: '' }))).toBe(true);
    expect(isNoteEmpty(makeNote({ content: '   ' }))).toBe(true);
    expect(isNoteEmpty(makeNote({ content: '\n\t  ' }))).toBe(true);
  });

  it('treats any non-whitespace content as non-empty', () => {
    expect(isNoteEmpty(makeNote({ content: 'x' }))).toBe(false);
    expect(isNoteEmpty(makeNote({ content: '  word  ' }))).toBe(false);
  });

  it('drives the auto-delete rule: a tap-and-walk-away note is empty', () => {
    // §3.1: empty notes (no content after edit-end) are automatically deleted.
    const placed = createNote({ projectId: 'p', position: { x: 0, y: 0 } });
    const afterEdit = updateNoteContent(placed, '');
    expect(isNoteEmpty(afterEdit)).toBe(true);
  });
});

describe('updateNotePosition', () => {
  it('returns a new note with the new position and a bumped updatedAt', () => {
    const original = makeNote({ position: { x: 10, y: 20 } });
    const moved = updateNotePosition(original, { x: 300, y: 400 }, '2026-05-14T11:00:00.000Z');
    expect(moved.position).toEqual({ x: 300, y: 400 });
    expect(moved.updatedAt).toBe('2026-05-14T11:00:00.000Z');
    expect(moved.content).toBe(original.content);
    expect(moved.id).toBe(original.id);
  });

  it('does not mutate the input note or share the position reference', () => {
    const original = makeNote({ position: { x: 10, y: 20 } });
    const target = { x: 99, y: 99 };
    const moved = updateNotePosition(original, target);
    target.x = 0;
    target.y = 0;
    expect(moved.position).toEqual({ x: 99, y: 99 });
    expect(original.position).toEqual({ x: 10, y: 20 });
  });
});

describe('findNote', () => {
  it('returns the matching note or undefined', () => {
    const a = makeNote();
    const b = makeNote();
    expect(findNote([a, b], b.id)).toBe(b);
    expect(findNote([a, b], 'dnote_missing')).toBeUndefined();
  });
});

describe('deleteNote', () => {
  it('removes the note from the list and leaves cluster-free notes alone', () => {
    const a = makeNote();
    const b = makeNote();
    const result = deleteNote([a, b], [], a.id);
    expect(result.notes).toEqual([b]);
    expect(result.clusters).toEqual([]);
  });

  it('strips the deleted note from any cluster it belonged to', () => {
    const a = makeNote();
    const b = makeNote();
    const c = makeNote();
    const cluster: DiscoveryCluster = {
      id: 'cluster_x',
      label: 'Her world',
      noteIds: [a.id, b.id, c.id],
    };
    const result = deleteNote([a, b, c], [cluster], b.id);
    expect(result.notes.map((n) => n.id)).toEqual([a.id, c.id]);
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0].noteIds).toEqual([a.id, c.id]);
  });

  it('drops a cluster entirely once its last note is removed (§4.5)', () => {
    const a = makeNote();
    const orphanCluster: DiscoveryCluster = {
      id: 'cluster_lonely',
      label: 'Just this one',
      noteIds: [a.id],
    };
    const otherCluster: DiscoveryCluster = {
      id: 'cluster_other',
      label: 'Still has notes',
      noteIds: ['dnote_other1', 'dnote_other2'],
    };
    const result = deleteNote([a], [orphanCluster, otherCluster], a.id);
    expect(result.notes).toEqual([]);
    expect(result.clusters.map((c) => c.id)).toEqual(['cluster_other']);
  });

  it('is a no-op for an unknown note ID', () => {
    const a = makeNote();
    const cluster: DiscoveryCluster = {
      id: 'cluster_x',
      label: 'L',
      noteIds: [a.id],
    };
    const result = deleteNote([a], [cluster], 'dnote_does_not_exist');
    expect(result.notes).toEqual([a]);
    expect(result.clusters).toEqual([cluster]);
  });

  it('does not mutate the input arrays', () => {
    const a = makeNote();
    const b = makeNote();
    const cluster: DiscoveryCluster = {
      id: 'cluster_x',
      label: 'L',
      noteIds: [a.id, b.id],
    };
    const notes = [a, b];
    const clusters = [cluster];
    const notesSnapshot = [...notes];
    const clusterIdsSnapshot = [...cluster.noteIds];

    deleteNote(notes, clusters, a.id);

    expect(notes).toEqual(notesSnapshot);
    expect(cluster.noteIds).toEqual(clusterIdsSnapshot);
  });
});
