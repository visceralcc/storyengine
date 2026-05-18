/**
 * Chat Engine — shared types.
 *
 * The Chat Engine is the single AI pipeline that powers chat in every phase.
 * This module defines the types every phase shares: client config, the
 * request/response shapes the client exposes, and the streaming event union
 * the UI consumes token-by-token.
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §2, §12.
 *
 * Context-assembly and parsing types (§3, §5) live alongside their
 * implementations in later phases (context.ts, parser.ts, extraction.ts).
 */

import type { ChatRole } from '../../models/types';

// --- Config ---

/**
 * Runtime configuration for the Chat Engine client.
 *
 * Per §2.1, v1 uses Claude Sonnet 4 with a fixed max_tokens and temperature.
 * These are config rather than constants so tests can swap the model and
 * future phases can tune temperature without touching client code.
 *
 * Per §2.2, `apiKey` is read from the `ANTHROPIC_API_KEY` environment
 * variable (via `EXPO_PUBLIC_ANTHROPIC_API_KEY` in the Expo client bundle),
 * never hardcoded.
 */
export interface ChatEngineConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  apiKey: string;
}

// --- Request ---

/**
 * A single message in the conversation history sent to the API.
 *
 * This is the API-shaped subset of a {@link ChatMessage}: only the role and
 * content cross the wire. ChatMessage IDs, phase, and conceptIds are local
 * persistence concerns that the model never sees.
 */
export interface ChatApiMessage {
  role: ChatRole;
  content: string;
}

/**
 * Inputs to one `sendMessage` call. Context assembly (Phase 2) is responsible
 * for producing the system prompt and message history; the client just sends
 * them.
 */
export interface SendMessageInput {
  system: string;
  messages: ChatApiMessage[];
  /**
   * If provided, the caller may abort the in-flight stream by calling
   * `.abort()` on this controller. Per §2.3, a new user message while a
   * response is streaming cancels the in-progress stream.
   */
  signal?: AbortSignal;
}

// --- Streaming events ---

/**
 * Discriminated union of events the client yields as the response streams in.
 *
 * The chat panel consumes `'delta'` events to render tokens as they arrive
 * (§2.3). The `'done'` event carries the full assembled text — used by the
 * response parser to split chat text from the optional fenced JSON block.
 * The `'error'` event carries a typed failure cause; per §2.2 each cause
 * maps to its own user-visible message handled by the caller.
 */
export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string }
  | { type: 'error'; error: ChatEngineError };

// --- Errors ---

/**
 * Failure modes from §2.2. Three discrete causes so the chat UI can render
 * the right user-visible message without parsing error strings.
 */
export type ChatErrorKind =
  | 'NETWORK'    // no internet, DNS failure, timeout, fetch threw
  | 'API'        // 4xx / 5xx from the model service (rate limit, bad key, server error)
  | 'CANCELLED'  // user-initiated abort via AbortController (§2.3)
  | 'EMPTY';     // model returned no text (§10 "Empty AI response")

/**
 * Error class the client throws (and emits on the stream) for any failure
 * inside `sendMessage`. `kind` discriminates the cause; `status` is set for
 * `'API'` failures so the caller can distinguish 429 from other 4xx/5xx
 * codes (§2.2 — rate-limit gets a more specific message).
 */
export class ChatEngineError extends Error {
  readonly kind: ChatErrorKind;
  readonly status: number | null;
  readonly cause: unknown;

  constructor(kind: ChatErrorKind, message: string, cause: unknown = null, status: number | null = null) {
    super(message);
    this.name = 'ChatEngineError';
    this.kind = kind;
    this.status = status;
    this.cause = cause;
  }
}
