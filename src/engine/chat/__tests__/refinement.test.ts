/**
 * Chat Engine — refinement helper tests.
 *
 * Covers Spec_ChatEngine §5.4 / §6.1 behavior for REFINE and RETHINK.
 */

import { createConcept, createConceptVersion } from '../../../models/factories';
import type { Concept } from '../../../models/types';

import { applyRefine, applyRethink } from '../refinement';

const PROJECT_ID = 'proj_test';
const TYPE_ID = 'ctype_test';
const NOW = '2026-05-18T12:00:00.000Z';
const LATER = '2026-05-18T13:00:00.000Z';

function makeConcept(): Concept {
  return createConcept({
    projectId: PROJECT_ID,
    conceptTypeId: TYPE_ID,
    dimension: 'CHARACTER',
    value: 'original',
    sourceMessageId: 'msg_original',
    now: NOW,
  });
}

describe('applyRefine', () => {
  it('updates the current version value, updatedAt, and sourceMessageId in place', () => {
    const concept = makeConcept();
    const originalVersionId = concept.currentVersionId;

    const refined = applyRefine({
      concept,
      newValue: 'updated value',
      sourceMessageId: 'msg_refine',
      now: LATER,
    });

    expect(refined.versions).toHaveLength(1);
    expect(refined.currentVersionId).toBe(originalVersionId);
    expect(refined.versions[0].value).toBe('updated value');
    expect(refined.versions[0].updatedAt).toBe(LATER);
    expect(refined.versions[0].sourceMessageId).toBe('msg_refine');
    expect(refined.updatedAt).toBe(LATER);
  });

  it('preserves the original concept (no mutation)', () => {
    const concept = makeConcept();
    const snapshot = JSON.parse(JSON.stringify(concept));
    applyRefine({ concept, newValue: 'next', now: LATER });
    expect(concept).toEqual(snapshot);
  });

  it('returns the concept unchanged if currentVersionId points nowhere (corrupt state)', () => {
    const concept = { ...makeConcept(), currentVersionId: 'ver_missing' };
    const out = applyRefine({ concept, newValue: 'x', now: LATER });
    expect(out).toBe(concept);
  });
});

describe('applyRethink', () => {
  it('creates a new version with versionNumber = max + 1 and points currentVersionId at it', () => {
    const concept = makeConcept();
    const out = applyRethink({
      concept,
      newValue: 'a fundamentally different idea',
      sourceMessageId: 'msg_rethink',
      now: LATER,
    });

    expect(out.versions).toHaveLength(2);
    const newVersion = out.versions[1];
    expect(newVersion.versionNumber).toBe(2);
    expect(newVersion.value).toBe('a fundamentally different idea');
    expect(newVersion.sourceMessageId).toBe('msg_rethink');
    expect(out.currentVersionId).toBe(newVersion.id);
    expect(out.updatedAt).toBe(LATER);
  });

  it('preserves the original version with its original value (history append-only)', () => {
    const concept = makeConcept();
    const out = applyRethink({ concept, newValue: 'new', now: LATER });
    expect(out.versions[0].value).toBe('original');
    expect(out.versions[0].versionNumber).toBe(1);
  });

  it('increments past the highest existing versionNumber, not the version count', () => {
    // Simulate a Concept whose history skipped a number (defensive — shouldn't
    // happen in v1, but the next-number derivation should still be max+1).
    const base = makeConcept();
    const v3 = createConceptVersion({
      conceptId: base.id,
      versionNumber: 5,
      value: 'v5',
      now: NOW,
    });
    const concept: Concept = { ...base, versions: [...base.versions, v3], currentVersionId: v3.id };
    const out = applyRethink({ concept, newValue: 'next', now: LATER });
    expect(out.versions[2].versionNumber).toBe(6);
    expect(out.currentVersionId).toBe(out.versions[2].id);
  });
});
