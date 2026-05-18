/**
 * Chat Engine — parser tests.
 *
 * Phase 3 coverage from Spec_ChatEngine §5.1, §10:
 *   - Brainstorming mode (no JSON block) → notes empty, chatResponse = full text
 *   - Valid Discovery JSON → notes parsed, chatResponse = text before block
 *   - JSON-only response → synthetic chat message (§10)
 *   - Malformed JSON → entire response treated as chat, parseError set
 *   - Shape mismatch (notes not an array) → parseError set
 *   - Multiple JSON blocks → last one wins
 *   - Non-string entries in notes array → filtered
 */

import {
  EMPTY_CHAT_SYNTHETIC,
  extractJsonBlock,
  parseDiscoveryResponse,
  parseExtractionResponse,
} from '../parser';

describe('extractJsonBlock', () => {
  it('returns null json when no fenced block is present', () => {
    expect(extractJsonBlock('just chat, no block')).toEqual({
      text: 'just chat, no block',
      json: null,
    });
  });

  it('extracts the JSON body and strips the fence from the surrounding text', () => {
    const input = 'Here are your notes.\n\n```json\n{"notes":["a","b"]}\n```';
    expect(extractJsonBlock(input)).toEqual({
      text: 'Here are your notes.',
      json: '{"notes":["a","b"]}',
    });
  });

  it('takes the LAST block when multiple ```json blocks appear', () => {
    const input = '```json\n{"notes":["first"]}\n```\nthen\n```json\n{"notes":["last"]}\n```';
    const out = extractJsonBlock(input);
    expect(out.json).toBe('{"notes":["last"]}');
    expect(out.text).toContain('then');
  });

  it('ignores plain ``` blocks without a json language tag', () => {
    // Defensive — a model that drops the language tag should not poison the parse.
    const input = 'chat\n\n```\n{"notes":["x"]}\n```';
    expect(extractJsonBlock(input)).toEqual({ text: input.trim(), json: null });
  });
});

describe('parseDiscoveryResponse', () => {
  it('treats a response with no JSON block as brainstorming (zero notes)', () => {
    const out = parseDiscoveryResponse(
      'What kind of conflict are you imagining for her?',
    );
    expect(out.notes).toEqual([]);
    expect(out.chatResponse).toBe('What kind of conflict are you imagining for her?');
    expect(out.parseError).toBeNull();
  });

  it('parses a well-formed Discovery JSON block (§5.1)', () => {
    const response =
      'I captured five fragments — let me know what else comes to mind.\n\n```json\n{"notes":["a woman on a horse","a letter in her pocket"]}\n```';
    const out = parseDiscoveryResponse(response);

    expect(out.notes).toEqual(['a woman on a horse', 'a letter in her pocket']);
    expect(out.chatResponse).toBe(
      'I captured five fragments — let me know what else comes to mind.',
    );
    expect(out.parseError).toBeNull();
  });

  it('treats a missing notes field as an empty notes array', () => {
    const out = parseDiscoveryResponse('chat\n\n```json\n{}\n```');
    expect(out.notes).toEqual([]);
    expect(out.parseError).toBeNull();
  });

  it('falls back to the synthetic chat message when only JSON is returned (§10)', () => {
    const response = '```json\n{"notes":["one","two"]}\n```';
    const out = parseDiscoveryResponse(response);
    expect(out.chatResponse).toBe(EMPTY_CHAT_SYNTHETIC);
    expect(out.notes).toEqual(['one', 'two']);
  });

  it('treats malformed JSON as plain chat and surfaces parseError (§10)', () => {
    const response = 'Sorry, this got garbled.\n\n```json\n{"notes": [\n```';
    const out = parseDiscoveryResponse(response);
    expect(out.notes).toEqual([]);
    expect(out.chatResponse).toBe(response.trim());
    expect(out.parseError).toBeInstanceOf(Error);
  });

  it('treats schema mismatch (notes is not an array) as a parse error', () => {
    const response = 'chat\n\n```json\n{"notes": "not-an-array"}\n```';
    const out = parseDiscoveryResponse(response);
    expect(out.notes).toEqual([]);
    expect(out.parseError).toBeInstanceOf(Error);
    expect(out.parseError?.message).toMatch(/schema/i);
  });

  it('filters non-string and whitespace-only entries from the notes array', () => {
    const response =
      'chat\n\n```json\n{"notes":["good","",null,"   ","also good", 42]}\n```';
    const out = parseDiscoveryResponse(response);
    expect(out.notes).toEqual(['good', 'also good']);
    expect(out.parseError).toBeNull();
  });
});

describe('parseExtractionResponse (§5.2)', () => {
  it('treats a response with no JSON block as chat-only (all arrays empty)', () => {
    const out = parseExtractionResponse('Tell me more about her motivation.');
    expect(out.concepts).toEqual([]);
    expect(out.updatedConcepts).toEqual([]);
    expect(out.suggestedNewTypes).toEqual([]);
    expect(out.chatResponse).toBe('Tell me more about her motivation.');
    expect(out.parseError).toBeNull();
  });

  it('parses concepts, updatedConcepts, and suggestedNewTypes together', () => {
    const response = [
      "I've captured these and proposed a new type.",
      '',
      '```json',
      JSON.stringify({
        concepts: [
          { conceptTypeLabel: 'Time Period', value: '1820s France', dimension: 'WORLD' },
        ],
        updatedConcepts: [
          { existingConceptType: 'Physical Build', newValue: 'Tall and athletic', editType: 'REFINE' },
        ],
        suggestedNewTypes: [
          { label: 'Cultural Practice', description: 'Rituals and customs', dimension: 'WORLD' },
        ],
      }),
      '```',
    ].join('\n');

    const out = parseExtractionResponse(response);
    expect(out.concepts).toEqual([
      { conceptTypeLabel: 'Time Period', value: '1820s France', dimension: 'WORLD' },
    ]);
    expect(out.updatedConcepts).toEqual([
      { existingConceptType: 'Physical Build', newValue: 'Tall and athletic', editType: 'REFINE' },
    ]);
    expect(out.suggestedNewTypes).toEqual([
      { label: 'Cultural Practice', description: 'Rituals and customs', dimension: 'WORLD' },
    ]);
    expect(out.parseError).toBeNull();
  });

  it('defaults an invalid editType to REFINE (§5.3)', () => {
    const response =
      '```json\n{"updatedConcepts":[{"existingConceptType":"Motivation","newValue":"X","editType":"WAT"}]}\n```';
    const out = parseExtractionResponse(response);
    expect(out.updatedConcepts[0].editType).toBe('REFINE');
  });

  it('accepts a missing editType field and treats it as REFINE', () => {
    const response =
      '```json\n{"updatedConcepts":[{"existingConceptType":"Motivation","newValue":"X"}]}\n```';
    const out = parseExtractionResponse(response);
    expect(out.updatedConcepts[0].editType).toBe('REFINE');
  });

  it('preserves RETHINK editType when present', () => {
    const response =
      '```json\n{"updatedConcepts":[{"existingConceptType":"Motivation","newValue":"X","editType":"RETHINK"}]}\n```';
    const out = parseExtractionResponse(response);
    expect(out.updatedConcepts[0].editType).toBe('RETHINK');
  });

  it('drops entries with missing required fields', () => {
    const response = [
      '```json',
      JSON.stringify({
        concepts: [
          { conceptTypeLabel: '', value: 'x', dimension: 'WORLD' }, // empty label
          { conceptTypeLabel: 'Time Period', value: '', dimension: 'WORLD' }, // empty value
          { conceptTypeLabel: 'Time Period', value: '1820s', dimension: 'NOPE' }, // bad dim
          { conceptTypeLabel: 'Time Period', value: '1820s', dimension: 'WORLD' }, // good
        ],
      }),
      '```',
    ].join('\n');
    const out = parseExtractionResponse(response);
    expect(out.concepts).toEqual([
      { conceptTypeLabel: 'Time Period', value: '1820s', dimension: 'WORLD' },
    ]);
  });

  it('normalizes dimension casing to uppercase', () => {
    const response =
      '```json\n{"concepts":[{"conceptTypeLabel":"Time Period","value":"1820s","dimension":"world"}]}\n```';
    const out = parseExtractionResponse(response);
    expect(out.concepts[0].dimension).toBe('WORLD');
  });

  it('treats missing top-level arrays as empty', () => {
    const out = parseExtractionResponse('```json\n{}\n```');
    expect(out.concepts).toEqual([]);
    expect(out.updatedConcepts).toEqual([]);
    expect(out.suggestedNewTypes).toEqual([]);
    expect(out.parseError).toBeNull();
  });

  it('falls back to plain chat on malformed JSON', () => {
    const response = 'chat\n\n```json\n{not json}\n```';
    const out = parseExtractionResponse(response);
    expect(out.concepts).toEqual([]);
    expect(out.chatResponse).toBe(response.trim());
    expect(out.parseError).toBeInstanceOf(Error);
  });

  it('returns parseError when the JSON root is an array, not an object', () => {
    const out = parseExtractionResponse('chat\n\n```json\n[1,2,3]\n```');
    expect(out.parseError).toBeInstanceOf(Error);
    expect(out.parseError?.message).toMatch(/root/);
  });

  it('uses the synthetic chat message when only a JSON block is returned (§10)', () => {
    const out = parseExtractionResponse('```json\n{"concepts":[]}\n```');
    expect(out.chatResponse).toBe(EMPTY_CHAT_SYNTHETIC);
  });

  it('trims whitespace inside concept fields', () => {
    const response =
      '```json\n{"concepts":[{"conceptTypeLabel":"  Time Period  ","value":"  1820s  ","dimension":"WORLD"}]}\n```';
    const out = parseExtractionResponse(response);
    expect(out.concepts[0]).toEqual({
      conceptTypeLabel: 'Time Period',
      value: '1820s',
      dimension: 'WORLD',
    });
  });
});
