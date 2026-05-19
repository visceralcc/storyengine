/**
 * Factory functions for every Story Engine entity.
 *
 * All factories produce plain objects: prefixed-nanoid IDs, ISO 8601 timestamps,
 * no methods, no prototypes. Serializing the result with `JSON.stringify` is
 * exactly what gets written to disk.
 *
 * Source of truth: docs/foundation/Spec_DataModel.md §2, §15, §19.
 */

import { customAlphabet } from 'nanoid';

import { DEFAULT_CONCEPT_TYPES } from './defaults';
import { DEFAULT_NOTE_COLOR } from './noteColors';
import type {
  AttachmentTargetType,
  ChatMessage,
  ChatRole,
  Concept,
  ConceptType,
  ConceptVersion,
  Dimension,
  DiscoveryNote,
  Image,
  ImageSource,
  Insight,
  InsightType,
  NoteColor,
  Phase,
  PhaseState,
  Position,
  Project,
  ProjectFile,
} from './types';

// Current project.json schema version (Spec_DataPersistence.md §3).
export const CURRENT_SCHEMA_VERSION = 2;

// nanoid: default URL-safe alphabet, length 8 after prefix (§2).
const NANOID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
const nano = customAlphabet(NANOID_ALPHABET, 8);

export type IdPrefix =
  | 'proj'
  | 'phase'
  | 'dnote'
  | 'cluster'
  | 'ctype'
  | 'con'
  | 'ver'
  | 'msg'
  | 'img'
  | 'ins';

export function generateId(prefix: IdPrefix): string {
  return `${prefix}_${nano()}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

// --- Project ---

export interface CreateProjectInput {
  name: string;
  description?: string;
  currentPhase?: Phase;
  now?: string;
}

export function createProject(input: CreateProjectInput): Project {
  const now = input.now ?? nowISO();
  return {
    id: generateId('proj'),
    name: input.name,
    description: input.description ?? '',
    currentPhase: input.currentPhase ?? 'DISCOVERY',
    createdAt: now,
    updatedAt: now,
  };
}

// --- PhaseState ---

export interface CreatePhaseStateInput {
  projectId: string;
  lastActiveDimension?: Dimension;
}

export function createPhaseState(input: CreatePhaseStateInput): PhaseState {
  return {
    id: generateId('phase'),
    projectId: input.projectId,
    discovery: {
      status: 'IN_PROGRESS',
      clusters: [],
      creativeGravity: null,
      gapAnalysis: null,
    },
    development: {
      lastActiveDimension: input.lastActiveDimension ?? 'CHARACTER',
    },
    refinement: {},
    production: {},
  };
}

// --- ConceptType ---

export interface CreateConceptTypeInput {
  projectId: string;
  label: string;
  description: string;
  dimension: Dimension;
  isDefault?: boolean;
  now?: string;
}

export function createConceptType(input: CreateConceptTypeInput): ConceptType {
  return {
    id: generateId('ctype'),
    projectId: input.projectId,
    label: input.label,
    description: input.description,
    dimension: input.dimension,
    isDefault: input.isDefault ?? false,
    createdAt: input.now ?? nowISO(),
  };
}

export function seedDefaultConceptTypes(projectId: string, now: string = nowISO()): ConceptType[] {
  return DEFAULT_CONCEPT_TYPES.map((def) =>
    createConceptType({
      projectId,
      label: def.label,
      description: def.description,
      dimension: def.dimension,
      isDefault: true,
      now,
    }),
  );
}

// --- DiscoveryNote ---

export interface CreateDiscoveryNoteInput {
  projectId: string;
  position: Position;
  content?: string;
  color?: NoteColor;
  imageId?: string | null;
  clusterId?: string | null;
  now?: string;
}

export function createDiscoveryNote(input: CreateDiscoveryNoteInput): DiscoveryNote {
  const now = input.now ?? nowISO();
  return {
    id: generateId('dnote'),
    projectId: input.projectId,
    content: input.content ?? '',
    position: { x: input.position.x, y: input.position.y },
    color: input.color ?? DEFAULT_NOTE_COLOR,
    imageId: input.imageId ?? null,
    clusterId: input.clusterId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

// --- ConceptVersion ---

export interface CreateConceptVersionInput {
  conceptId: string;
  versionNumber: number;
  value: string;
  sourceMessageId?: string | null;
  now?: string;
}

export function createConceptVersion(input: CreateConceptVersionInput): ConceptVersion {
  const now = input.now ?? nowISO();
  return {
    id: generateId('ver'),
    conceptId: input.conceptId,
    versionNumber: input.versionNumber,
    value: input.value,
    sourceMessageId: input.sourceMessageId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

// --- Concept ---
// Per DataModel §15 rule 5: a new Concept MUST always have exactly one
// ConceptVersion. Creation is atomic — the version is generated inside the
// factory and embedded in `versions`.

export interface CreateConceptInput {
  projectId: string;
  conceptTypeId: string;
  dimension: Dimension;
  value: string;
  position?: Position;
  sourceMessageId?: string | null;
  now?: string;
}

export function createConcept(input: CreateConceptInput): Concept {
  const now = input.now ?? nowISO();
  const conceptId = generateId('con');
  const firstVersion = createConceptVersion({
    conceptId,
    versionNumber: 1,
    value: input.value,
    sourceMessageId: input.sourceMessageId ?? null,
    now,
  });
  return {
    id: conceptId,
    projectId: input.projectId,
    conceptTypeId: input.conceptTypeId,
    dimension: input.dimension,
    currentVersionId: firstVersion.id,
    versions: [firstVersion],
    relatedConceptIds: [],
    sourceMessageId: input.sourceMessageId ?? null,
    imageIds: [],
    position: input.position ?? { x: 0, y: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

// --- ChatMessage ---

export interface CreateChatMessageInput {
  projectId: string;
  phase: Phase;
  role: ChatRole;
  content: string;
  conceptIds?: string[];
  now?: string;
}

export function createChatMessage(input: CreateChatMessageInput): ChatMessage {
  return {
    id: generateId('msg'),
    projectId: input.projectId,
    phase: input.phase,
    role: input.role,
    content: input.content,
    conceptIds: input.conceptIds ?? [],
    createdAt: input.now ?? nowISO(),
  };
}

// --- Image ---

export interface CreateImageInput {
  projectId: string;
  attachedToId: string;
  attachedToType: AttachmentTargetType;
  source: ImageSource;
  filePath: string;
  mimeType: string;
  width: number;
  height: number;
  generationPrompt?: string | null;
  now?: string;
}

export function createImage(input: CreateImageInput): Image {
  return {
    id: generateId('img'),
    projectId: input.projectId,
    attachedToId: input.attachedToId,
    attachedToType: input.attachedToType,
    source: input.source,
    generationPrompt: input.generationPrompt ?? null,
    filePath: input.filePath,
    mimeType: input.mimeType,
    width: input.width,
    height: input.height,
    createdAt: input.now ?? nowISO(),
  };
}

// --- Insight ---

export interface CreateInsightInput {
  projectId: string;
  type: InsightType;
  title: string;
  description: string;
  referencedConceptIds: string[];
  now?: string;
}

export function createInsight(input: CreateInsightInput): Insight {
  return {
    id: generateId('ins'),
    projectId: input.projectId,
    type: input.type,
    title: input.title,
    description: input.description,
    referencedConceptIds: [...input.referencedConceptIds],
    status: 'PENDING',
    createdAt: input.now ?? nowISO(),
    resolvedAt: null,
  };
}

// --- New project bundle ---
// A freshly created project always ships with one PhaseState and the 29 default
// ConceptTypes seeded (Spec_DataPersistence.md §6, Spec_DataModel.md §16).

export interface InitializeProjectInput {
  name: string;
  description?: string;
  now?: string;
}

export interface NewProjectBundle {
  project: Project;
  phaseState: PhaseState;
  conceptTypes: ConceptType[];
}

export function initializeProject(input: InitializeProjectInput): NewProjectBundle {
  const now = input.now ?? nowISO();
  const project = createProject({
    name: input.name,
    description: input.description,
    currentPhase: 'DISCOVERY',
    now,
  });
  const phaseState = createPhaseState({ projectId: project.id });
  const conceptTypes = seedDefaultConceptTypes(project.id, now);
  return { project, phaseState, conceptTypes };
}

/**
 * Build a complete {@link ProjectFile} for a brand-new project. The bundle is
 * what gets handed to projectStore.saveProject on creation.
 */
export function createInitialProjectFile(input: InitializeProjectInput): ProjectFile {
  const { project, phaseState, conceptTypes } = initializeProject(input);
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    project,
    phaseState,
    discoveryNotes: [],
    conceptTypes,
    concepts: [],
    chatMessages: [],
    images: [],
    insights: [],
  };
}
