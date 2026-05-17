/**
 * NoteColor hex mapping for rendering Discovery Notes.
 *
 * Source of truth: docs/discovery/Spec_Discovery_Design.md §3.3, §11.
 */

import type { NoteColor } from './types';

export const NOTE_COLOR_HEX: Record<NoteColor, string> = {
  BLUE: '#5F85F9',
  GREEN: '#AAE68C',
  PURPLE: '#DD9CE9',
  GOLD: '#E6D48C',
  PINK: '#F5A0A0',
  GRAY: '#B4B4B4',
};

export const NOTE_COLOR_ORDER: readonly NoteColor[] = [
  'BLUE',
  'GREEN',
  'PURPLE',
  'GOLD',
  'PINK',
  'GRAY',
];

export const DEFAULT_NOTE_COLOR: NoteColor = 'BLUE';
