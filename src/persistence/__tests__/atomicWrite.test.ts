import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import {
  atomicWriteFile,
  ensureDir,
  readJsonWithRecovery,
  readWithRecovery,
  UnrecoverableReadError,
} from '../atomicWrite';
import { bakPath, tmpPath } from '../paths';

async function makeTempRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'storyengine-atomic-'));
}

async function rmrf(p: string): Promise<void> {
  await fs.rm(p, { recursive: true, force: true });
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

describe('ensureDir', () => {
  let root: string;
  beforeEach(async () => {
    root = await makeTempRoot();
  });
  afterEach(async () => {
    await rmrf(root);
  });

  it('creates a deeply nested directory and is idempotent', async () => {
    const nested = path.join(root, 'a', 'b', 'c');
    await ensureDir(nested);
    await ensureDir(nested);
    const stat = await fs.stat(nested);
    expect(stat.isDirectory()).toBe(true);
  });
});

describe('atomicWriteFile', () => {
  let root: string;
  let target: string;
  beforeEach(async () => {
    root = await makeTempRoot();
    target = path.join(root, 'project.json');
  });
  afterEach(async () => {
    await rmrf(root);
  });

  it('writes the file when nothing exists yet — no .bak, no .tmp left behind', async () => {
    await atomicWriteFile(target, '{"v":1}');
    expect(await fs.readFile(target, 'utf8')).toBe('{"v":1}');
    expect(await exists(bakPath(target))).toBe(false);
    expect(await exists(tmpPath(target))).toBe(false);
  });

  it('promotes the previous file to .bak on the second write', async () => {
    await atomicWriteFile(target, '{"v":1}');
    await atomicWriteFile(target, '{"v":2}');
    expect(await fs.readFile(target, 'utf8')).toBe('{"v":2}');
    expect(await fs.readFile(bakPath(target), 'utf8')).toBe('{"v":1}');
    expect(await exists(tmpPath(target))).toBe(false);
  });

  it('overwrites a stale .bak on subsequent writes (the .bak always reflects the previous write, not the oldest)', async () => {
    await atomicWriteFile(target, '{"v":1}');
    await atomicWriteFile(target, '{"v":2}');
    await atomicWriteFile(target, '{"v":3}');
    expect(await fs.readFile(target, 'utf8')).toBe('{"v":3}');
    expect(await fs.readFile(bakPath(target), 'utf8')).toBe('{"v":2}');
  });
});

describe('readWithRecovery', () => {
  let root: string;
  let target: string;
  beforeEach(async () => {
    root = await makeTempRoot();
    target = path.join(root, 'project.json');
  });
  afterEach(async () => {
    await rmrf(root);
  });

  it('returns primary contents when the primary is healthy', async () => {
    await atomicWriteFile(target, '{"v":1}');
    const result = await readWithRecovery(target);
    expect(result.contents).toBe('{"v":1}');
    expect(result.source).toBe('primary');
  });

  it('falls back to .bak when the primary is missing', async () => {
    await atomicWriteFile(target, '{"v":1}');
    await atomicWriteFile(target, '{"v":2}');
    await fs.unlink(target);
    const result = await readWithRecovery(target);
    expect(result.contents).toBe('{"v":1}');
    expect(result.source).toBe('bak');
  });

  it('falls back to .bak when the primary fails validation', async () => {
    await atomicWriteFile(target, '{"v":1}');
    await atomicWriteFile(target, 'not-json-anymore');
    const result = await readWithRecovery(target, {
      validate: (raw) => {
        try { JSON.parse(raw); return true; } catch { return false; }
      },
    });
    expect(result.contents).toBe('{"v":1}');
    expect(result.source).toBe('bak');
  });

  it('throws UnrecoverableReadError when both primary and .bak are missing', async () => {
    await expect(readWithRecovery(target)).rejects.toBeInstanceOf(UnrecoverableReadError);
  });

  it('throws UnrecoverableReadError when both primary and .bak fail validation', async () => {
    await fs.writeFile(target, 'corrupt', 'utf8');
    await fs.writeFile(bakPath(target), 'also corrupt', 'utf8');
    await expect(
      readWithRecovery(target, { validate: (raw) => raw.startsWith('{') }),
    ).rejects.toBeInstanceOf(UnrecoverableReadError);
  });

  it('cleans up a stale .tmp on read (interrupted save)', async () => {
    await atomicWriteFile(target, '{"v":1}');
    // Simulate an interrupted save: .tmp left behind from a crashed atomicWriteFile.
    await fs.writeFile(tmpPath(target), '{"v":99-partial}', 'utf8');
    expect(await exists(tmpPath(target))).toBe(true);

    const result = await readWithRecovery(target);
    expect(result.source).toBe('primary');
    expect(await exists(tmpPath(target))).toBe(false);
  });
});

describe('readJsonWithRecovery', () => {
  let root: string;
  let target: string;
  beforeEach(async () => {
    root = await makeTempRoot();
    target = path.join(root, 'project.json');
  });
  afterEach(async () => {
    await rmrf(root);
  });

  it('parses healthy JSON from the primary', async () => {
    await atomicWriteFile(target, '{"schemaVersion":2,"name":"test"}');
    const result = await readJsonWithRecovery<{ schemaVersion: number; name: string }>(target);
    expect(result.source).toBe('primary');
    expect(result.data).toEqual({ schemaVersion: 2, name: 'test' });
  });

  it('treats a primary JSON parse failure as corruption and falls back to .bak', async () => {
    // Seed both files directly: primary is garbage, .bak is the previous good payload.
    await fs.writeFile(target, '{ this is not json', 'utf8');
    await fs.writeFile(bakPath(target), '{"good":true}', 'utf8');
    const result = await readJsonWithRecovery<{ good: boolean }>(target);
    expect(result.source).toBe('bak');
    expect(result.data).toEqual({ good: true });
  });

  it('throws UnrecoverableReadError when both primary and .bak are unparseable', async () => {
    await fs.writeFile(target, 'broken', 'utf8');
    await fs.writeFile(bakPath(target), 'also broken', 'utf8');
    await expect(readJsonWithRecovery(target)).rejects.toBeInstanceOf(UnrecoverableReadError);
  });
});

describe('end-to-end save loop', () => {
  let root: string;
  let target: string;
  beforeEach(async () => {
    root = await makeTempRoot();
    const projDir = path.join(root, 'projects', 'proj_demo');
    await ensureDir(projDir);
    target = path.join(projDir, 'project.json');
  });
  afterEach(async () => {
    await rmrf(root);
  });

  it('survives 10 successive writes and always reads back the latest contents', async () => {
    for (let i = 1; i <= 10; i += 1) {
      await atomicWriteFile(target, JSON.stringify({ schemaVersion: 2, n: i }));
      const { data, source } = await readJsonWithRecovery<{ n: number }>(target);
      expect(source).toBe('primary');
      expect(data.n).toBe(i);
    }
  });

  it('recovers the previous save when the latest save is wiped post-write', async () => {
    await atomicWriteFile(target, JSON.stringify({ n: 1 }));
    await atomicWriteFile(target, JSON.stringify({ n: 2 }));
    await fs.unlink(target);
    const { data, source } = await readJsonWithRecovery<{ n: number }>(target);
    expect(source).toBe('bak');
    expect(data.n).toBe(1);
  });
});
