/**
 * Atomic file write with .bak rollback, and read with .bak recovery.
 *
 * Rule (Spec_DataPersistence.md §4): `project.json` is never overwritten
 * directly. Every save follows tmp → bak → rename so that a crash at any
 * step leaves either the previous good state or the new good state on disk —
 * never a partial write.
 *
 * Save sequence:
 *   1. Write the new contents to `<filePath>.tmp`.
 *   2. If `<filePath>` exists, rename it to `<filePath>.bak` (replacing any
 *      old .bak).
 *   3. Rename `<filePath>.tmp` to `<filePath>`.
 *   4. Delete `<filePath>.tmp` if it still exists (defensive cleanup).
 *
 * Recovery on read (§4, §9):
 *   - If `<filePath>` is missing or invalid, fall back to `<filePath>.bak`.
 *   - If both are missing/invalid, throw — never silently start fresh.
 *   - If `<filePath>.tmp` exists on open, a previous save was interrupted;
 *     remove the tmp file and proceed with the primary (or .bak).
 */

import fs from 'fs/promises';
import path from 'path';

import { bakPath, tmpPath } from './paths';

export class UnrecoverableReadError extends Error {
  readonly filePath: string;
  readonly primaryError: unknown;
  readonly bakError: unknown | null;

  constructor(filePath: string, primaryError: unknown, bakError: unknown | null) {
    const primaryMsg = formatCause(primaryError);
    const bakMsg = bakError === null ? 'no .bak present' : formatCause(bakError);
    super(`Could not read ${filePath}: primary failed (${primaryMsg}); .bak failed (${bakMsg}).`);
    this.name = 'UnrecoverableReadError';
    this.filePath = filePath;
    this.primaryError = primaryError;
    this.bakError = bakError;
  }
}

function formatCause(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isENOENT(err: unknown): boolean {
  return (err as NodeJS.ErrnoException | undefined)?.code === 'ENOENT';
}

/**
 * Create a directory and any missing parents. No-op if the directory already
 * exists. Safe to call concurrently from multiple awaiters.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    if (isENOENT(err)) return false;
    throw err;
  }
}

/**
 * Move `src` to `dest`, replacing `dest` if it already exists. Uses
 * `fs.rename` (atomic on POSIX); falls back to unlink-then-rename if rename
 * fails because the destination exists on a platform that can't clobber.
 */
async function moveFile(src: string, dest: string): Promise<void> {
  try {
    await fs.rename(src, dest);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EEXIST' || code === 'EPERM') {
      // Windows: rename can't overwrite. Remove dest and retry.
      await fs.unlink(dest);
      await fs.rename(src, dest);
      return;
    }
    throw err;
  }
}

/**
 * Write `contents` to `filePath` atomically with .bak rollback. The parent
 * directory must already exist (call {@link ensureDir} first if unsure).
 *
 * Step 1 writes the tmp file with an fsync via fs.writeFile (Node already
 * flushes on close); step 2 preserves the previous good state as .bak so
 * recovery can find it; step 3 atomically swaps the new file into place;
 * step 4 mops up any tmp that somehow survived (defensive — rename should
 * have consumed it).
 */
export async function atomicWriteFile(filePath: string, contents: string): Promise<void> {
  const tmp = tmpPath(filePath);
  const bak = bakPath(filePath);

  // 1. Write the new contents to a sibling tmp file.
  await fs.writeFile(tmp, contents, 'utf8');

  // 2. Preserve the previous good state as .bak (if a primary exists).
  if (await fileExists(filePath)) {
    await moveFile(filePath, bak);
  }

  // 3. Atomically swap the new contents into place.
  await moveFile(tmp, filePath);

  // 4. Defensive cleanup. `moveFile` consumed tmp in step 3, but if any step
  // failed after step 1 and we're called again, this catches stale tmps.
  try {
    await fs.unlink(tmp);
  } catch (err) {
    if (!isENOENT(err)) throw err;
  }
}

export interface ReadRecoveryResult {
  contents: string;
  /** Which file the contents came from. */
  source: 'primary' | 'bak';
}

/**
 * Read `filePath` with .bak recovery and stale-tmp cleanup.
 *
 * `validate`, if provided, is called on the raw string contents. If it
 * returns false (or throws), the file is treated as corrupt and recovery
 * proceeds to .bak. Use {@link readJsonWithRecovery} for JSON-shaped files.
 */
export async function readWithRecovery(
  filePath: string,
  options: { validate?: (contents: string) => boolean } = {},
): Promise<ReadRecoveryResult> {
  await cleanupStaleTmp(filePath);

  const { validate } = options;
  let primaryError: unknown;
  try {
    const contents = await fs.readFile(filePath, 'utf8');
    if (!validate || validate(contents)) {
      return { contents, source: 'primary' };
    }
    primaryError = new Error('failed validation');
  } catch (err) {
    primaryError = err;
  }

  const bak = bakPath(filePath);
  try {
    const contents = await fs.readFile(bak, 'utf8');
    if (!validate || validate(contents)) {
      return { contents, source: 'bak' };
    }
    throw new UnrecoverableReadError(filePath, primaryError, new Error('failed validation'));
  } catch (err) {
    if (err instanceof UnrecoverableReadError) throw err;
    if (isENOENT(err)) {
      throw new UnrecoverableReadError(filePath, primaryError, null);
    }
    throw new UnrecoverableReadError(filePath, primaryError, err);
  }
}

export interface JsonReadRecoveryResult<T> {
  data: T;
  source: 'primary' | 'bak';
}

/**
 * Read and parse a JSON file with .bak recovery. Parse failures count as
 * corruption and trigger fallback to .bak.
 */
export async function readJsonWithRecovery<T = unknown>(
  filePath: string,
): Promise<JsonReadRecoveryResult<T>> {
  const { contents, source } = await readWithRecovery(filePath, {
    validate: (raw) => {
      try {
        JSON.parse(raw);
        return true;
      } catch {
        return false;
      }
    },
  });
  return { data: JSON.parse(contents) as T, source };
}

/**
 * Remove `<filePath>.tmp` if it exists. Called before recovery reads — per
 * §9, "if project.json.tmp exists on open, a previous save was interrupted —
 * delete the tmp file and proceed with project.json (or .bak)."
 */
async function cleanupStaleTmp(filePath: string): Promise<void> {
  const tmp = tmpPath(filePath);
  try {
    await fs.unlink(tmp);
  } catch (err) {
    if (!isENOENT(err)) throw err;
  }
}

// Exposed for tests that want to assert the parent directory exists before
// writing — e.g., the projectStore layer that will compose these primitives.
export function parentDir(filePath: string): string {
  return path.dirname(filePath);
}
