/**
 * Chat Engine — context assembly.
 *
 * Builds the `system` prompt and `messages` array for every API call. Three
 * layers, in order:
 *
 *   1. Base Identity (prompts.ts — constant)
 *   2. Phase Instructions (prompts.ts — varies by phase + active dimension)
 *   3. Project Context  (this file — varies by project state)
 *
 * Conversation history is filtered to the current phase (DataModel §11 — chat
 * is scoped by phase) and capped at 40 messages (§3.3).
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §3.
 */

import { DEFAULT_CONCEPT_TYPES } from '../../models/defaults';
import type {
  ChatMessage,
  Concept,
  ConceptType,
  DiscoveryNote,
  Dimension,
  GapAnalysis,
  Phase,
  Project,
} from '../../models/types';

import { BASE_IDENTITY, buildPhasePrompt, type PhasePromptOptions } from './prompts';
import type { ChatApiMessage } from './types';

// --- Caps (§3.2, §3.3) ---

/** Discovery context cap on note inclusion. */
export const DISCOVERY_NOTE_CAP = 50;

/** Per §3.3, the API call sends at most 40 messages of history. */
export const HISTORY_MESSAGE_CAP = 40;

// --- Context shapes (§3.2, §12) ---

export interface DiscoveryContext {
  projectName: string;
  /** Content of up to {@link DISCOVERY_NOTE_CAP} most-recent notes. */
  existingNotes: string[];
  /** Total number of DiscoveryNotes in the project (used for the "Plus N earlier" line). */
  noteCount: number;
}

export interface ConceptSummary {
  type: string;
  value: string;
  dimension: Dimension;
}

export interface ConceptTypeSummary {
  label: string;
  description: string;
  dimension: Dimension;
  hasExistingConcept: boolean;
}

export interface DevelopmentContext {
  projectName: string;
  activeDimension: Dimension;
  gapAnalysis: GapAnalysis | null;
  existingConcepts: ConceptSummary[];
  conceptTypes: ConceptTypeSummary[];
  discoveryNotes: string[];
}

// --- Builders ---

export interface BuildDiscoveryContextInput {
  project: Project;
  discoveryNotes: DiscoveryNote[];
}

/**
 * Assemble a {@link DiscoveryContext} from project state.
 *
 * Caps the note list at the 50 most recent by `createdAt` so the system prompt
 * stays under context-window pressure even on long Discovery sessions.
 * `noteCount` always reflects the true total — the formatter uses the
 * difference to emit the "Plus N earlier notes not shown here" summary
 * (§3.2).
 */
export function buildDiscoveryContext(input: BuildDiscoveryContextInput): DiscoveryContext {
  const sorted = [...input.discoveryNotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recent = sorted.slice(0, DISCOVERY_NOTE_CAP);
  return {
    projectName: input.project.name,
    existingNotes: recent.map((n) => n.content),
    noteCount: input.discoveryNotes.length,
  };
}

export interface BuildDevelopmentContextInput {
  project: Project;
  activeDimension: Dimension;
  gapAnalysis: GapAnalysis | null;
  /** All Concepts in the project. The builder summarizes type + current value. */
  concepts: Concept[];
  /** All ConceptTypes in the project (default + custom). */
  conceptTypes: ConceptType[];
  discoveryNotes: DiscoveryNote[];
  /**
   * Override which ConceptTypes are surfaced as "available" in the context.
   * Defaults to the active dimension. Callers can pass a custom predicate
   * (e.g. all dimensions) without touching the builder.
   */
  includeConceptType?: (type: ConceptType) => boolean;
  /** Phase the context is for. Defaults to DEVELOPMENT. Retained for callers that pass it explicitly; both Development and Refinement use the same filter (§3.2). */
  phase?: Phase;
}

/**
 * Assemble a {@link DevelopmentContext}.
 *
 * Concepts are reduced to {type, value, dimension} so the model never sees
 * version history, IDs, or canvas positions — §3.2 calls these out as
 * unnecessary noise. ConceptTypes are filtered to the active dimension —
 * the same filter applies in Development and Refinement (§3.2). Callers who
 * want all three dimensions surfaced (e.g. cross-dimension Refinement work)
 * can pass `includeConceptType: () => true`.
 */
export function buildDevelopmentContext(input: BuildDevelopmentContextInput): DevelopmentContext {
  const includesByDefault = defaultConceptTypeFilter(input.activeDimension);
  const filterFn = input.includeConceptType ?? includesByDefault;

  const typesById = new Map(input.conceptTypes.map((t) => [t.id, t]));
  const typeIdsWithConcept = new Set(input.concepts.map((c) => c.conceptTypeId));

  const conceptTypes: ConceptTypeSummary[] = input.conceptTypes
    .filter(filterFn)
    .map((t) => ({
      label: t.label,
      description: t.description,
      dimension: t.dimension,
      hasExistingConcept: typeIdsWithConcept.has(t.id),
    }));

  const existingConcepts: ConceptSummary[] = input.concepts.flatMap((c) => {
    const type = typesById.get(c.conceptTypeId);
    if (!type) return [];
    const currentVersion = c.versions.find((v) => v.id === c.currentVersionId);
    if (!currentVersion) return [];
    return [{ type: type.label, value: currentVersion.value, dimension: c.dimension }];
  });

  const sortedNotes = [...input.discoveryNotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recentNoteContents = sortedNotes.slice(0, DISCOVERY_NOTE_CAP).map((n) => n.content);

  return {
    projectName: input.project.name,
    activeDimension: input.activeDimension,
    gapAnalysis: input.gapAnalysis,
    existingConcepts,
    conceptTypes,
    discoveryNotes: recentNoteContents,
  };
}

function defaultConceptTypeFilter(active: Dimension): (type: ConceptType) => boolean {
  return (t) => t.dimension === active;
}

// --- Formatters (project context block) ---

/**
 * Format a Discovery context as the project-context string appended to the
 * system prompt. Empty sections are omitted entirely so the model isn't
 * primed by "no notes yet" boilerplate.
 */
export function formatDiscoveryContextBlock(ctx: DiscoveryContext): string {
  const lines: string[] = [`PROJECT: ${ctx.projectName}`];

  if (ctx.noteCount === 0) {
    lines.push('', 'EXISTING DISCOVERY NOTES: (none yet)');
  } else {
    const shown = ctx.existingNotes.length;
    const overflow = ctx.noteCount - shown;
    const header =
      overflow > 0
        ? `EXISTING DISCOVERY NOTES (${shown} of ${ctx.noteCount} most recent shown):`
        : `EXISTING DISCOVERY NOTES (${shown}):`;
    lines.push('', header);
    for (const note of ctx.existingNotes) lines.push(`- ${note}`);
    if (overflow > 0) lines.push(`Plus ${overflow} earlier notes not shown here.`);
  }
  return lines.join('\n');
}

/**
 * Format a Development context as the project-context string. Sections that
 * are empty are skipped; the gap analysis is rendered in three buckets so the
 * model can scan for STRONG/PARTIAL/unrepresented without re-deriving them.
 */
export function formatDevelopmentContextBlock(ctx: DevelopmentContext): string {
  const lines: string[] = [
    `PROJECT: ${ctx.projectName}`,
    `ACTIVE DIMENSION: ${ctx.activeDimension}`,
  ];

  // Concept Types
  if (ctx.conceptTypes.length > 0) {
    lines.push('', 'AVAILABLE CONCEPT TYPES:');
    for (const t of ctx.conceptTypes) {
      const marker = t.hasExistingConcept ? ' [has existing concept]' : '';
      lines.push(`- ${t.label} (${t.dimension}) — ${t.description}${marker}`);
    }
  }

  // Existing concepts
  if (ctx.existingConcepts.length > 0) {
    lines.push('', 'EXISTING CONCEPTS:');
    for (const c of ctx.existingConcepts) {
      lines.push(`- ${c.type} (${c.dimension}): ${c.value}`);
    }
  } else {
    lines.push('', 'EXISTING CONCEPTS: (none yet)');
  }

  // Gap analysis
  if (ctx.gapAnalysis) {
    lines.push('', 'GAP ANALYSIS:');
    const strong = ctx.gapAnalysis.represented.filter((m) => m.confidence === 'STRONG');
    const partial = ctx.gapAnalysis.represented.filter((m) => m.confidence === 'PARTIAL');
    lines.push(`Strong coverage: ${formatGapLine(strong.map((m) => labelForCodeKey(m.conceptTypeCodeKey)))}`);
    lines.push(`Partial coverage: ${formatGapLine(partial.map((m) => labelForCodeKey(m.conceptTypeCodeKey)))}`);
    lines.push(
      `Unrepresented: ${formatGapLine(ctx.gapAnalysis.unrepresented.map(labelForCodeKey))}`,
    );
  }

  // Discovery notes (raw)
  if (ctx.discoveryNotes.length > 0) {
    lines.push('', 'DISCOVERY NOTES (raw, for reference):');
    for (const n of ctx.discoveryNotes) lines.push(`- ${n}`);
  }

  return lines.join('\n');
}

function formatGapLine(labels: string[]): string {
  return labels.length === 0 ? '(none)' : labels.join(', ');
}

/**
 * Translate a gap-analysis `codeKey` (e.g. `"timePeriod"`) to its human-readable
 * ConceptType label (`"Time Period"`). Unknown keys fall back to the raw key —
 * a custom ConceptType created mid-session won't be in `DEFAULT_CONCEPT_TYPES`
 * but its codeKey will still be readable.
 */
function labelForCodeKey(codeKey: string): string {
  const def = DEFAULT_CONCEPT_TYPES.find((d) => d.codeKey === codeKey);
  return def ? def.label : codeKey;
}

// --- System prompt assembly ---

export interface AssembleSystemPromptInput {
  phase: Phase;
  projectContextBlock: string;
  activeDimension?: Dimension;
}

/**
 * Concatenate Base Identity + phase instructions + project context into the
 * full `system` field for the API request. Sections are separated by blank
 * lines so the model parses the structure cleanly.
 */
export function assembleSystemPrompt(input: AssembleSystemPromptInput): string {
  const phaseOptions: PhasePromptOptions = input.activeDimension
    ? { activeDimension: input.activeDimension }
    : {};
  return [
    BASE_IDENTITY,
    buildPhasePrompt(input.phase, phaseOptions),
    input.projectContextBlock,
  ].join('\n\n');
}

// --- Conversation history (§3.3) ---

export interface SelectConversationHistoryInput {
  messages: ChatMessage[];
  phase: Phase;
  limit?: number;
}

/**
 * Pick the messages that travel with the API request:
 *   - filtered to the current `phase` (per DataModel §11, chat is phase-scoped)
 *   - capped at the most recent `limit` (default {@link HISTORY_MESSAGE_CAP})
 *   - mapped to the `{role, content}` shape the model sees
 *   - leading assistant messages dropped (Anthropic Messages API requires
 *     the first message to be role: "user")
 *
 * "Most recent" is by `createdAt`, ascending — the order the model expects.
 * Older messages remain persisted (chat is append-only); they just don't
 * cross the wire on this call.
 */
export function selectConversationHistory(input: SelectConversationHistoryInput): ChatApiMessage[] {
  const limit = input.limit ?? HISTORY_MESSAGE_CAP;
  const phaseMessages = input.messages
    .filter((m) => m.phase === input.phase)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const tail = phaseMessages.slice(Math.max(0, phaseMessages.length - limit));
  const apiMessages = tail.map((m) => ({ role: m.role, content: m.content }));

  // The Anthropic Messages API requires messages[0].role === 'user'. Engine-
  // generated opening messages (e.g. Development §9.1) are assistant-role and
  // may be the first message in a phase. Drop any leading assistant messages
  // so the API call is valid. They remain in the persisted history and in the
  // system prompt's project context.
  while (apiMessages.length > 0 && apiMessages[0].role === 'assistant') {
    apiMessages.shift();
  }

  return apiMessages;
}
