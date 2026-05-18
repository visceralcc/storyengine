import { createInitialProjectFile, createDiscoveryNote, CURRENT_SCHEMA_VERSION } from '../../models/factories';
import { createMemoryStorage } from '../storage';
import {
  ProjectCorruptError,
  ProjectNotFoundError,
  createProjectStore,
  projectKey,
} from '../projectStore';

describe('projectStore — save + load round trip', () => {
  it('writes a bundle and reads it back identically', async () => {
    const storage = createMemoryStorage();
    const store = createProjectStore(storage);
    const bundle = createInitialProjectFile({ name: 'Test Story' });

    await store.saveProject(bundle);
    const loaded = await store.loadProject(bundle.project.id);

    expect(loaded.project.id).toBe(bundle.project.id);
    expect(loaded.project.name).toBe('Test Story');
    expect(loaded.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(loaded.conceptTypes).toHaveLength(bundle.conceptTypes.length);
    expect(loaded.phaseState.discovery.status).toBe('IN_PROGRESS');
  });

  it('persists discovery notes through save → load', async () => {
    const storage = createMemoryStorage();
    const store = createProjectStore(storage);
    const bundle = createInitialProjectFile({ name: 'With Notes' });
    const note = createDiscoveryNote({
      projectId: bundle.project.id,
      position: { x: 10, y: 20 },
      content: 'a wandering swordsman with a secret',
      color: 'BLUE',
    });
    bundle.discoveryNotes.push(note);

    await store.saveProject(bundle);
    const loaded = await store.loadProject(bundle.project.id);

    expect(loaded.discoveryNotes).toHaveLength(1);
    expect(loaded.discoveryNotes[0]).toEqual(note);
  });

  it('overwrites the previous bundle when saving the same project twice', async () => {
    const storage = createMemoryStorage();
    const store = createProjectStore(storage);
    const bundle = createInitialProjectFile({ name: 'v1' });
    await store.saveProject(bundle);

    const bundle2 = { ...bundle, project: { ...bundle.project, name: 'v2' } };
    await store.saveProject(bundle2);

    const loaded = await store.loadProject(bundle.project.id);
    expect(loaded.project.name).toBe('v2');
  });

  it('always stamps CURRENT_SCHEMA_VERSION on write, even if the in-memory bundle is stale', async () => {
    const storage = createMemoryStorage();
    const store = createProjectStore(storage);
    const bundle = createInitialProjectFile({ name: 'Stale' });
    const stale = { ...bundle, schemaVersion: 1 };

    await store.saveProject(stale);
    const loaded = await store.loadProject(bundle.project.id);
    expect(loaded.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe('projectStore — loadProject errors', () => {
  it('throws ProjectNotFoundError when the project key is missing', async () => {
    const store = createProjectStore(createMemoryStorage());
    await expect(store.loadProject('proj_missing')).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it('throws ProjectCorruptError when the stored value is not valid JSON', async () => {
    const storage = createMemoryStorage();
    await storage.setItem(projectKey('proj_garbled'), '{not json');
    const store = createProjectStore(storage);
    await expect(store.loadProject('proj_garbled')).rejects.toBeInstanceOf(ProjectCorruptError);
  });
});

describe('projectStore — listProjects', () => {
  it('returns an empty list when nothing is saved', async () => {
    const store = createProjectStore(createMemoryStorage());
    expect(await store.listProjects()).toEqual([]);
  });

  it('returns a summary for every saved project', async () => {
    const storage = createMemoryStorage();
    const store = createProjectStore(storage);

    const a = createInitialProjectFile({ name: 'Alpha', description: 'first one' });
    const b = createInitialProjectFile({ name: 'Beta', description: 'second' });
    await store.saveProject(a);
    await store.saveProject(b);

    const list = await store.listProjects();
    expect(list).toHaveLength(2);
    const names = list.map((p) => p.name).sort();
    expect(names).toEqual(['Alpha', 'Beta']);
    expect(list[0]).toHaveProperty('id');
    expect(list[0]).toHaveProperty('currentPhase');
    expect(list[0]).toHaveProperty('updatedAt');
  });

  it('sorts by updatedAt descending (most recent first)', async () => {
    const storage = createMemoryStorage();
    const store = createProjectStore(storage);

    const older = createInitialProjectFile({ name: 'Older', now: '2026-01-01T00:00:00.000Z' });
    const newer = createInitialProjectFile({ name: 'Newer', now: '2026-05-01T00:00:00.000Z' });
    // Save in reverse order to confirm listing — not insertion — drives the sort.
    await store.saveProject(older);
    await store.saveProject(newer);

    const list = await store.listProjects();
    expect(list.map((p) => p.name)).toEqual(['Newer', 'Older']);
  });

  it('skips corrupt entries without crashing the rest of the list', async () => {
    const storage = createMemoryStorage();
    const good = createInitialProjectFile({ name: 'Survivor' });
    await storage.setItem(projectKey(good.project.id), JSON.stringify(good));
    await storage.setItem(projectKey('proj_broken'), '{ not even close');

    const store = createProjectStore(storage);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const list = await store.listProjects();
    warn.mockRestore();

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(good.project.id);
  });

  it('exposes only summary fields — full bundle stays on disk', async () => {
    const storage = createMemoryStorage();
    const store = createProjectStore(storage);
    const bundle = createInitialProjectFile({ name: 'Slim' });
    await store.saveProject(bundle);

    const [summary] = await store.listProjects();
    expect(Object.keys(summary).sort()).toEqual(
      ['currentPhase', 'description', 'id', 'name', 'updatedAt'].sort(),
    );
  });
});

describe('projectStore — deleteProject', () => {
  it('removes a saved project from storage', async () => {
    const storage = createMemoryStorage();
    const store = createProjectStore(storage);
    const bundle = createInitialProjectFile({ name: 'Doomed' });
    await store.saveProject(bundle);

    await store.deleteProject(bundle.project.id);

    expect(await storage.getItem(projectKey(bundle.project.id))).toBeNull();
    await expect(store.loadProject(bundle.project.id)).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it('is a no-op for an unknown project id (idempotent)', async () => {
    const store = createProjectStore(createMemoryStorage());
    await expect(store.deleteProject('proj_never_existed')).resolves.toBeUndefined();
  });
});
