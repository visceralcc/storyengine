/**
 * Chat Engine — Development opening message.
 *
 * On first entry to Development, the chat panel doesn't have a conversation
 * history yet. To make the screen feel inhabited — and to direct the user
 * toward the dimension Discovery surfaced most strongly — the engine seeds
 * the chat with one opening message keyed on the project's creative gravity.
 *
 *   CHARACTER → "Your Discovery notes had a lot of energy around a character — ..."
 *   WORLD     → "Your ideas paint a vivid world — ..."
 *   THEME     → "There's a strong sense of what this story is about in your notes — ..."
 *   null      → "You've got a rich mix of ideas from Discovery. Where would you like to start ..."
 *
 * The opening message is generated **once** and persisted as a normal
 * `ChatMessage`. The caller (the Development screen) is responsible for the
 * first-entry check — the engine itself is stateless here. On subsequent
 * visits the existing chat history is shown and this generator is not called.
 *
 * Source of truth: docs/chat-engine/Spec_ChatEngine.md §9.1.
 */

import { createChatMessage } from '../../models/factories';
import type { ChatMessage, Dimension } from '../../models/types';

/**
 * Distinct gravity inputs for the opening-message lookup. `null` is its own
 * key because there are four messages — three dimension-specific plus a
 * "mixed bag" fallback for a tied / undetermined gravity.
 */
export type OpeningMessageGravity = Dimension | null;

/**
 * Opening-message strings, reproduced verbatim from §9.1. The table is the
 * spec contract — if these need to change, change the spec first.
 *
 * Note: §9.1 examples use "her" — those are illustrative pronouns from the
 * spec's running example, not assumptions about the user's protagonist.
 */
const OPENING_MESSAGES: Record<'WORLD' | 'CHARACTER' | 'THEME' | 'NONE', string> = {
  CHARACTER:
    'Your Discovery notes had a lot of energy around a character — want to start exploring who she is?',
  WORLD:
    'Your ideas paint a vivid world — want to start defining where and when this story lives?',
  THEME:
    "There's a strong sense of what this story is about in your notes — want to dig into the themes and feelings driving it?",
  NONE:
    "You've got a rich mix of ideas from Discovery. Where would you like to start — a character, a place, or what the story is about?",
};

/**
 * Resolve the opening-message text for the given gravity. Any unrecognized
 * (or `null`) gravity falls back to the mixed-bag message.
 */
export function openingMessageText(gravity: OpeningMessageGravity): string {
  if (gravity === 'CHARACTER') return OPENING_MESSAGES.CHARACTER;
  if (gravity === 'WORLD') return OPENING_MESSAGES.WORLD;
  if (gravity === 'THEME') return OPENING_MESSAGES.THEME;
  return OPENING_MESSAGES.NONE;
}

export interface GenerateOpeningMessageInput {
  projectId: string;
  /** From `PhaseState.discovery.creativeGravity`. `null` is valid (mixed bag). */
  creativeGravity: OpeningMessageGravity;
  /** Override the createdAt timestamp for deterministic tests. */
  now?: string;
}

/**
 * Build a persistable {@link ChatMessage} carrying the Development opening
 * message. Role is always `'assistant'` (it's an engine-authored greeting,
 * not user-typed). `conceptIds` is empty — the opening message doesn't
 * reference any Concepts yet.
 *
 * Pure function: no IO, no chat-history check. The caller decides whether
 * this is the user's first entry to Development (per §9.1 "generated once").
 */
export function generateOpeningMessage(input: GenerateOpeningMessageInput): ChatMessage {
  return createChatMessage({
    projectId: input.projectId,
    phase: 'DEVELOPMENT',
    role: 'assistant',
    content: openingMessageText(input.creativeGravity),
    now: input.now,
  });
}
