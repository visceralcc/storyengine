/**
 * Development Canvas — Phase 2 of the creative pipeline.
 *
 * Three-column overview (Theme, World, Character) of every story element,
 * with a canvas-level chat panel, the phase header, and the comparison-mode
 * button. The "home base" of the Development phase.
 *
 * Spec: docs/development/Spec_Development_Design.md §3.1, §4.1, §5.1, §7.
 *
 * Phase 1 scope — canvas layout and card rendering. Tapping a card and the
 * comparison flow are stubbed here; the Detail View and Compare View land in
 * later phases. The chat panel is local-only (no AI / no persistence yet).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { createChatMessage } from '../../../src/models/factories';
import type { ChatMessage, CreativeTag, ProjectFile } from '../../../src/models/types';
import {
  PILLAR_ORDER,
  getStoryElements,
  isBulletElement,
} from '../../../src/development/storyElements';
import type { Pillar, StoryElement } from '../../../src/development/storyElements';
import { getDefaultProjectStore } from '../../../src/persistence/projectStore';

// --- Assets (Spec §7 "Asset References") ---
const ICON_THEME = require('../../../assets/icons/icon_theme.svg');
const ICON_WORLD = require('../../../assets/icons/icon_world.svg');
const ICON_CHARACTER = require('../../../assets/icons/icon_character.svg');
const COMPARISON_INACTIVE = require('../../../assets/buttons/button_comparison_inactive.svg');
const COMPARISON_ACTIVE = require('../../../assets/buttons/button_comparison_active.svg');

// --- Color tokens (Spec §7 "Color") ---
const WHITE = '#FFFFFF';
const TEXT_BLACK = '#000000';
const TEXT_SUBTITLE = '#737373';
const TEXT_CHAT = '#636363';
const TEXT_PLACEHOLDER = '#B9B9B9';
const COL_GRADIENT_TOP = '#EEEDED';
const COL_GRADIENT_BOTTOM = '#E8E8E8';
const CHAT_GRADIENT_TOP = '#F6F6F6';
const CHAT_GRADIENT_BOTTOM = '#E8E8E8';
const AVATAR_BG = '#E8E8E8';
const SEND_BORDER = '#656363';

const TAG_COLOR: Record<CreativeTag, string> = {
  CORE: '#9CCBAC',
  EVOLVE: '#F2BA03',
  SET_ASIDE: '#AA5959',
};

// --- Layout tokens (Spec §7 "Spacing & Layout"; mirrors the Discovery screen) ---
const HEADER_PAD_TOP = 64;
const HEADER_LEFT_PAD = 82;
const HEADER_RIGHT_PAD = 32;
const NUMBER_NAME_GAP = 72;
const CHAT_PANEL_LEFT_PAD = 72;
const CHAT_PANEL_WIDTH = 309;
const CHAT_TO_COLUMNS_GAP = 24;
const COLUMN_GAP = 16;
const CONTENT_PAD_TOP = 24;
const CONTENT_PAD_BOTTOM = 32;

const CHAT_INPUT_HEIGHT = 132;
const SEND_BUTTON_SIZE = 26;

const CARD_RADIUS = 10;
const TAG_BAR_WIDTH = 17;
const TAG_BAR_HEIGHT = 72;
const CARD_MIN_HEIGHT = 96;

// Pillar metadata: display label + header icon with its native aspect ratio.
const PILLAR_META: Record<Pillar, { label: string; icon: number; ratio: number }> = {
  THEME: { label: 'Theme', icon: ICON_THEME, ratio: 19 / 19 },
  WORLD: { label: 'World', icon: ICON_WORLD, ratio: 20 / 19 },
  CHARACTER: { label: 'Character', icon: ICON_CHARACTER, ratio: 20 / 19 },
};

/**
 * react-native-web passes unknown style props straight through to the DOM —
 * the same mechanism the Discovery screen relies on for `cursor` /
 * `outlineStyle`. A CSS linear-gradient is the lightest way to render the
 * spec's gradient surfaces without adding expo-linear-gradient.
 */
function gradient(top: string, bottom: string): object {
  return { backgroundImage: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)` };
}

// --- Route loader ---

export default function DevelopmentRoute() {
  const params = useLocalSearchParams<{ projectId: string }>();
  const projectId = params.projectId ?? 'unknown';

  const [projectFile, setProjectFile] = useState<ProjectFile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDefaultProjectStore()
      .loadProject(projectId)
      .then((file) => {
        if (!cancelled) setProjectFile(file);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loadError) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadError}>Could not load project: {loadError}</Text>
      </View>
    );
  }
  if (!projectFile) {
    return <View style={styles.container} />;
  }
  return <DevelopmentWorkspace projectId={projectId} projectFile={projectFile} />;
}

type DevelopmentWorkspaceProps = {
  projectId: string;
  projectFile: ProjectFile;
};

function DevelopmentWorkspace({ projectId, projectFile }: DevelopmentWorkspaceProps) {
  const [comparisonActive, setComparisonActive] = useState(false);

  // Real story elements come from Discovery consolidation; until that pipeline
  // is wired, this resolves to the Ready Player One sample dataset.
  const storyElements = useMemo(() => getStoryElements(projectFile), [projectFile]);

  // Phase 2 will open the Story Element Detail View here.
  const handleOpenElement = (element: StoryElement) => {
    // eslint-disable-next-line no-console
    console.log('[development] open element — Detail View lands in Phase 2:', element.id);
  };

  return (
    <View style={styles.container}>
      <PhaseHeader
        comparisonActive={comparisonActive}
        onToggleComparison={() => setComparisonActive((v) => !v)}
      />
      <View style={styles.contentRow}>
        <View style={styles.leftColumn}>
          <ChatPanel projectId={projectId} />
        </View>
        <View style={styles.columnsRow}>
          {PILLAR_ORDER.map((pillar) => (
            <PillarColumn
              key={pillar}
              pillar={pillar}
              elements={storyElements.filter((el) => el.pillar === pillar)}
              onOpenElement={handleOpenElement}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// --- Phase header (Spec §3.1) ---

type PhaseHeaderProps = {
  comparisonActive: boolean;
  onToggleComparison: () => void;
};

function PhaseHeader({ comparisonActive, onToggleComparison }: PhaseHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.phaseNumber}>2</Text>
        <Text style={styles.phaseName}>Development</Text>
      </View>
      <Text style={styles.subtitle}>
        Give your ideas shape...explore who, where, and why, one conversation at a time.
      </Text>
      <View style={styles.headerRight}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>C</Text>
        </View>
        <ComparisonButton active={comparisonActive} onPress={onToggleComparison} />
      </View>
    </View>
  );
}

type ComparisonButtonProps = {
  active: boolean;
  onPress: () => void;
};

function ComparisonButton({ active, onPress }: ComparisonButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Comparison mode"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={(state) => [
        styles.comparisonButton,
        (state as { hovered?: boolean }).hovered && styles.comparisonButtonHover,
      ]}
    >
      <Image
        source={active ? COMPARISON_ACTIVE : COMPARISON_INACTIVE}
        style={styles.comparisonIcon}
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}

// --- Chat panel (Spec §3.1; canvas-level, advisory only) ---

type ChatPanelProps = {
  projectId: string;
};

// Welcome bubble — a UI affordance, not persisted history (Spec §5.1).
const WELCOME_MESSAGE = 'Your ideas are organized. Tap any element to start defining it in detail.';

function ChatPanel({ projectId }: ChatPanelProps) {
  // Phase 1: local-only. AI wiring + persistence arrive in a later phase.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const msg = createChatMessage({
      projectId,
      phase: 'DEVELOPMENT',
      role: 'user',
      content: trimmed,
    });
    setMessages((prev) => [...prev, msg]);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter') {
      const native = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
      if (!native.shiftKey) {
        e.preventDefault?.();
        send();
      }
    }
  };

  return (
    <View style={[styles.chatPanel, gradient(CHAT_GRADIENT_TOP, CHAT_GRADIENT_BOTTOM)]}>
      <Text style={styles.chatLabel}>Assistant</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.chatMessages}
        contentContainerStyle={styles.chatMessagesContent}
      >
        <View style={[styles.bubble, styles.bubbleAi]}>
          <Text style={styles.bubbleTextAi}>{WELCOME_MESSAGE}</Text>
        </View>
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
          placeholder="Ask about your story..."
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

// --- Pillar column (Spec §3.1 "Content columns") ---

type PillarColumnProps = {
  pillar: Pillar;
  elements: StoryElement[];
  onOpenElement: (element: StoryElement) => void;
};

function PillarColumn({ pillar, elements, onOpenElement }: PillarColumnProps) {
  const meta = PILLAR_META[pillar];
  const iconHeight = 26;
  return (
    <View style={[styles.column, gradient(COL_GRADIENT_TOP, COL_GRADIENT_BOTTOM)]}>
      <View style={styles.columnHeader}>
        <Image
          source={meta.icon}
          style={{ width: Math.round(iconHeight * meta.ratio), height: iconHeight }}
          accessibilityIgnoresInvertColors
        />
        <Text style={styles.columnLabel}>{meta.label}</Text>
      </View>
      <ScrollView
        style={styles.columnScroll}
        contentContainerStyle={styles.columnScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {elements.map((element) => (
          <StoryElementCard
            key={element.id}
            element={element}
            onPress={() => onOpenElement(element)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// --- Story Element Card — the "story_element_small" component (Spec §3.1) ---

type StoryElementCardProps = {
  element: StoryElement;
  onPress: () => void;
};

function StoryElementCard({ element, onPress }: StoryElementCardProps) {
  const meta = PILLAR_META[element.pillar];
  const iconHeight = 19;
  const bullets = isBulletElement(element);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}: ${element.label}`}
      onPress={onPress}
      style={(state) => [
        styles.card,
        (state as { hovered?: boolean }).hovered && styles.cardHover,
      ]}
    >
      <View style={styles.cardHeader}>
        <Image
          source={meta.icon}
          style={{ width: Math.round(iconHeight * meta.ratio), height: iconHeight }}
          accessibilityIgnoresInvertColors
        />
        <Text style={styles.cardHeaderLabel} numberOfLines={1}>
          {meta.label} / {element.label}
        </Text>
      </View>
      <View style={styles.cardBody}>
        {bullets ? (
          element.body.map((line, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.cardParagraph}>{element.body[0]}</Text>
        )}
      </View>
      <View
        style={[styles.tagBar, { backgroundColor: TAG_COLOR[element.creativeTag] }]}
        pointerEvents="none"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  loadError: {
    padding: 32,
    fontFamily: 'Aleo_400Regular',
    fontSize: 16,
    color: TEXT_BLACK,
  },

  // Phase header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: HEADER_PAD_TOP,
    paddingLeft: HEADER_LEFT_PAD,
    paddingRight: HEADER_RIGHT_PAD,
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
    color: TEXT_BLACK,
    includeFontPadding: false,
    marginRight: NUMBER_NAME_GAP,
  },
  phaseName: {
    fontFamily: 'Barlow_100Thin',
    fontSize: 36,
    color: TEXT_BLACK,
    includeFontPadding: false,
  },
  subtitle: {
    flex: 1,
    fontFamily: 'Aleo_700Bold',
    fontSize: 20,
    color: TEXT_SUBTITLE,
    includeFontPadding: false,
    paddingLeft: 24,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginLeft: 24,
    gap: 14,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AVATAR_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Aleo_400Regular_Italic',
    fontSize: 14,
    color: TEXT_BLACK,
    includeFontPadding: false,
  },
  comparisonButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonButtonHover: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  comparisonIcon: {
    width: 30,
    height: 32,
  },

  // Content row
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: CHAT_PANEL_LEFT_PAD,
    paddingRight: HEADER_RIGHT_PAD,
    paddingTop: CONTENT_PAD_TOP,
    paddingBottom: CONTENT_PAD_BOTTOM,
    gap: CHAT_TO_COLUMNS_GAP,
  },
  leftColumn: {
    width: CHAT_PANEL_WIDTH,
  },
  columnsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },

  // Chat panel
  chatPanel: {
    flex: 1,
    backgroundColor: CHAT_GRADIENT_BOTTOM,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  chatLabel: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 16,
    color: TEXT_CHAT,
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
    color: TEXT_CHAT,
    includeFontPadding: false,
  },
  bubbleTextUser: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 16,
    color: TEXT_BLACK,
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
    color: TEXT_BLACK,
    includeFontPadding: false,
    paddingRight: SEND_BUTTON_SIZE + 12,
    // @ts-expect-error — web-only style for removing the focus outline ring
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
    backgroundColor: COL_GRADIENT_BOTTOM,
  },
  sendArrow: {
    fontSize: 14,
    color: SEND_BORDER,
    lineHeight: 16,
    includeFontPadding: false,
  },

  // Pillar column
  column: {
    flex: 1,
    backgroundColor: COL_GRADIENT_BOTTOM,
    borderRadius: 10,
    overflow: 'hidden',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 10,
    paddingTop: 14,
    paddingBottom: 10,
  },
  columnLabel: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 20,
    color: TEXT_BLACK,
    includeFontPadding: false,
  },
  columnScroll: {
    flex: 1,
  },
  columnScrollContent: {
    paddingLeft: 14,
    paddingRight: 10,
    paddingBottom: 10,
    gap: 10,
  },

  // Story Element Card
  card: {
    backgroundColor: WHITE,
    borderRadius: CARD_RADIUS,
    minHeight: CARD_MIN_HEIGHT,
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: TAG_BAR_WIDTH + 13,
    paddingVertical: 12,
    position: 'relative',
  },
  cardHover: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardHeaderLabel: {
    flex: 1,
    fontFamily: 'Barlow_500Medium',
    fontSize: 13,
    color: TEXT_BLACK,
    includeFontPadding: false,
  },
  cardBody: {},
  cardParagraph: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 14,
    color: TEXT_BLACK,
    includeFontPadding: false,
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletDot: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 14,
    color: TEXT_BLACK,
    includeFontPadding: false,
    lineHeight: 19,
    width: 12,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Aleo_400Regular',
    fontSize: 14,
    color: TEXT_BLACK,
    includeFontPadding: false,
    lineHeight: 19,
  },
  tagBar: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -TAG_BAR_HEIGHT / 2,
    width: TAG_BAR_WIDTH,
    height: TAG_BAR_HEIGHT,
    borderTopLeftRadius: CARD_RADIUS,
    borderBottomLeftRadius: CARD_RADIUS,
  },
});
