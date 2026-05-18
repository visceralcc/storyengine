/**
 * Key/value storage abstraction for the persistence layer.
 *
 * The spec (Spec_DataPersistence.md §2, §8) envisions a per-project folder on
 * disk served by a local HTTP server. That target is Phase 5. For the v1 proof
 * of concept (Phase 2), Story Engine runs only in Expo Web, so we need data to
 * survive a page refresh — `window.localStorage` is enough.
 *
 * Keeping the backend behind {@link KvStorage} means the higher-level
 * projectStore is unchanged when we swap localStorage for a real local server
 * later. Tests inject {@link createMemoryStorage}.
 */

export interface KvStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  listKeys(prefix: string): Promise<string[]>;
}

export function createMemoryStorage(seed?: Record<string, string>): KvStorage {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    async getItem(key) {
      return map.has(key) ? map.get(key)! : null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
    async removeItem(key) {
      map.delete(key);
    },
    async listKeys(prefix) {
      return Array.from(map.keys()).filter((k) => k.startsWith(prefix));
    },
  };
}

/**
 * Browser-only backend. Throws clearly if called in an environment without
 * `window.localStorage` (e.g. Node, SSR). Constructor must remain side-effect
 * free so the module can be imported in jest without exploding.
 */
export function createLocalStorageStorage(): KvStorage {
  const get = (): Storage => {
    if (typeof globalThis === 'undefined') {
      throw new Error('localStorage backend: globalThis is not defined.');
    }
    const win = (globalThis as { window?: { localStorage?: Storage } }).window;
    if (!win || !win.localStorage) {
      throw new Error('localStorage backend: window.localStorage is not available.');
    }
    return win.localStorage;
  };
  return {
    async getItem(key) {
      return get().getItem(key);
    },
    async setItem(key, value) {
      get().setItem(key, value);
    },
    async removeItem(key) {
      get().removeItem(key);
    },
    async listKeys(prefix) {
      const ls = get();
      const out: string[] = [];
      for (let i = 0; i < ls.length; i += 1) {
        const k = ls.key(i);
        if (k && k.startsWith(prefix)) out.push(k);
      }
      return out;
    },
  };
}
