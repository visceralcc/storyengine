/**
 * Story Engine — Data Model
 *
 * Plain-object interfaces and string-literal enums for every entity in the system.
 * No classes, no methods, no prototypes — pure data so JSON serialization is trivial.
 *
 * Source of truth: docs/foundation/Spec_DataModel.md (v0.3) and the GapAnalysis
 * additions defined in docs/discovery/Spec_DiscoveryEngine.md §10.
 */

// --- Enums ---

export type Dimension = 'WORLD' | 'CHARACTER' | 'THEME';

export type Phase = 'DISCOVERY' | 'DEVELOPMENT' | 'REFINEMENT' | 'PRODUCTION';

export type InsightType = 'SUGGESTION' | 'CONNECTION' | 'CONFLICT';

export type InsightStatus = 'PENDING' | 'ACCEPTED' | 'DISMISSED';

export type ImageSource = 'GENERATED' | 'UPLOADED';

export type ChatRole = 'user' | 'assistant';

export type DiscoveryStatus = 'IN_PROGRESS' | 'CONSOLIDATED';

export type AttachmentTargetType = 'CONCEPT' | 'DISCOVERY_NOTE';

export type GapConfidence = 'STRONG' | 'PARTIAL';

export type NoteColor = 'BLUE' | 'GREEN' | 'PURPLE' | 'GOLD' | 'PINK' | 'GRAY';

// Core/Evolve/Set Aside creative tag — drives the ui_eval bar color in the
// Development phase. Added per Spec_Development_Design.md §6.1.
export type CreativeTag = 'CORE' | 'EVOLVE' | 'SET_ASIDE';

// --- Shared shapes ---

export interface Position {
  x: number;
  y: number;
}

// --- Entities ---

export interface Project {
  id: string;
  name: string;
  description: string;
  currentPhase: Phase;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryCluster {
  id: string;
  label: string;
  noteIds: string[];
}

export interface ConceptTypeMapping {
  conceptTypeCodeKey: string;
  dimension: Dimension;
  confidence: GapConfidence;
  sourceNoteIds: string[];
}

export interface GapAnalysis {
  represented: ConceptTypeMapping[];
  unrepresented: string[];
}

export interface PhaseState {
  id: string;
  projectId: string;
  discovery: {
    status: DiscoveryStatus;
    clusters: DiscoveryCluster[];
    creativeGravity: Dimension | null;
    gapAnalysis: GapAnalysis | null;
  };
  development: {
    lastActiveDimension: Dimension;
  };
  refinement: Record<string, never>;
  production: Record<string, never>;
}

export interface DiscoveryNote {
  id: string;
  projectId: string;
  content: string;
  position: Position;
  color: NoteColor;
  imageId: string | null;
  clusterId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConceptType {
  id: string;
  projectId: string;
  label: string;
  description: string;
  dimension: Dimension;
  isDefault: boolean;
  createdAt: string;
}

export interface ConceptVersion {
  id: string;
  conceptId: string;
  versionNumber: number;
  value: string;
  sourceMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Concept {
  id: string;
  projectId: string;
  conceptTypeId: string;
  dimension: Dimension;
  currentVersionId: string;
  versions: ConceptVersion[];
  // The user's expanded written definition, authored in the Development phase.
  // Kept separate from the version `value` (the Discovery summary) so the
  // original summary is preserved. See Spec_Development_Design.md §6.1.
  definition: string | null;
  // Core/Evolve/Set Aside tag — maps to the ui_eval bar. Defaults to 'CORE'.
  creativeTag: CreativeTag;
  relatedConceptIds: string[];
  sourceMessageId: string | null;
  imageIds: string[];
  position: Position;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  phase: Phase;
  role: ChatRole;
  content: string;
  conceptIds: string[];
  createdAt: string;
}

export interface Image {
  id: string;
  projectId: string;
  attachedToId: string;
  attachedToType: AttachmentTargetType;
  source: ImageSource;
  generationPrompt: string | null;
  filePath: string;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface Insight {
  id: string;
  projectId: string;
  type: InsightType;
  title: string;
  description: string;
  referencedConceptIds: string[];
  status: InsightStatus;
  createdAt: string;
  resolvedAt: string | null;
}

// --- Persistence bundle (see Spec_DataPersistence.md §3) ---

export interface ProjectFile {
  schemaVersion: number;
  project: Project;
  phaseState: PhaseState;
  discoveryNotes: DiscoveryNote[];
  conceptTypes: ConceptType[];
  concepts: Concept[];
  chatMessages: ChatMessage[];
  images: Image[];
  insights: Insight[];
}
