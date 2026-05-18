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

import { EMPTY_CHAT_SYNTHETIC, extractJsonBlock, parseDiscoveryResponse } from '../parser';

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
