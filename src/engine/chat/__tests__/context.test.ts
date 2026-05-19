/**
 * Chat Engine — context assembly tests.
 *
 * Phase 2 coverage from Spec_ChatEngine.md §13:
 *   - Discovery context: note cap at 50, overflow summary, ordering by recency
 *   - Development context: concept summarization, ConceptType filtering by
 *     active dimension, gap analysis pass-through
 *   - Refinement context: ConceptType filter uses the same active-dimension rule as Development (§3.2 — Refinement no longer widens to a Storyline dimension)
 *   - System prompt layering: Base Identity + phase prompt + project context
 *   - Conversation history: phase scoping, message cap, role/content mapping
 */

import {
  createChatMessage,
  createConcept,
  createConceptType,
  createDiscoveryNote,
  createPhaseState,
  createProject,
} from '../../../models/factories';
import type { ChatMessage, Concept, ConceptType, DiscoveryNote, Project } from '../../../models/types';

import {
  assembleSystemPrompt,
  buildDevelopmentContext,
  buildDiscoveryContext,
  DISCOVERY_NOTE_CAP,
  formatDevelopmentContextBlock,
  formatDiscoveryContextBlock,
  HISTORY_MESSAGE_CAP,
  selectConversationHistory,
} from '../context';
import { BASE_IDENTITY } from '../prompts';

// --- Fixture helpers ---

const PROJECT_ID = 'proj_test';

function makeProject(overrides: Partial<Project> = {}): Project {
  return { ...createProject({ name: 'Test Story', now: '2026-05-18T00:00:00.000Z' }), ...overrides };
}

function makeNote(content: string, isoTime: string): DiscoveryNote {
  return createDiscoveryNote({
    projectId: PROJECT_ID,
    position: { x: 0, y: 0 },
    content,
    now: isoTime,
  });
}

function makeMessage(phase: ChatMessage['phase'], role: ChatMessage['role'], content: string, isoTime: string): ChatMessage {
  return createChatMessage({ projectId: PROJECT_ID, phase, role, content, now: isoTime });
}

// --- buildDiscoveryContext ---

describe('buildDiscoveryContext', () => {
  it('returns project name, full note count, and content of every note when below the cap', () => {
    const project = makeProject({ name: 'Untitled' });
    const notes = [
      makeNote('mansion is crumbling', '2026-05-01T00:00:00.000Z'),
      makeNote('a woman rides away', '2026-05-02T00:00:00.000Z'),
    ];

    const ctx = buildDiscoveryContext({ project, discoveryNotes: notes });

    expect(ctx.projectName).toBe('Untitled');
    expect(ctx.noteCount).toBe(2);
    // Sorted newest-first
    expect(ctx.existingNotes).toEqual(['a woman rides away', 'mansion is crumbling']);
  });

  it('caps the note list at DISCOVERY_NOTE_CAP and keeps the most recent ones', () => {
    const project = makeProject();
    // 53 notes — createdAt 2026-05-01T00:00:00 + i seconds, so newer = later i.
    const notes: DiscoveryNote[] = [];
    for (let i = 0; i < 53; i++) {
      const t = new Date(Date.UTC(2026, 4, 1, 0, 0, i)).toISOString();
      notes.push(makeNote(`note-${i}`, t));
    }

    const ctx = buildDiscoveryContext({ project, discoveryNotes: notes });

    expect(ctx.noteCount).toBe(53);
    expect(ctx.existingNotes).toHaveLength(DISCOVERY_NOTE_CAP);
    // Newest first: note-52, note-51, …, note-3
    expect(ctx.existingNotes[0]).toBe('note-52');
    expect(ctx.existingNotes[DISCOVERY_NOTE_CAP - 1]).toBe('note-3');
  });

  it('returns empty existingNotes when the project has no notes', () => {
    const ctx = buildDiscoveryContext({ project: makeProject(), discoveryNotes: [] });
    expect(ctx).toEqual({ projectName: 'Test Story', existingNotes: [], noteCount: 0 });
  });
});

// --- formatDiscoveryContextBlock ---

describe('formatDiscoveryContextBlock', () => {
  it('renders the (none yet) placeholder when there are no notes', () => {
    const out = formatDiscoveryContextBlock({ projectName: 'P', existingNotes: [], noteCount: 0 });
    expect(out).toContain('PROJECT: P');
    expect(out).toContain('EXISTING DISCOVERY NOTES: (none yet)');
  });

  it('renders the full list and omits the overflow line when nothing is hidden', () => {
    const out = formatDiscoveryContextBlock({
      projectName: 'P',
      existingNotes: ['idea one', 'idea two'],
      noteCount: 2,
    });
    expect(out).toContain('EXISTING DISCOVERY NOTES (2):');
    expect(out).toContain('- idea one');
    expect(out).toContain('- idea two');
    expect(out).not.toContain('earlier notes not shown');
  });

  it('appends the overflow summary when notes are truncated (§3.2)', () => {
    const out = formatDiscoveryContextBlock({
      projectName: 'P',
      existingNotes: ['recent-1', 'recent-2'],
      noteCount: 25,
    });
    expect(out).toContain('EXISTING DISCOVERY NOTES (2 of 25 most recent shown):');
    expect(out).toContain('Plus 23 earlier notes not shown here.');
  });
});

// --- buildDevelopmentContext ---

describe('buildDevelopmentContext', () => {
  function setupProject(): {
    project: Project;
    conceptTypes: ConceptType[];
    concepts: Concept[];
  } {
    const project = makeProject();
    const timePeriod = createConceptType({
      projectId: PROJECT_ID,
      label: 'Time Period',
      description: 'When the world exists',
      dimension: 'WORLD',
      isDefault: true,
      now: '2026-05-01T00:00:00.000Z',
    });
    const motivation = createConceptType({
      projectId: PROJECT_ID,
      label: 'Motivation',
      description: 'What drives them',
      dimension: 'CHARACTER',
      isDefault: true,
      now: '2026-05-01T00:00:00.000Z',
    });
    const themeType = createConceptType({
      projectId: PROJECT_ID,
      label: 'Theme',
      description: 'The abstract ideas the story explores',
      dimension: 'THEME',
      isDefault: true,
      now: '2026-05-01T00:00:00.000Z',
    });
    const motivationConcept = createConcept({
      projectId: PROJECT_ID,
      conceptTypeId: motivation.id,
      dimension: 'CHARACTER',
      value: 'Proving her father wrong',
      now: '2026-05-02T00:00:00.000Z',
    });
    return {
      project,
      conceptTypes: [timePeriod, motivation, themeType],
      concepts: [motivationConcept],
    };
  }

  it('summarizes concepts as {type, value, dimension}, hiding versions and IDs', () => {
    const { project, conceptTypes, concepts } = setupProject();
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts,
      conceptTypes,
      discoveryNotes: [],
    });

    expect(ctx.existingConcepts).toEqual([
      { type: 'Motivation', value: 'Proving her father wrong', dimension: 'CHARACTER' },
    ]);
    // No version metadata leaks into the summary
    expect(JSON.stringify(ctx.existingConcepts)).not.toContain('versionNumber');
    expect(JSON.stringify(ctx.existingConcepts)).not.toContain('currentVersionId');
  });

  it('filters ConceptTypes to the active dimension by default (Development)', () => {
    const { project, conceptTypes, concepts } = setupProject();
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts,
      conceptTypes,
      discoveryNotes: [],
    });

    const dims = ctx.conceptTypes.map((t) => t.dimension);
    expect(dims).toEqual(['CHARACTER']);
    // Existing-concept flag is correctly populated
    expect(ctx.conceptTypes[0]).toEqual({
      label: 'Motivation',
      description: 'What drives them',
      dimension: 'CHARACTER',
      hasExistingConcept: true,
    });
  });

  it('uses the same active-dimension filter for Refinement as Development (no STORYLINE widening)', () => {
    const { project, conceptTypes, concepts } = setupProject();
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts,
      conceptTypes,
      discoveryNotes: [],
      phase: 'REFINEMENT',
    });

    const labels = ctx.conceptTypes.map((t) => t.label).sort();
    expect(labels).toEqual(['Motivation']);
    // THEME types are not included by default — callers who want all three
    // dimensions in Refinement pass includeConceptType: () => true.
    expect(ctx.conceptTypes.some((t) => t.dimension === 'THEME')).toBe(false);
  });

  it('lets callers override the ConceptType filter', () => {
    const { project, conceptTypes, concepts } = setupProject();
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts,
      conceptTypes,
      discoveryNotes: [],
      includeConceptType: () => true, // include all dimensions
    });
    expect(ctx.conceptTypes).toHaveLength(3);
  });

  it('passes the gap analysis through unchanged', () => {
    const { project, conceptTypes, concepts } = setupProject();
    const gap = {
      represented: [
        {
          conceptTypeCodeKey: 'timePeriod',
          dimension: 'WORLD' as const,
          confidence: 'STRONG' as const,
          sourceNoteIds: ['dnote_1'],
        },
      ],
      unrepresented: ['motivation'],
    };
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: gap,
      concepts,
      conceptTypes,
      discoveryNotes: [],
    });
    expect(ctx.gapAnalysis).toBe(gap);
  });

  it('caps Discovery notes at DISCOVERY_NOTE_CAP, newest first', () => {
    const { project, conceptTypes, concepts } = setupProject();
    const notes: DiscoveryNote[] = [];
    for (let i = 0; i < 55; i++) {
      notes.push(makeNote(`note-${i}`, new Date(Date.UTC(2026, 4, 1, 0, 0, i)).toISOString()));
    }
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts,
      conceptTypes,
      discoveryNotes: notes,
    });
    expect(ctx.discoveryNotes).toHaveLength(DISCOVERY_NOTE_CAP);
    expect(ctx.discoveryNotes[0]).toBe('note-54');
  });

  it('skips concepts whose ConceptType has been deleted', () => {
    const { project, conceptTypes } = setupProject();
    // Orphan: refers to a type id that's not in conceptTypes
    const orphan = createConcept({
      projectId: PROJECT_ID,
      conceptTypeId: 'ctype_missing',
      dimension: 'CHARACTER',
      value: 'orphaned',
    });
    const ctx = buildDevelopmentContext({
      project,
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      concepts: [orphan],
      conceptTypes,
      discoveryNotes: [],
    });
    expect(ctx.existingConcepts).toEqual([]);
  });
});

// --- formatDevelopmentContextBlock ---

describe('formatDevelopmentContextBlock', () => {
  it('renders project + active dimension + sections in order', () => {
    const out = formatDevelopmentContextBlock({
      projectName: 'My Story',
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      existingConcepts: [{ type: 'Motivation', value: 'revenge', dimension: 'CHARACTER' }],
      conceptTypes: [
        {
          label: 'Motivation',
          description: 'What drives them',
          dimension: 'CHARACTER',
          hasExistingConcept: true,
        },
      ],
      discoveryNotes: ['a raw note'],
    });

    expect(out).toContain('PROJECT: My Story');
    expect(out).toContain('ACTIVE DIMENSION: CHARACTER');
    expect(out).toContain('AVAILABLE CONCEPT TYPES:');
    expect(out).toContain('- Motivation (CHARACTER) — What drives them [has existing concept]');
    expect(out).toContain('EXISTING CONCEPTS:');
    expect(out).toContain('- Motivation (CHARACTER): revenge');
    expect(out).toContain('DISCOVERY NOTES (raw, for reference):');
    expect(out).toContain('- a raw note');
  });

  it('renders gap analysis as Strong/Partial/Unrepresented buckets', () => {
    const out = formatDevelopmentContextBlock({
      projectName: 'P',
      activeDimension: 'CHARACTER',
      gapAnalysis: {
        represented: [
          { conceptTypeCodeKey: 'timePeriod', dimension: 'WORLD', confidence: 'STRONG', sourceNoteIds: [] },
          { conceptTypeCodeKey: 'architectureExterior', dimension: 'WORLD', confidence: 'PARTIAL', sourceNoteIds: [] },
        ],
        unrepresented: ['motivation', 'fearWeakness'],
      },
      existingConcepts: [],
      conceptTypes: [],
      discoveryNotes: [],
    });

    expect(out).toContain('GAP ANALYSIS:');
    expect(out).toContain('Strong coverage: Time Period');
    expect(out).toContain('Partial coverage: Architecture — Exterior');
    expect(out).toContain('Unrepresented: Motivation, Fear / Weakness');
  });

  it('uses "(none)" for empty gap buckets', () => {
    const out = formatDevelopmentContextBlock({
      projectName: 'P',
      activeDimension: 'CHARACTER',
      gapAnalysis: { represented: [], unrepresented: [] },
      existingConcepts: [],
      conceptTypes: [],
      discoveryNotes: [],
    });
    expect(out).toContain('Strong coverage: (none)');
    expect(out).toContain('Partial coverage: (none)');
    expect(out).toContain('Unrepresented: (none)');
  });

  it('omits the gap section entirely when no analysis is present', () => {
    const out = formatDevelopmentContextBlock({
      projectName: 'P',
      activeDimension: 'CHARACTER',
      gapAnalysis: null,
      existingConcepts: [],
      conceptTypes: [],
      discoveryNotes: [],
    });
    expect(out).not.toContain('GAP ANALYSIS');
  });
});

// --- assembleSystemPrompt ---

describe('assembleSystemPrompt', () => {
  it('layers Base Identity, phase prompt, and project context block', () => {
    const out = assembleSystemPrompt({
      phase: 'DISCOVERY',
      projectContextBlock: 'PROJECT: X',
    });

    const baseIdx = out.indexOf(BASE_IDENTITY);
    const phaseIdx = out.indexOf('PHASE: DISCOVERY');
    const ctxIdx = out.indexOf('PROJECT: X');
    expect(baseIdx).toBe(0);
    expect(phaseIdx).toBeGreaterThan(baseIdx);
    expect(ctxIdx).toBeGreaterThan(phaseIdx);
  });

  it('substitutes activeDimension into the Development prompt', () => {
    const out = assembleSystemPrompt({
      phase: 'DEVELOPMENT',
      projectContextBlock: '',
      activeDimension: 'WORLD',
    });
    // §4.2: "ACTIVE DIMENSION: {activeDimension}" + the body line referencing it
    expect(out).toContain('ACTIVE DIMENSION: WORLD');
    expect(out).toContain('focused on the WORLD dimension');
  });

  it('emits the Refinement prompt for the PRODUCTION phase (§4.4 fallback)', () => {
    const out = assembleSystemPrompt({ phase: 'PRODUCTION', projectContextBlock: '' });
    expect(out).toContain('PHASE: REFINEMENT');
  });

  it('includes Discovery response-format JSON instructions only for Discovery', () => {
    const discovery = assembleSystemPrompt({ phase: 'DISCOVERY', projectContextBlock: '' });
    const development = assembleSystemPrompt({
      phase: 'DEVELOPMENT',
      projectContextBlock: '',
      activeDimension: 'CHARACTER',
    });
    expect(discovery).toContain('"notes": ["note text 1"');
    expect(development).toContain('"conceptTypeLabel": "Time Period"');
    expect(development).not.toContain('"notes": ["note text 1"');
  });
});

// --- selectConversationHistory ---

describe('selectConversationHistory', () => {
  it('keeps only messages in the requested phase (DataModel §11)', () => {
    const messages = [
      makeMessage('DISCOVERY', 'user', 'd1', '2026-05-01T00:00:00.000Z'),
      makeMessage('DEVELOPMENT', 'user', 'dev1', '2026-05-02T00:00:00.000Z'),
      makeMessage('DISCOVERY', 'assistant', 'd2', '2026-05-03T00:00:00.000Z'),
    ];
    const out = selectConversationHistory({ messages, phase: 'DISCOVERY' });
    expect(out).toEqual([
      { role: 'user', content: 'd1' },
      { role: 'assistant', content: 'd2' },
    ]);
  });

  it('returns chronological order even when input is shuffled', () => {
    const messages = [
      makeMessage('DISCOVERY', 'user', 'third', '2026-05-03T00:00:00.000Z'),
      makeMessage('DISCOVERY', 'user', 'first', '2026-05-01T00:00:00.000Z'),
      makeMessage('DISCOVERY', 'user', 'second', '2026-05-02T00:00:00.000Z'),
    ];
    const out = selectConversationHistory({ messages, phase: 'DISCOVERY' });
    expect(out.map((m) => m.content)).toEqual(['first', 'second', 'third']);
  });

  it('keeps the most recent {HISTORY_MESSAGE_CAP} messages when over the cap', () => {
    const messages: ChatMessage[] = [];
    for (let i = 0; i < 50; i++) {
      messages.push(
        makeMessage('DEVELOPMENT', 'user', `m${i}`, new Date(Date.UTC(2026, 4, 1, 0, 0, i)).toISOString()),
      );
    }
    const out = selectConversationHistory({ messages, phase: 'DEVELOPMENT' });
    expect(out).toHaveLength(HISTORY_MESSAGE_CAP);
    expect(out[0].content).toBe('m10');
    expect(out[HISTORY_MESSAGE_CAP - 1].content).toBe('m49');
  });

  it('honors a custom limit override', () => {
    const messages: ChatMessage[] = [];
    for (let i = 0; i < 10; i++) {
      messages.push(
        makeMessage('DEVELOPMENT', 'user', `m${i}`, new Date(Date.UTC(2026, 4, 1, 0, 0, i)).toISOString()),
      );
    }
    const out = selectConversationHistory({ messages, phase: 'DEVELOPMENT', limit: 3 });
    expect(out).toHaveLength(3);
    expect(out.map((m) => m.content)).toEqual(['m7', 'm8', 'm9']);
  });

  it('returns an empty array when no messages match the phase', () => {
    const messages = [makeMessage('DISCOVERY', 'user', 'x', '2026-05-01T00:00:00.000Z')];
    const out = selectConversationHistory({ messages, phase: 'DEVELOPMENT' });
    expect(out).toEqual([]);
  });

  // Sanity check that the assembled context plus history would form a valid
  // SendMessageInput once Phase 3 wires it up. Not testing the client — just
  // proving the shapes compose without intermediate adapters.
  it('produces messages with role + content only (API-shaped)', () => {
    const ph = createPhaseState({ projectId: PROJECT_ID });
    expect(ph.discovery.status).toBe('IN_PROGRESS'); // factory smoke
    const messages = [makeMessage('DISCOVERY', 'user', 'hi', '2026-05-01T00:00:00.000Z')];
    const [first] = selectConversationHistory({ messages, phase: 'DISCOVERY' });
    expect(Object.keys(first).sort()).toEqual(['content', 'role']);
  });
});
