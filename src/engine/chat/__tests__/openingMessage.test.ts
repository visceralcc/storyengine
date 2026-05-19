/**
 * Chat Engine — opening message tests (Phase 6).
 *
 * Covers Spec_ChatEngine §9.1 — Development opening message per
 * creativeGravity. Also includes a small integration test demonstrating
 * the Phase 6 build-sequence end-to-end: gap analysis + creative gravity
 * from Discovery → Development context block + opening message.
 */

import { selectConversationHistory } from '../context';
import {
  generateOpeningMessage,
  openingMessageText,
  type OpeningMessageGravity,
} from '../openingMessage';

const PROJECT_ID = 'proj_test';

describe('openingMessageText (§9.1)', () => {
  // Verify the four spec-prescribed strings verbatim. If the spec changes,
  // these tests fail loudly — that's intentional.
  const cases: { gravity: OpeningMessageGravity; matcher: RegExp }[] = [
    { gravity: 'CHARACTER', matcher: /energy around a character/ },
    { gravity: 'WORLD', matcher: /vivid world/ },
    { gravity: 'THEME', matcher: /strong sense of what this story is about/ },
    { gravity: null, matcher: /rich mix of ideas/ },
  ];

  it.each(cases)('returns the spec-prescribed message for gravity=$gravity', ({ gravity, matcher }) => {
    expect(openingMessageText(gravity)).toMatch(matcher);
  });

  it("THEME message asks about themes and feelings, not 'tension' or 'conflict'", () => {
    const text = openingMessageText('THEME');
    expect(text).toMatch(/themes and feelings/);
    expect(text).not.toMatch(/conflict/i);
    expect(text).not.toMatch(/tension/i);
  });

  it('null-gravity fallback references "what the story is about", not "a conflict"', () => {
    const text = openingMessageText(null);
    expect(text).toMatch(/what the story is about/);
    expect(text).not.toMatch(/conflict/i);
  });
});

describe('generateOpeningMessage', () => {
  it('produces a ChatMessage with role=assistant, phase=DEVELOPMENT, correct content', () => {
    const msg = generateOpeningMessage({
      projectId: PROJECT_ID,
      creativeGravity: 'CHARACTER',
      now: '2026-05-18T12:00:00.000Z',
    });

    expect(msg.projectId).toBe(PROJECT_ID);
    expect(msg.phase).toBe('DEVELOPMENT');
    expect(msg.role).toBe('assistant');
    expect(msg.content).toBe(openingMessageText('CHARACTER'));
    expect(msg.conceptIds).toEqual([]);
    expect(msg.createdAt).toBe('2026-05-18T12:00:00.000Z');
    expect(msg.id).toMatch(/^msg_/);
  });

  it('handles null gravity (mixed bag) per §9.1', () => {
    const msg = generateOpeningMessage({
      projectId: PROJECT_ID,
      creativeGravity: null,
    });
    expect(msg.content).toMatch(/Where would you like to start/);
  });

  it('produces unique IDs across calls', () => {
    const a = generateOpeningMessage({ projectId: PROJECT_ID, creativeGravity: 'WORLD' });
    const b = generateOpeningMessage({ projectId: PROJECT_ID, creativeGravity: 'WORLD' });
    expect(a.id).not.toBe(b.id);
  });
});

describe('Phase 6 integration — opening message lives in selectable history', () => {
  // The opening message is persisted as a normal ChatMessage. Once added to
  // the project, it should appear in `selectConversationHistory` so the API
  // call sees it as the first turn.
  it('is returned by selectConversationHistory as the first DEVELOPMENT message', () => {
    const opening = generateOpeningMessage({
      projectId: PROJECT_ID,
      creativeGravity: 'CHARACTER',
      now: '2026-05-18T12:00:00.000Z',
    });
    const history = selectConversationHistory({
      messages: [opening],
      phase: 'DEVELOPMENT',
    });
    expect(history).toEqual([{ role: 'assistant', content: opening.content }]);
  });

  it('does NOT leak into the DISCOVERY history (phase scoping, DataModel §11)', () => {
    const opening = generateOpeningMessage({
      projectId: PROJECT_ID,
      creativeGravity: 'WORLD',
      now: '2026-05-18T12:00:00.000Z',
    });
    const history = selectConversationHistory({
      messages: [opening],
      phase: 'DISCOVERY',
    });
    expect(history).toEqual([]);
  });
});
