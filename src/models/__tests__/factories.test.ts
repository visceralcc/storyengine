import { DEFAULT_CONCEPT_TYPES } from '../defaults';
import {
  createChatMessage,
  createConcept,
  createConceptType,
  createConceptVersion,
  createDiscoveryNote,
  createImage,
  createInsight,
  createPhaseState,
  createProject,
  generateId,
  initializeProject,
  seedDefaultConceptTypes,
} from '../factories';

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const NANOID_BODY = /^[A-Za-z0-9_-]{8}$/;

function expectId(id: string, prefix: string) {
  expect(id.startsWith(`${prefix}_`)).toBe(true);
  expect(NANOID_BODY.test(id.slice(prefix.length + 1))).toBe(true);
}

describe('generateId', () => {
  it('produces unique IDs with the correct prefix and an 8-char URL-safe body', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      const id = generateId('dnote');
      expectId(id, 'dnote');
      ids.add(id);
    }
    expect(ids.size).toBe(500);
  });
});

describe('createProject', () => {
  it('produces a proj_-prefixed entity in DISCOVERY phase with ISO 8601 timestamps', () => {
    const project = createProject({ name: '1820s France Story' });
    expectId(project.id, 'proj');
    expect(project.name).toBe('1820s France Story');
    expect(project.description).toBe('');
    expect(project.currentPhase).toBe('DISCOVERY');
    expect(ISO_8601.test(project.createdAt)).toBe(true);
    expect(ISO_8601.test(project.updatedAt)).toBe(true);
    expect(project.createdAt).toBe(project.updatedAt);
  });

  it('accepts an explicit description and timestamp', () => {
    const project = createProject({
      name: 'Test',
      description: 'A test project',
      now: '2026-05-14T10:00:00.000Z',
    });
    expect(project.description).toBe('A test project');
    expect(project.createdAt).toBe('2026-05-14T10:00:00.000Z');
  });
});

describe('createPhaseState', () => {
  it('defaults to IN_PROGRESS discovery with no clusters, no gravity, no gap analysis', () => {
    const state = createPhaseState({ projectId: 'proj_test1234' });
    expectId(state.id, 'phase');
    expect(state.projectId).toBe('proj_test1234');
    expect(state.discovery.status).toBe('IN_PROGRESS');
    expect(state.discovery.clusters).toEqual([]);
    expect(state.discovery.creativeGravity).toBeNull();
    expect(state.discovery.gapAnalysis).toBeNull();
    expect(state.development.lastActiveDimension).toBe('CHARACTER');
  });

  it('honors an explicit lastActiveDimension', () => {
    const state = createPhaseState({ projectId: 'proj_x', lastActiveDimension: 'WORLD' });
    expect(state.development.lastActiveDimension).toBe('WORLD');
  });
});

describe('createDiscoveryNote', () => {
  it('produces a dnote_-prefixed entity with empty content and null cluster by default', () => {
    const note = createDiscoveryNote({
      projectId: 'proj_a',
      position: { x: 120, y: 240 },
    });
    expectId(note.id, 'dnote');
    expect(note.projectId).toBe('proj_a');
    expect(note.content).toBe('');
    expect(note.position).toEqual({ x: 120, y: 240 });
    expect(note.color).toBe('BLUE');
    expect(note.imageId).toBeNull();
    expect(note.clusterId).toBeNull();
    expect(ISO_8601.test(note.createdAt)).toBe(true);
    expect(note.createdAt).toBe(note.updatedAt);
  });

  it('copies position by value (no shared reference)', () => {
    const pos = { x: 1, y: 2 };
    const note = createDiscoveryNote({ projectId: 'proj_a', position: pos });
    pos.x = 999;
    expect(note.position.x).toBe(1);
  });

  it('accepts a non-default color', () => {
    const note = createDiscoveryNote({
      projectId: 'proj_a',
      position: { x: 0, y: 0 },
      color: 'PURPLE',
    });
    expect(note.color).toBe('PURPLE');
  });
});

describe('createConceptType', () => {
  it('produces a ctype_-prefixed entity scoped to a project', () => {
    const type = createConceptType({
      projectId: 'proj_a',
      label: 'Time Period',
      description: 'When the world exists',
      dimension: 'WORLD',
      isDefault: true,
    });
    expectId(type.id, 'ctype');
    expect(type.label).toBe('Time Period');
    expect(type.dimension).toBe('WORLD');
    expect(type.isDefault).toBe(true);
  });
});

describe('seedDefaultConceptTypes', () => {
  it('seeds exactly 29 defaults split 11 World + 13 Character + 5 Theme', () => {
    const types = seedDefaultConceptTypes('proj_a');
    expect(types).toHaveLength(29);
    expect(types.filter((t) => t.dimension === 'WORLD')).toHaveLength(11);
    expect(types.filter((t) => t.dimension === 'CHARACTER')).toHaveLength(13);
    expect(types.filter((t) => t.dimension === 'THEME')).toHaveLength(5);
    expect(types.every((t) => t.isDefault)).toBe(true);
    expect(types.every((t) => t.projectId === 'proj_a')).toBe(true);
  });

  it('preserves the labels declared in DEFAULT_CONCEPT_TYPES, all unique', () => {
    const types = seedDefaultConceptTypes('proj_a');
    const labels = types.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const def of DEFAULT_CONCEPT_TYPES) {
      expect(labels).toContain(def.label);
    }
  });

  it('seeds the five Theme ConceptTypes (Theme, Tone, Subtext, Motif / Symbol, Stakes)', () => {
    const types = seedDefaultConceptTypes('proj_a');
    const themeLabels = types.filter((t) => t.dimension === 'THEME').map((t) => t.label);
    expect(themeLabels).toEqual(
      expect.arrayContaining(['Theme', 'Tone', 'Subtext', 'Motif / Symbol', 'Stakes']),
    );
    expect(themeLabels).toHaveLength(5);
  });
});

describe('createConceptVersion', () => {
  it('produces a ver_-prefixed entity bound to a concept', () => {
    const v = createConceptVersion({
      conceptId: 'con_test',
      versionNumber: 1,
      value: '1820s',
    });
    expectId(v.id, 'ver');
    expect(v.conceptId).toBe('con_test');
    expect(v.versionNumber).toBe(1);
    expect(v.value).toBe('1820s');
    expect(v.sourceMessageId).toBeNull();
  });
});

describe('createConcept', () => {
  it('always ships with exactly one ConceptVersion (atomic creation)', () => {
    const concept = createConcept({
      projectId: 'proj_a',
      conceptTypeId: 'ctype_x',
      dimension: 'WORLD',
      value: '1820s',
    });
    expectId(concept.id, 'con');
    expect(concept.versions).toHaveLength(1);
    expect(concept.versions[0].conceptId).toBe(concept.id);
    expect(concept.versions[0].versionNumber).toBe(1);
    expect(concept.versions[0].value).toBe('1820s');
    expect(concept.currentVersionId).toBe(concept.versions[0].id);
  });

  it('initializes empty relation arrays and a default origin position', () => {
    const concept = createConcept({
      projectId: 'proj_a',
      conceptTypeId: 'ctype_x',
      dimension: 'CHARACTER',
      value: 'A reluctant heir',
    });
    expect(concept.relatedConceptIds).toEqual([]);
    expect(concept.imageIds).toEqual([]);
    expect(concept.position).toEqual({ x: 0, y: 0 });
    expect(concept.sourceMessageId).toBeNull();
  });
});

describe('createChatMessage', () => {
  it('produces a msg_-prefixed entity scoped by phase and role', () => {
    const msg = createChatMessage({
      projectId: 'proj_a',
      phase: 'DISCOVERY',
      role: 'user',
      content: 'a woman on a horse',
    });
    expectId(msg.id, 'msg');
    expect(msg.phase).toBe('DISCOVERY');
    expect(msg.role).toBe('user');
    expect(msg.conceptIds).toEqual([]);
  });
});

describe('createImage', () => {
  it('produces an img_-prefixed entity with the GENERATED source carrying its prompt', () => {
    const img = createImage({
      projectId: 'proj_a',
      attachedToId: 'con_x',
      attachedToType: 'CONCEPT',
      source: 'GENERATED',
      generationPrompt: 'a golden mansion in Provence',
      filePath: 'images/img_abc.png',
      mimeType: 'image/png',
      width: 1024,
      height: 1024,
    });
    expectId(img.id, 'img');
    expect(img.source).toBe('GENERATED');
    expect(img.generationPrompt).toBe('a golden mansion in Provence');
    expect(img.attachedToType).toBe('CONCEPT');
  });

  it('produces an UPLOADED image with a null generationPrompt by default', () => {
    const img = createImage({
      projectId: 'proj_a',
      attachedToId: 'dnote_x',
      attachedToType: 'DISCOVERY_NOTE',
      source: 'UPLOADED',
      filePath: 'images/img_xyz.jpg',
      mimeType: 'image/jpeg',
      width: 800,
      height: 600,
    });
    expect(img.source).toBe('UPLOADED');
    expect(img.generationPrompt).toBeNull();
  });
});

describe('createInsight', () => {
  it('produces an ins_-prefixed entity in PENDING status', () => {
    const ins = createInsight({
      projectId: 'proj_a',
      type: 'SUGGESTION',
      title: 'Consider adding a motivation',
      description: 'Your character lacks a clear drive.',
      referencedConceptIds: ['con_a', 'con_b'],
    });
    expectId(ins.id, 'ins');
    expect(ins.status).toBe('PENDING');
    expect(ins.resolvedAt).toBeNull();
    expect(ins.referencedConceptIds).toEqual(['con_a', 'con_b']);
  });
});

describe('initializeProject', () => {
  it('returns a project in DISCOVERY phase with one PhaseState and 29 default ConceptTypes', () => {
    const bundle = initializeProject({ name: '1820s France Story' });
    expect(bundle.project.currentPhase).toBe('DISCOVERY');
    expectId(bundle.project.id, 'proj');
    expect(bundle.phaseState.projectId).toBe(bundle.project.id);
    expect(bundle.phaseState.discovery.status).toBe('IN_PROGRESS');
    expect(bundle.conceptTypes).toHaveLength(29);
    expect(bundle.conceptTypes.every((t) => t.projectId === bundle.project.id)).toBe(true);
    expect(bundle.conceptTypes.every((t) => t.isDefault)).toBe(true);
  });

  it('is JSON-serializable end-to-end (no methods, no prototypes, no circular refs)', () => {
    const bundle = initializeProject({ name: 'Serialize me' });
    const roundTripped = JSON.parse(JSON.stringify(bundle));
    expect(roundTripped).toEqual(bundle);
  });
});
