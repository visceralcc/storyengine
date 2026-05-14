/**
 * Path resolution for the Story Engine on-disk project layout.
 *
 *   ~/StoryEngine/
 *   ├── projects/
 *   │   └── proj_xxx/
 *   │       ├── project.json
 *   │       ├── project.json.bak
 *   │       └── images/
 *   └── preferences.json
 *
 * Source of truth: docs/foundation/Spec_DataPersistence.md §2.
 *
 * Every public function takes the root directory as a parameter so tests can
 * point at a temp dir instead of the real home folder. {@link defaultRoot}
 * returns the production location.
 */

import os from 'os';
import path from 'path';

export function defaultRoot(): string {
  return path.join(os.homedir(), 'StoryEngine');
}

export function projectsDir(root: string): string {
  return path.join(root, 'projects');
}

export function projectDir(root: string, projectId: string): string {
  return path.join(projectsDir(root), projectId);
}

export function projectJsonPath(root: string, projectId: string): string {
  return path.join(projectDir(root, projectId), 'project.json');
}

export function projectImagesDir(root: string, projectId: string): string {
  return path.join(projectDir(root, projectId), 'images');
}

export function preferencesPath(root: string): string {
  return path.join(root, 'preferences.json');
}

// Sidecar paths used by the atomic-write pattern (§4).
export function bakPath(filePath: string): string {
  return `${filePath}.bak`;
}

export function tmpPath(filePath: string): string {
  return `${filePath}.tmp`;
}
