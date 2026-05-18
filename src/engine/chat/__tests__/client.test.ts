/**
 * Chat Engine — client unit tests.
 *
 * Phase 1 coverage from Spec_ChatEngine.md §13:
 *   - Streaming token assembly into delta + done events
 *   - AbortController cancellation → CANCELLED error
 *   - Network failure → NETWORK error
 *   - API failure (with 429 special-cased) → API error
 *   - Empty response → EMPTY error
 *   - Config loader: throws when no env var is set, prefers EXPO_PUBLIC_
 *
 * We mock the SDK seam (`AnthropicLike`) directly. The Anthropic SDK's real
 * error constructors are used because the client narrows on `instanceof`.
 */

import {
  APIConnectionError,
  APIError,
  APIUserAbortError,
  RateLimitError,
} from '@anthropic-ai/sdk';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';

import {
  createChatClient,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  loadChatEngineConfig,
  toChatEngineError,
  type AnthropicLike,
} from '../client';
import { ChatEngineError, type ChatEngineConfig, type ChatStreamEvent } from '../types';

// --- Fake SDK helpers ---

const TEST_CONFIG: ChatEngineConfig = {
  apiKey: 'test-key',
  model: DEFAULT_MODEL,
  maxTokens: DEFAULT_MAX_TOKENS,
  temperature: DEFAULT_TEMPERATURE,
};

function textDelta(text: string): RawMessageStreamEvent {
  return {
    type: 'content_block_delta',
    index: 0,
    delta: { type: 'text_delta', text },
  } as RawMessageStreamEvent;
}

function nonTextEvent(): RawMessageStreamEvent {
  // message_start carries no user-visible text; client should ignore it.
  return {
    type: 'message_start',
    message: {
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      content: [],
      model: 'test',
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    },
  } as unknown as RawMessageStreamEvent;
}

function makeStreamFromEvents(events: RawMessageStreamEvent[]): AsyncIterable<RawMessageStreamEvent> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const ev of events) yield ev;
    },
  };
}

function makeSdkWithStream(stream: AsyncIterable<RawMessageStreamEvent>): {
  sdk: AnthropicLike;
  createMock: jest.Mock;
} {
  const createMock = jest.fn().mockResolvedValue(stream);
  return { sdk: { messages: { create: createMock } }, createMock };
}

function makeSdkWithCreateError(err: unknown): { sdk: AnthropicLike; createMock: jest.Mock } {
  const createMock = jest.fn().mockRejectedValue(err);
  return { sdk: { messages: { create: createMock } }, createMock };
}

async function collect(gen: AsyncGenerator<ChatStreamEvent, void, void>): Promise<ChatStreamEvent[]> {
  const out: ChatStreamEvent[] = [];
  for await (const ev of gen) out.push(ev);
  return out;
}

// --- Tests ---

describe('createChatClient — streaming', () => {
  it('assembles text_delta events into delta + done events', async () => {
    const stream = makeStreamFromEvents([
      nonTextEvent(),
      textDelta('Hello, '),
      textDelta('world!'),
    ]);
    const { sdk } = makeSdkWithStream(stream);

    const client = createChatClient(TEST_CONFIG, sdk);
    const events = await collect(
      client.sendMessage({ system: 'sys', messages: [{ role: 'user', content: 'hi' }] }),
    );

    expect(events).toEqual([
      { type: 'delta', text: 'Hello, ' },
      { type: 'delta', text: 'world!' },
      { type: 'done', text: 'Hello, world!' },
    ]);
  });

  it('passes config + system + messages through to messages.create', async () => {
    const stream = makeStreamFromEvents([textDelta('ok')]);
    const { sdk, createMock } = makeSdkWithStream(stream);

    await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 'SYSTEM_PROMPT',
        messages: [
          { role: 'user', content: 'one' },
          { role: 'assistant', content: 'two' },
        ],
      }),
    );

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith(
      {
        model: DEFAULT_MODEL,
        max_tokens: DEFAULT_MAX_TOKENS,
        temperature: DEFAULT_TEMPERATURE,
        system: 'SYSTEM_PROMPT',
        messages: [
          { role: 'user', content: 'one' },
          { role: 'assistant', content: 'two' },
        ],
        stream: true,
      },
      undefined,
    );
  });

  it('forwards AbortSignal to messages.create when provided', async () => {
    const stream = makeStreamFromEvents([textDelta('x')]);
    const { sdk, createMock } = makeSdkWithStream(stream);
    const controller = new AbortController();

    await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
        signal: controller.signal,
      }),
    );

    expect(createMock.mock.calls[0][1]).toEqual({ signal: controller.signal });
  });

  it('drops empty text_delta payloads from the assembled output', async () => {
    const stream = makeStreamFromEvents([textDelta(''), textDelta('A'), textDelta('')]);
    const { sdk } = makeSdkWithStream(stream);

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    expect(events).toEqual([
      { type: 'delta', text: 'A' },
      { type: 'done', text: 'A' },
    ]);
  });
});

describe('createChatClient — cancellation (§2.3)', () => {
  it('emits a CANCELLED error when the SDK throws APIUserAbortError before streaming', async () => {
    const { sdk } = makeSdkWithCreateError(new APIUserAbortError({ message: 'aborted' }));

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
    if (events[0].type !== 'error') throw new Error('unreachable');
    expect(events[0].error.kind).toBe('CANCELLED');
  });

  it('emits a CANCELLED error when an abort happens mid-stream', async () => {
    // Mid-stream abort: yield one delta, then throw APIUserAbortError on the
    // next pull. Matches what the SDK does when its underlying fetch aborts.
    const stream: AsyncIterable<RawMessageStreamEvent> = {
      async *[Symbol.asyncIterator]() {
        yield textDelta('partial ');
        throw new APIUserAbortError({ message: 'aborted mid-stream' });
      },
    };
    const { sdk } = makeSdkWithStream(stream);

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    expect(events[0]).toEqual({ type: 'delta', text: 'partial ' });
    expect(events).toHaveLength(2);
    if (events[1].type !== 'error') throw new Error('unreachable');
    expect(events[1].error.kind).toBe('CANCELLED');
  });

  it('emits CANCELLED for a DOM-style AbortError (non-SDK fetch implementations)', async () => {
    const domAbort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const { sdk } = makeSdkWithCreateError(domAbort);

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    if (events[0].type !== 'error') throw new Error('unreachable');
    expect(events[0].error.kind).toBe('CANCELLED');
  });
});

describe('createChatClient — error handling (§2.2)', () => {
  it('maps APIConnectionError to a NETWORK ChatEngineError', async () => {
    const { sdk } = makeSdkWithCreateError(
      new APIConnectionError({ message: 'DNS failure' }),
    );

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    if (events[0].type !== 'error') throw new Error('unreachable');
    expect(events[0].error.kind).toBe('NETWORK');
    expect(events[0].error.message).toMatch(/Unable to reach the AI/);
  });

  it('maps RateLimitError (429) to an API error with rate-limit copy', async () => {
    // RateLimitError(status, error, message, headers, type)
    const rateLimit = new RateLimitError(429, { type: 'rate_limit_error' }, 'too fast', new Headers(), 'rate_limit_error');
    const { sdk } = makeSdkWithCreateError(rateLimit);

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    if (events[0].type !== 'error') throw new Error('unreachable');
    expect(events[0].error.kind).toBe('API');
    expect(events[0].error.status).toBe(429);
    expect(events[0].error.message).toMatch(/too quickly/);
  });

  it('maps generic 5xx APIError to an API error with generic copy', async () => {
    const serverErr = new APIError(500, { type: 'overloaded_error' }, 'boom', new Headers(), 'overloaded_error');
    const { sdk } = makeSdkWithCreateError(serverErr);

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    if (events[0].type !== 'error') throw new Error('unreachable');
    expect(events[0].error.kind).toBe('API');
    expect(events[0].error.status).toBe(500);
    expect(events[0].error.message).toMatch(/Something went wrong/);
  });

  it('emits an EMPTY error when the stream yields no text events (§10)', async () => {
    // Only non-text events — simulates an unusable response from the model.
    const stream = makeStreamFromEvents([nonTextEvent()]);
    const { sdk } = makeSdkWithStream(stream);

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    expect(events).toHaveLength(1);
    if (events[0].type !== 'error') throw new Error('unreachable');
    expect(events[0].error.kind).toBe('EMPTY');
  });

  it('falls back to NETWORK error for unknown thrown values', async () => {
    const { sdk } = makeSdkWithCreateError(new Error('random crash'));

    const events = await collect(
      createChatClient(TEST_CONFIG, sdk).sendMessage({
        system: 's',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    );

    if (events[0].type !== 'error') throw new Error('unreachable');
    expect(events[0].error.kind).toBe('NETWORK');
  });
});

describe('toChatEngineError', () => {
  it('returns ChatEngineError unchanged', () => {
    const original = new ChatEngineError('EMPTY', 'msg');
    expect(toChatEngineError(original)).toBe(original);
  });
});

describe('loadChatEngineConfig', () => {
  it('returns config when EXPO_PUBLIC_ANTHROPIC_API_KEY is set', () => {
    const cfg = loadChatEngineConfig({ EXPO_PUBLIC_ANTHROPIC_API_KEY: 'k1' } as NodeJS.ProcessEnv);
    expect(cfg.apiKey).toBe('k1');
    expect(cfg.model).toBe(DEFAULT_MODEL);
    expect(cfg.maxTokens).toBe(DEFAULT_MAX_TOKENS);
    expect(cfg.temperature).toBe(DEFAULT_TEMPERATURE);
  });

  it('falls back to ANTHROPIC_API_KEY when EXPO_PUBLIC_ variant is not set', () => {
    const cfg = loadChatEngineConfig({ ANTHROPIC_API_KEY: 'k2' } as NodeJS.ProcessEnv);
    expect(cfg.apiKey).toBe('k2');
  });

  it('prefers EXPO_PUBLIC_ over ANTHROPIC_API_KEY when both are set', () => {
    const cfg = loadChatEngineConfig({
      EXPO_PUBLIC_ANTHROPIC_API_KEY: 'public',
      ANTHROPIC_API_KEY: 'plain',
    } as NodeJS.ProcessEnv);
    expect(cfg.apiKey).toBe('public');
  });

  it('throws when neither env var is set', () => {
    expect(() => loadChatEngineConfig({} as NodeJS.ProcessEnv)).toThrow(/Missing EXPO_PUBLIC_ANTHROPIC_API_KEY/);
  });
});
