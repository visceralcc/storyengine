/**
 * Project lifecycle: save, load, list, delete.
 *
 * Source of truth: Spec_DataPersistence.md §6 (project lifecycle), §3 (schema).
 *
 * The spec describes a per-project folder with `project.json`, `.bak`, and an
 * `images/` subfolder, written atomically through a local HTTP server (Phase
 * 5). For Phase 2 (this file), Story Engine runs only in Expo Web, so the
 * full bundle is serialized as one JSON value under a single key. The
 * {@link KvStorage} abstraction keeps the API stable when we move to a real
 * local server later.
 *
 * Departures from the spec, called out so we can revisit in Phase 5:
 *   - No `project.json.bak` recovery — localStorage writes are atomic enough
 *     for a single-tab proof of concept (§4).
 *   - No per-project folder or `images/` subfolder — that's Phase 4.
 *   - No save queue / debounce — that's Phase 3. Callers save synchronously.
 */

import { CURRENT_SCHEMA_VERSION } from '../models/factories';
import type { Phase, ProjectFile } from '../models/types';

import {
  type KvStorage,
  createLocalStorageStorage,
  createMemoryStorage,
} from './storage';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  currentPhase: Phase;
  updatedAt: string;
}

export class ProjectNotFoundError extends Error {
  readonly projectId: string;
  constructor(projectId: string) {
    super(`Project ${projectId} not found in storage.`);
    this.name = 'ProjectNotFoundError';
    this.projectId = projectId;
  }
}

export class ProjectCorruptError extends Error {
  readonly projectId: string;
  constructor(projectId: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`Project ${projectId} is corrupt: ${detail}`);
    this.name = 'ProjectCorruptError';
    this.projectId = projectId;
  }
}

export interface ProjectStore {
  saveProject(bundle: ProjectFile): Promise<void>;
  loadProject(projectId: string): Promise<ProjectFile>;
  listProjects(): Promise<ProjectSummary[]>;
  deleteProject(projectId: string): Promise<void>;
}

const KEY_PREFIX = 'storyengine/projects/';
export function projectKey(projectId: string): string {
  return `${KEY_PREFIX}${projectId}`;
}

function summarize(bundle: ProjectFile): ProjectSummary {
  const { id, name, description, currentPhase, updatedAt } = bundle.project;
  return { id, name, description, currentPhase, updatedAt };
}

export function createProjectStore(storage: KvStorage): ProjectStore {
  return {
    async saveProject(bundle) {
      // Always write the current schema version; in-memory migration (§3)
      // bumps older bundles up before they reach this layer.
      const toWrite: ProjectFile = {
        ...bundle,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };
      const serialized = JSON.stringify(toWrite, null, 2);
      await storage.setItem(projectKey(bundle.project.id), serialized);
    },

    async loadProject(projectId) {
      const raw = await storage.getItem(projectKey(projectId));
      if (raw === null) throw new ProjectNotFoundError(projectId);
      try {
        return JSON.parse(raw) as ProjectFile;
      } catch (err) {
        throw new ProjectCorruptError(projectId, err);
      }
    },

    async listProjects() {
      const keys = await storage.listKeys(KEY_PREFIX);
      const summaries: ProjectSummary[] = [];
      for (const key of keys) {
        const raw = await storage.getItem(key);
        if (raw === null) continue; // race: removed between listKeys and get
        try {
          const bundle = JSON.parse(raw) as ProjectFile;
          summaries.push(summarize(bundle));
        } catch {
          // Spec §6: corrupt projects are skipped, not surfaced. v1 has no UI
          // for surfacing them yet; logging here so we can spot it in dev.
          // eslint-disable-next-line no-console
          console.warn(`[projectStore] skipping unparseable project at ${key}`);
        }
      }
      summaries.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
      return summaries;
    },

    async deleteProject(projectId) {
      await storage.removeItem(projectKey(projectId));
    },
  };
}

// Re-export the in-memory backend for tests + ad-hoc use.
export { createMemoryStorage };

// Lazy singleton used by app code. Creating the localStorage backend at module
// load time would throw under jest (no window); deferring lets the same module
// be imported by tests that swap in a memory store via createProjectStore.
let _defaultStore: ProjectStore | null = null;
export function getDefaultProjectStore(): ProjectStore {
  if (!_defaultStore) {
    _defaultStore = createProjectStore(createLocalStorageStorage());
  }
  return _defaultStore;
}
