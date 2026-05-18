import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  Image,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import {
  createNote,
  deleteNote,
  isNoteEmpty,
  updateNoteContent,
  updateNotePosition,
} from '../../../src/engine/discovery/canvasManager';
import {
  DEFAULT_NOTE_COLOR,
  NOTE_COLOR_HEX,
  NOTE_COLOR_ORDER,
} from '../../../src/models/noteColors';
import type { DiscoveryCluster, DiscoveryNote, NoteColor, Position } from '../../../src/models/types';

const NOTE_TOGGLE_ACTIVE = require('../../../assets/buttons/button_note_active.svg');
const NOTE_TOGGLE_INACTIVE = require('../../../assets/buttons/button_note_inactive.svg');

// Tokens — Spec_Discovery_Design.md §3, §7
const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#AFAFAF';
const TEXT_SECONDARY = '#636363';
const TEXT_PLACEHOLDER = '#999999';
const SURFACE = '#F5F5F5';
const SURFACE_ALT = '#E8E8E8';
const WHITE = '#FFFFFF';
const SEND_BORDER = '#656363';

const HEADER_LEFT_PAD = 82;
const NUMBER_NAME_GAP = 72;
const CHAT_PANEL_LEFT_PAD = 72;
const CHAT_PANEL_WIDTH = 309;
const HEADER_PAD_TOP = 64;
const CONTENT_GAP = 24;

const CHAT_PANEL_INNER_PAD = 20;
const CHAT_INPUT_HEIGHT = 198;
const SEND_BUTTON_SIZE = 26;

// Note tool strip — Spec_Discovery_Design.md §3.3
const TOOL_STRIP_WIDTH = 32;
const TOOL_STRIP_GUTTER = 28;
const SWATCH_SIZE = 32;
const SWATCH_RADIUS = 2;
const SWATCH_GAP = 12;
const NOTE_TOGGLE_SIZE = 26;
const TOGGLE_TO_SWATCH_GAP = 18;
const SWATCH_RING_INSET = 4;

// Canvas + notes — Spec_Discovery_Design.md §3.4, §4.1, §4.2, §7
const NOTE_SIZE = 140;
const NOTE_RADIUS = 6;
const NOTE_PAD = 8;
const NOTE_FONT_SIZE = 14;
const GHOST_OPACITY = 0.45;
const DELETE_BUTTON_SIZE = 18;
const DRAG_PX_THRESHOLD = 5;
const DRAG_MS_THRESHOLD = 150;

// Consolidate Ideas button — Spec_Discovery_Design.md §3.5, §5.2
const CONSOLIDATE_BG = '#D2D2D2';
const CONSOLIDATE_BORDER = '#B8B8B8';
const CONSOLIDATE_BG_HOVER = '#C4C4C4';
const CONSOLIDATE_HEIGHT = 48;
const CONSOLIDATE_RADIUS = 71;
const CONSOLIDATE_GAP_FROM_CHAT = 16;
const CONSOLIDATE_MIN_NOTES = 3;
const TOO_FEW_FADE_MS = 3000;
const LOADING_DEMO_RESET_MS = 2500;

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'msg_initial', role: 'assistant', content: 'How can I help?' },
];

export default function DiscoveryRoute() {
  const params = useLocalSearchParams<{ projectId: string }>();
  const projectId = params.projectId ?? 'unknown';

  const [selectedColor, setSelectedColor] = useState<NoteColor>(DEFAULT_NOTE_COLOR);
  const [placementActive, setPlacementActive] = useState(false);
  const [notes, setNotes] = useState<DiscoveryNote[]>([]);
  const [clusters, setClusters] = useState<DiscoveryCluster[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <PhaseHeader />
      <View style={styles.contentRow}>
        <View style={styles.leftColumn}>
          <ChatPanel />
          <ConsolidateButton noteCount={notes.length} />
        </View>
        <NoteToolStrip
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          placementActive={placementActive}
          onTogglePlacement={() => setPlacementActive((v) => !v)}
        />
        <Canvas
          projectId={projectId}
          notes={notes}
          setNotes={setNotes}
          clusters={clusters}
          setClusters={setClusters}
          selectedColor={selectedColor}
          placementActive={placementActive}
          editingNoteId={editingNoteId}
          setEditingNoteId={setEditingNoteId}
        />
      </View>
    </View>
  );
}

function PhaseHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.phaseNumber}>1</Text>
        <Text style={styles.phaseName}>Discovery</Text>
      </View>
      <Text style={styles.subtitle}>
        Get every idea out of your head and onto the canvas...structure comes later.
      </Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>C</Text>
      </View>
    </View>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `msg_${Date.now()}`, role: 'user', content: trimmed },
    ]);
    setDraft('');
    // Scroll to latest after layout settles
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    // Enter sends, Shift+Enter newline. Per Spec_Discovery_Design §10.2 this
    // is the v1 choice; can switch to Cmd+Enter if multi-paragraph drafting feels cramped.
    if (e.nativeEvent.key === 'Enter') {
      const native = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
      if (!native.shiftKey) {
        e.preventDefault?.();
        send();
      }
    }
  };

  return (
    <View style={styles.chatPanel}>
      <Text style={styles.chatLabel}>Assistant</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.chatMessages}
        contentContainerStyle={styles.chatMessagesContent}
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}
          >
            <Text style={m.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAi}>
              {m.content}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.chatInputArea}>
        <TextInput
          style={styles.chatInput}
          value={draft}
          onChangeText={setDraft}
          onKeyPress={onKeyPress}
          placeholder="What's on your mind?"
          placeholderTextColor={TEXT_PLACEHOLDER}
          multiline
          textAlignVertical="top"
        />
        <Pressable
          accessibilityLabel="Send message"
          onPress={send}
          style={(state) => [
            styles.sendButton,
            (state as { hovered?: boolean }).hovered && styles.sendButtonHover,
          ]}
        >
          <Text style={styles.sendArrow}>↑</Text>
        </Pressable>
      </View>
    </View>
  );
}

type NoteToolStripProps = {
  selectedColor: NoteColor;
  onSelectColor: (color: NoteColor) => void;
  placementActive: boolean;
  onTogglePlacement: () => void;
};

function NoteToolStrip({
  selectedColor,
  onSelectColor,
  placementActive,
  onTogglePlacement,
}: NoteToolStripProps) {
  return (
    <View style={styles.toolStrip}>
      <Pressable
        accessibilityLabel={
          placementActive ? 'Close note placement' : 'Open note placement'
        }
        accessibilityState={{ selected: placementActive }}
        onPress={onTogglePlacement}
        style={styles.toggleButton}
      >
        <Image
          source={placementActive ? NOTE_TOGGLE_ACTIVE : NOTE_TOGGLE_INACTIVE}
          style={{ width: NOTE_TOGGLE_SIZE, height: NOTE_TOGGLE_SIZE }}
          accessibilityIgnoresInvertColors
        />
      </Pressable>
      {placementActive && (
        <View style={styles.swatchColumn}>
          {NOTE_COLOR_ORDER.map((color) => {
            const selected = color === selectedColor;
            return (
              <Pressable
                key={color}
                accessibilityLabel={`Select ${color.toLowerCase()} note color`}
                accessibilityState={{ selected }}
                onPress={() => onSelectColor(color)}
                style={styles.swatchWrapper}
              >
                <View style={[styles.swatch, { backgroundColor: NOTE_COLOR_HEX[color] }]} />
                {selected && <View style={styles.swatchRing} pointerEvents="none" />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

type CanvasProps = {
  projectId: string;
  notes: DiscoveryNote[];
  setNotes: React.Dispatch<React.SetStateAction<DiscoveryNote[]>>;
  clusters: DiscoveryCluster[];
  setClusters: React.Dispatch<React.SetStateAction<DiscoveryCluster[]>>;
  selectedColor: NoteColor;
  placementActive: boolean;
  editingNoteId: string | null;
  setEditingNoteId: (id: string | null) => void;
};

// Pointer event shape used in onPointerDown/Move/Up. RN-web passes a
// near-DOM PointerEvent shape that exposes clientX/Y/pointerId; the typings
// for react-native's View don't include these handlers, so we cast.
type AnyPointerEvent = {
  clientX: number;
  clientY: number;
  pointerId: number;
  preventDefault?: () => void;
  target?: { setPointerCapture?: (id: number) => void; releasePointerCapture?: (id: number) => void };
  currentTarget?: unknown;
};

function Canvas({
  projectId,
  notes,
  setNotes,
  clusters,
  setClusters,
  selectedColor,
  placementActive,
  editingNoteId,
  setEditingNoteId,
}: CanvasProps) {
  const containerRef = useRef<View>(null);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [ghostLocal, setGhostLocal] = useState<Position | null>(null);

  // Pan gesture — ref so the live drag doesn't re-render on every move.
  const panDragRef = useRef<{ startClient: Position; startPan: Position } | null>(null);

  useEffect(() => {
    if (!placementActive) setGhostLocal(null);
  }, [placementActive]);

  const getRect = (): { left: number; top: number } | null => {
    const node = containerRef.current as unknown as { getBoundingClientRect?: () => DOMRect } | null;
    const rect = node?.getBoundingClientRect?.();
    return rect ? { left: rect.left, top: rect.top } : null;
  };

  const clientToLocal = (clientX: number, clientY: number): Position => {
    const rect = getRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onBackdropPointerDown = (e: AnyPointerEvent) => {
    // Only when the press starts on the canvas backdrop, not on a note.
    if (e.target !== (e.currentTarget as unknown)) return;
    if (placementActive) {
      const local = clientToLocal(e.clientX, e.clientY);
      const world: Position = {
        x: local.x - pan.x - NOTE_SIZE / 2,
        y: local.y - pan.y - NOTE_SIZE / 2,
      };
      const note = createNote({ projectId, position: world, color: selectedColor });
      setNotes((prev) => [...prev, note]);
      setEditingNoteId(note.id);
      return;
    }
    // Start pan
    panDragRef.current = {
      startClient: { x: e.clientX, y: e.clientY },
      startPan: { ...pan },
    };
    e.target?.setPointerCapture?.(e.pointerId);
  };

  const onBackdropPointerMove = (e: AnyPointerEvent) => {
    if (panDragRef.current) {
      const dx = e.clientX - panDragRef.current.startClient.x;
      const dy = e.clientY - panDragRef.current.startClient.y;
      setPan({
        x: panDragRef.current.startPan.x + dx,
        y: panDragRef.current.startPan.y + dy,
      });
      return;
    }
    if (placementActive) {
      setGhostLocal(clientToLocal(e.clientX, e.clientY));
    }
  };

  const onBackdropPointerUp = (e: AnyPointerEvent) => {
    if (panDragRef.current) {
      e.target?.releasePointerCapture?.(e.pointerId);
      panDragRef.current = null;
    }
  };

  const onBackdropPointerLeave = () => {
    setGhostLocal(null);
  };

  const handleEndEdit = (note: DiscoveryNote, finalContent: string) => {
    const updated = updateNoteContent(note, finalContent);
    if (isNoteEmpty(updated)) {
      const result = deleteNote(notes, clusters, note.id);
      setNotes(result.notes);
      setClusters(result.clusters);
    } else {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    }
    setEditingNoteId(null);
  };

  const handleMove = (note: DiscoveryNote, newWorldPos: Position) => {
    const updated = updateNotePosition(note, newWorldPos);
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
  };

  const handleDelete = (note: DiscoveryNote) => {
    const result = deleteNote(notes, clusters, note.id);
    setNotes(result.notes);
    setClusters(result.clusters);
    if (editingNoteId === note.id) setEditingNoteId(null);
  };

  const cursor = placementActive ? 'crosshair' : 'grab';

  // Trackpad two-finger pan (web): subtract wheel deltas so the canvas
  // viewport feels like a camera — swipe up/right scrolls the world up/right.
  const onWheel = (e: { deltaX: number; deltaY: number; preventDefault?: () => void }) => {
    e.preventDefault?.();
    setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
  };

  // pointer + cursor are web-only props that aren't in RN's ViewProps/ViewStyle.
  const webProps: Record<string, unknown> = {
    onPointerDown: onBackdropPointerDown,
    onPointerMove: onBackdropPointerMove,
    onPointerUp: onBackdropPointerUp,
    onPointerLeave: onBackdropPointerLeave,
    onWheel,
  };

  return (
    <View
      ref={containerRef}
      {...(webProps as object)}
      style={[styles.canvas, { cursor } as object]}
    >
      <View
        pointerEvents="box-none"
        style={[
          styles.canvasWorld,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        ]}
      >
        {notes.map((note) => (
          <DiscoveryNoteCard
            key={note.id}
            note={note}
            editing={editingNoteId === note.id}
            onStartEdit={() => setEditingNoteId(note.id)}
            onEndEdit={(content) => handleEndEdit(note, content)}
            onMove={(pos) => handleMove(note, pos)}
            onDelete={() => handleDelete(note)}
          />
        ))}
      </View>
      {placementActive && ghostLocal && (
        <View
          pointerEvents="none"
          style={[
            styles.ghostNote,
            {
              backgroundColor: NOTE_COLOR_HEX[selectedColor],
              left: ghostLocal.x - NOTE_SIZE / 2,
              top: ghostLocal.y - NOTE_SIZE / 2,
            },
          ]}
        />
      )}
    </View>
  );
}

type DiscoveryNoteCardProps = {
  note: DiscoveryNote;
  editing: boolean;
  onStartEdit: () => void;
  onEndEdit: (finalContent: string) => void;
  onMove: (newPos: Position) => void;
  onDelete: () => void;
};

function DiscoveryNoteCard({
  note,
  editing,
  onStartEdit,
  onEndEdit,
  onMove,
  onDelete,
}: DiscoveryNoteCardProps) {
  const [draft, setDraft] = useState(note.content);
  const [hovered, setHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startClient: Position;
    startedAt: number;
    moved: boolean;
  } | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Reset draft if the underlying note id changes (e.g. delete + recreate).
  useEffect(() => {
    setDraft(note.content);
  }, [note.id, note.content]);

  // Autofocus on entering edit mode.
  useEffect(() => {
    if (editing) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [editing]);

  const onPointerDown = (e: AnyPointerEvent) => {
    if (editing) return; // typing — never drag
    dragRef.current = {
      startClient: { x: e.clientX, y: e.clientY },
      startedAt: Date.now(),
      moved: false,
    };
    e.target?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: AnyPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startClient.x;
    const dy = e.clientY - drag.startClient.y;
    if (!drag.moved) {
      const overTime = Date.now() - drag.startedAt >= DRAG_MS_THRESHOLD;
      const overDist = Math.hypot(dx, dy) >= DRAG_PX_THRESHOLD;
      if (overTime || overDist) {
        drag.moved = true;
        setIsDragging(true);
      }
    }
    if (drag.moved) {
      setDragOffset({ x: dx, y: dy });
    }
  };

  const onPointerUp = (e: AnyPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.target?.releasePointerCapture?.(e.pointerId);
    if (drag.moved) {
      onMove({
        x: note.position.x + dragOffset.x,
        y: note.position.y + dragOffset.y,
      });
    } else {
      onStartEdit();
    }
    dragRef.current = null;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const onPointerCancel = () => {
    dragRef.current = null;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const finishEdit = () => onEndEdit(draft);

  const onInputKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = e.nativeEvent.key;
    if (key === 'Enter') {
      const native = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
      if (!native.shiftKey) {
        e.preventDefault?.();
        finishEdit();
      }
    } else if (key === 'Escape') {
      e.preventDefault?.();
      finishEdit();
    }
  };

  const renderedLeft = note.position.x + (isDragging ? dragOffset.x : 0);
  const renderedTop = note.position.y + (isDragging ? dragOffset.y : 0);
  const showDelete = hovered && !editing && !isDragging;

  const webProps: Record<string, unknown> = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };

  return (
    <View
      {...(webProps as object)}
      style={[
        styles.note,
        {
          backgroundColor: NOTE_COLOR_HEX[note.color],
          left: renderedLeft,
          top: renderedTop,
        },
        isDragging && styles.noteDragging,
      ]}
    >
      {editing ? (
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          onKeyPress={onInputKeyPress}
          onBlur={finishEdit}
          style={styles.noteInput}
          multiline
          textAlignVertical="top"
        />
      ) : (
        <Text style={styles.noteText} numberOfLines={6}>
          {note.content}
        </Text>
      )}
      {showDelete && (
        <Pressable
          accessibilityLabel="Delete note"
          onPress={onDelete}
          // Pointer-down on the × must not start a drag on the parent.
          {...({
            onPointerDown: (e: { stopPropagation?: () => void }) =>
              e.stopPropagation?.(),
          } as object)}
          style={styles.noteDelete}
        >
          <Text style={styles.noteDeleteX}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

type ConsolidateButtonProps = {
  noteCount: number;
};

function ConsolidateButton({ noteCount }: ConsolidateButtonProps) {
  const enabled = noteCount >= CONSOLIDATE_MIN_NOTES;
  const [loading, setLoading] = useState(false);
  const [showTooFew, setShowTooFew] = useState(false);
  const tooFewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tooFewTimer.current) clearTimeout(tooFewTimer.current);
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    };
  }, []);

  // The disabled-tap message clears itself once enough notes exist.
  useEffect(() => {
    if (enabled && showTooFew) {
      if (tooFewTimer.current) clearTimeout(tooFewTimer.current);
      setShowTooFew(false);
    }
  }, [enabled, showTooFew]);

  const onPress = () => {
    if (loading) return;
    if (!enabled) {
      setShowTooFew(true);
      if (tooFewTimer.current) clearTimeout(tooFewTimer.current);
      tooFewTimer.current = setTimeout(() => setShowTooFew(false), TOO_FEW_FADE_MS);
      return;
    }
    // Phase 5 stub: no engine yet — log + show loading state briefly so the
    // UI flow can be exercised end-to-end before consolidation is wired up.
    console.log('Consolidate Ideas tapped — engine stub (Phase 5)');
    setLoading(true);
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => setLoading(false), LOADING_DEMO_RESET_MS);
  };

  return (
    <View style={styles.consolidateWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Consolidate ideas"
        accessibilityState={{ disabled: !enabled, busy: loading }}
        onPress={onPress}
        style={(state) => [
          styles.consolidateButton,
          !enabled && styles.consolidateButtonDisabled,
          enabled &&
            !loading &&
            (state as { hovered?: boolean }).hovered &&
            styles.consolidateButtonHover,
        ]}
      >
        <Text style={styles.consolidateText}>
          {loading ? 'Consolidating...' : 'Consolidate Ideas'}
        </Text>
      </Pressable>
      {showTooFew && (
        <Text style={styles.consolidateHint}>
          Add a few more ideas first — you need at least 3 notes.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: HEADER_PAD_TOP,
    paddingLeft: HEADER_LEFT_PAD,
    paddingRight: 32,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: CHAT_PANEL_LEFT_PAD + CHAT_PANEL_WIDTH - HEADER_LEFT_PAD,
  },
  phaseNumber: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 36,
    color: TEXT_DARK,
    includeFontPadding: false,
    marginRight: NUMBER_NAME_GAP,
  },
  phaseName: {
    fontFamily: 'Barlow_100Thin',
    fontSize: 36,
    color: TEXT_DARK,
    includeFontPadding: false,
  },
  subtitle: {
    flex: 1,
    fontFamily: 'Aleo_700Bold',
    fontSize: 20,
    color: TEXT_MUTED,
    includeFontPadding: false,
    paddingLeft: 24,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: SURFACE_ALT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 24,
  },
  avatarText: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 14,
    color: TEXT_DARK,
    includeFontPadding: false,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: CHAT_PANEL_LEFT_PAD,
    paddingTop: CONTENT_GAP,
    paddingBottom: 32,
    paddingRight: 0,
  },
  leftColumn: {
    width: CHAT_PANEL_WIDTH,
    flexDirection: 'column',
  },
  chatPanel: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: CHAT_PANEL_INNER_PAD,
  },
  consolidateWrap: {
    marginTop: CONSOLIDATE_GAP_FROM_CHAT,
    alignItems: 'center',
  },
  consolidateButton: {
    width: '100%',
    height: CONSOLIDATE_HEIGHT,
    borderRadius: CONSOLIDATE_RADIUS,
    backgroundColor: CONSOLIDATE_BG,
    borderWidth: 1,
    borderColor: CONSOLIDATE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consolidateButtonHover: {
    backgroundColor: CONSOLIDATE_BG_HOVER,
  },
  consolidateButtonDisabled: {
    opacity: 0.45,
  },
  consolidateText: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 16,
    color: TEXT_DARK,
    includeFontPadding: false,
  },
  consolidateHint: {
    marginTop: 8,
    fontFamily: 'Aleo_400Regular',
    fontSize: 14,
    color: TEXT_SECONDARY,
    includeFontPadding: false,
    textAlign: 'center',
  },
  chatLabel: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 16,
    color: TEXT_SECONDARY,
    includeFontPadding: false,
    marginBottom: 12,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingBottom: 12,
    gap: 10,
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  bubbleAi: {
    alignSelf: 'flex-start',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
  },
  bubbleTextAi: {
    fontFamily: 'Aleo_700Bold',
    fontSize: 16,
    color: TEXT_SECONDARY,
    includeFontPadding: false,
  },
  bubbleTextUser: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 16,
    color: TEXT_DARK,
    includeFontPadding: false,
    textAlign: 'right',
  },
  chatInputArea: {
    backgroundColor: WHITE,
    borderRadius: 10,
    height: CHAT_INPUT_HEIGHT,
    marginTop: 12,
    padding: 12,
    position: 'relative',
  },
  chatInput: {
    flex: 1,
    fontFamily: 'Aleo_400Regular',
    fontSize: 14,
    color: TEXT_DARK,
    includeFontPadding: false,
    paddingRight: SEND_BUTTON_SIZE + 12,
    // @ts-expect-error — web-only style for removing the outline ring
    outlineStyle: 'none',
  },
  sendButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: SEND_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  sendButtonHover: {
    backgroundColor: SURFACE_ALT,
  },
  sendArrow: {
    fontSize: 14,
    color: SEND_BORDER,
    lineHeight: 16,
    includeFontPadding: false,
  },
  toolStrip: {
    width: TOOL_STRIP_WIDTH,
    marginHorizontal: TOOL_STRIP_GUTTER,
    alignItems: 'center',
    paddingTop: 4,
  },
  toggleButton: {
    width: NOTE_TOGGLE_SIZE,
    height: NOTE_TOGGLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: TOGGLE_TO_SWATCH_GAP,
  },
  swatchColumn: {
    alignItems: 'center',
  },
  swatchWrapper: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    marginBottom: SWATCH_GAP,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_RADIUS,
  },
  swatchRing: {
    position: 'absolute',
    top: -SWATCH_RING_INSET,
    left: -SWATCH_RING_INSET,
    right: -SWATCH_RING_INSET,
    bottom: -SWATCH_RING_INSET,
    borderWidth: 1.5,
    borderColor: TEXT_DARK,
    borderRadius: SWATCH_RADIUS + 2,
  },
  canvas: {
    flex: 1,
    backgroundColor: WHITE,
    borderLeftWidth: 1,
    borderLeftColor: SURFACE_ALT,
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
  },
  canvasWorld: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  note: {
    position: 'absolute',
    width: NOTE_SIZE,
    height: NOTE_SIZE,
    borderRadius: NOTE_RADIUS,
    padding: NOTE_PAD,
    cursor: 'pointer',
  },
  noteDragging: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  noteText: {
    fontFamily: 'Aleo_400Regular',
    fontSize: NOTE_FONT_SIZE,
    color: TEXT_DARK,
    includeFontPadding: false,
    lineHeight: 18,
  },
  noteInput: {
    flex: 1,
    fontFamily: 'Aleo_400Regular',
    fontSize: NOTE_FONT_SIZE,
    color: TEXT_DARK,
    includeFontPadding: false,
    lineHeight: 18,
    padding: 0,
    margin: 0,
    outlineStyle: 'none',
  },
  noteDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: DELETE_BUTTON_SIZE,
    height: DELETE_BUTTON_SIZE,
    borderRadius: DELETE_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteDeleteX: {
    color: WHITE,
    fontSize: 14,
    lineHeight: 14,
    includeFontPadding: false,
    fontFamily: 'Aleo_400Regular',
  },
  ghostNote: {
    position: 'absolute',
    width: NOTE_SIZE,
    height: NOTE_SIZE,
    borderRadius: NOTE_RADIUS,
    opacity: GHOST_OPACITY,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
});
