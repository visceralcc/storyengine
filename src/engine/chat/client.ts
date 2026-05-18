/**
 * Chat Engine — Anthropic API client.
 *
 * One streaming `sendMessage` function shared by every phase. Higher-level
 * code (context assembly, response parsing, entity extraction) is built on
 * top in later phases of the build sequence.
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §2.
 *
 * Phase 1 scope (§13):
 *   - API client wrapping `@anthropic-ai/sdk`
 *   - Streaming via the SDK's content_block_delta events
 *   - AbortController cancellation (§2.3)
 *   - Error handling for network, API, and empty-response failures (§2.2, §10)
 *
 * Out of scope for Phase 1: system-prompt assembly (§3 — Phase 2), response
 * parsing of fenced JSON (§5 — Phase 3+), entity creation (§5.4 — Phase 3+).
 */

import Anthropic, {
  APIConnectionError,
  APIError,
  APIUserAbortError,
} from '@anthropic-ai/sdk';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';

import {
  ChatEngineError,
  type ChatEngineConfig,
  type ChatStreamEvent,
  type SendMessageInput,
} from './types';

// --- Defaults (Spec §2.1) ---

export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
export const DEFAULT_MAX_TOKENS = 4096;
export const DEFAULT_TEMPERATURE = 0.7;

/**
 * Load Chat Engine config from the environment.
 *
 * Reads `EXPO_PUBLIC_ANTHROPIC_API_KEY` (Expo's pattern for client-side env
 * vars — inlined at build time from `.env`). The literal name `ANTHROPIC_API_KEY`
 * from §2.2 isn't reachable from the Expo client bundle without extra wiring;
 * the `EXPO_PUBLIC_` prefix is the canonical replacement.
 *
 * Throws if the key is missing rather than returning an empty string, so the
 * failure surfaces at app startup instead of inside an API call.
 */
export function loadChatEngineConfig(env: NodeJS.ProcessEnv = process.env): ChatEngineConfig {
  const apiKey = env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? env.ANTHROPIC_API_KEY ?? '';
  if (!apiKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_ANTHROPIC_API_KEY. Set it in your .env file (see Spec_ChatEngine §2.2).',
    );
  }
  return {
    apiKey,
    model: DEFAULT_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
  };
}

// --- SDK seam (testability) ---

/**
 * Minimal shape of the SDK surface we depend on. Lets tests inject a fake
 * client without depending on the SDK's full type surface or building a real
 * `Anthropic` instance.
 */
export interface AnthropicLike {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      temperature: number;
      system: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
      stream: true;
    }, options?: { signal?: AbortSignal }): Promise<AsyncIterable<RawMessageStreamEvent>>;
  };
}

// --- Public API ---

export interface ChatClient {
  /**
   * Stream a single assistant response. Yields delta events as tokens
   * arrive, a final `'done'` event with the full assembled text, or an
   * `'error'` event with a typed cause.
   *
   * Per §2.3: pass `input.signal` to abort an in-flight stream. The async
   * iterable terminates and emits a `'CANCELLED'` error event; no further
   * deltas are yielded.
   */
  sendMessage(input: SendMessageInput): AsyncGenerator<ChatStreamEvent, void, void>;
}

/**
 * Create a chat client bound to the given config and (optionally) an injected
 * SDK instance. Tests pass a fake; production code passes nothing and gets a
 * real `Anthropic` client.
 */
export function createChatClient(
  config: ChatEngineConfig,
  sdk: AnthropicLike = new Anthropic({ apiKey: config.apiKey }),
): ChatClient {
  return {
    sendMessage(input) {
      return streamMessage(config, sdk, input);
    },
  };
}

// --- Implementation ---

async function* streamMessage(
  config: ChatEngineConfig,
  sdk: AnthropicLike,
  input: SendMessageInput,
): AsyncGenerator<ChatStreamEvent, void, void> {
  let stream: AsyncIterable<RawMessageStreamEvent>;
  try {
    stream = await sdk.messages.create(
      {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: input.system,
        messages: input.messages,
        stream: true,
      },
      input.signal ? { signal: input.signal } : undefined,
    );
  } catch (err) {
    yield { type: 'error', error: toChatEngineError(err) };
    return;
  }

  let assembled = '';
  try {
    for await (const event of stream) {
      // Only `content_block_delta` events with `text_delta` carry user-visible
      // text. Every other event type (message_start, message_delta, stop, etc.)
      // is bookkeeping the chat panel doesn't need.
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        if (text.length > 0) {
          assembled += text;
          yield { type: 'delta', text };
        }
      }
    }
  } catch (err) {
    yield { type: 'error', error: toChatEngineError(err) };
    return;
  }

  if (assembled.length === 0) {
    // §10 "Empty AI response" — caller renders the fallback chat message.
    yield {
      type: 'error',
      error: new ChatEngineError(
        'EMPTY',
        "I'm having trouble responding — try rephrasing or sending your message again.",
      ),
    };
    return;
  }

  yield { type: 'done', text: assembled };
}

/**
 * Map any thrown value (SDK error, DOM AbortError, plain Error, anything else)
 * to a typed {@link ChatEngineError}. Cause is preserved on the error for
 * debugging, but never shown to the user.
 *
 * The SDK's `APIUserAbortError` extends `APIError`, so the abort check must
 * come *before* the generic `APIError` check.
 */
export function toChatEngineError(err: unknown): ChatEngineError {
  if (err instanceof ChatEngineError) return err;

  if (err instanceof APIUserAbortError || isDomAbortError(err)) {
    return new ChatEngineError('CANCELLED', 'Request was cancelled.', err);
  }

  if (err instanceof APIConnectionError) {
    return new ChatEngineError(
      'NETWORK',
      'Unable to reach the AI. Check your connection and try again.',
      err,
    );
  }

  if (err instanceof APIError) {
    const status = typeof err.status === 'number' ? err.status : null;
    const message =
      status === 429
        ? "You're sending messages too quickly — wait a few seconds."
        : 'Something went wrong with the AI service. Try again in a moment.';
    return new ChatEngineError('API', message, err, status);
  }

  // Anything else: treat as a network-class failure. We surface the same
  // user-visible copy as §2.2's network row because the user's action is the
  // same — retry. The original cause is preserved for logging.
  return new ChatEngineError(
    'NETWORK',
    'Unable to reach the AI. Check your connection and try again.',
    err,
  );
}

function isDomAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: unknown }).name === 'AbortError'
  );
}
