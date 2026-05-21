/**
 * Development screen — Phase 2 of the creative pipeline.
 *
 * Two surfaces live here, swapped with a dissolve transition:
 *  - Development Canvas — three-column overview of every story element.
 *  - Story Element Detail View — focused writing environment for one element.
 *
 * Spec: docs/development/Spec_Development_Design.md §3, §4, §5, §7.
 *
 * Build phases:
 *  - Phase 1 ✅ — canvas layout and card rendering.
 *  - Phase 2 ✅ — Story Element Detail View (writing area, IDEA + DEFINITION
 *    sections, pillar reassignment, Related Elements panel, dismiss nav).
 *  - Phase 3 — Compare View + comparison-mode flow.
 *  - Phase 4 — chat AI wiring, text highlighting, contextual prompts.
 *
 * The chat panel is local-only (no AI / no persistence yet); edits to story
 * elements live in memory only. Both arrive in a later phase.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  Animated,
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
const ICON_PENCIL = require('../../../assets/icons/icon_pencil.svg');
const BUTTON_CLOSE_X = require('../../../assets/buttons/button-close-x.svg');
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
const IDEA_BG = '#E4F5FF';
const AVATAR_BG = '#E8E8E8';
const SEND_BORDER = '#656363';

const TAG_COLOR: Record<CreativeTag, string> = {
  CORE: '#9CCBAC',
  EVOLVE: '#F2BA03',
  SET_ASIDE: '#AA5959',
};

// --- Layout tokens (Spec §7 "Spacing & Layout") ---
const HEADER_PAD_TOP = 64;
const HEADER_LEFT_PAD = 82;
const HEADER_RIGHT_PAD = 32;
const NUMBER_NAME_GAP = 72;
const CHAT_PANEL_LEFT_PAD = 72;
const CHAT_PANEL_WIDTH = 309;
const RELATED_PANEL_WIDTH = 426;
const REGION_GAP = 24;
const COLUMN_GAP = 16;
const CONTENT_PAD_TOP = 24;
const DETAIL_PAD_TOP = 64;
const CONTENT_PAD_BOTTOM = 32;

const CHAT_INPUT_HEIGHT = 132;
const SEND_BUTTON_SIZE = 26;

const CARD_RADIUS = 10;
const TAG_BAR_WIDTH = 17;
const TAG_BAR_HEIGHT = 72;
const CARD_MIN_HEIGHT = 96;
const DEFINITION_MIN_HEIGHT = 220;

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

/** Web-only style: removes the browser focus outline ring on text inputs. */
const NO_OUTLINE = { outlineStyle: 'none' } as object;

function iconSize(pillar: Pillar, height: number): { width: number; height: number } {
  return { width: Math.round(height * PILLAR_META[pillar].ratio), height };
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
  // Real story elements come from Discovery consolidation; until that pipeline
  // is wired, this resolves to the Ready Player One sample dataset. Held in
  // state so the Detail View can edit titles, definitions, and pillars.
  const [elements, setElements] = useState<StoryElement[]>(() => getStoryElements(projectFile));
  const [comparisonActive, setComparisonActive] = useState(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  // Dissolve transition between the canvas and the Detail View (Spec §3.2):
  // fade the current surface out, swap, fade the new surface in.
  const fade = useRef(new Animated.Value(1)).current;
  const navigateTo = (next: string | null) => {
    Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
      setActiveElementId(next);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: false }).start();
    });
  };

  const updateElement = (id: string, patch: Partial<StoryElement>) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  };

  const activeElement = activeElementId
    ? elements.find((el) => el.id === activeElementId) ?? null
    : null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.fadeLayer, { opacity: fade }]}>
        {activeElement ? (
          <StoryElementDetailView
            key={activeElement.id}
            projectId={projectId}
            element={activeElement}
            allElements={elements}
            onDismiss={() => navigateTo(null)}
            onNavigate={(id) => navigateTo(id)}
            onUpdate={updateElement}
          />
        ) : (
          <DevelopmentCanvas
            projectId={projectId}
            elements={elements}
            comparisonActive={comparisonActive}
            onToggleComparison={() => setComparisonActive((v) => !v)}
            onOpenElement={(el) => navigateTo(el.id)}
          />
        )}
      </Animated.View>
    </View>
  );
}

// =====================================================================
// Development Canvas (Spec §3.1)
// =====================================================================

type DevelopmentCanvasProps = {
  projectId: string;
  elements: StoryElement[];
  comparisonActive: boolean;
  onToggleComparison: () => void;
  onOpenElement: (element: StoryElement) => void;
};

function DevelopmentCanvas({
  projectId,
  elements,
  comparisonActive,
  onToggleComparison,
  onOpenElement,
}: DevelopmentCanvasProps) {
  return (
    <View style={styles.surface}>
      <PhaseHeader comparisonActive={comparisonActive} onToggleComparison={onToggleComparison} />
      <View style={styles.contentRow}>
        <View style={styles.chatRegion}>
          <ChatPanel projectId={projectId} />
        </View>
        <View style={styles.columnsRow}>
          {PILLAR_ORDER.map((pillar) => (
            <PillarColumn
              key={pillar}
              pillar={pillar}
              elements={elements.filter((el) => el.pillar === pillar)}
              onOpenElement={onOpenElement}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

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
        (state as { hovered?: boolean }).hovered && styles.iconButtonHover,
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

// --- Pillar column (Spec §3.1 "Content columns") ---

type PillarColumnProps = {
  pillar: Pillar;
  elements: StoryElement[];
  onOpenElement: (element: StoryElement) => void;
};

function PillarColumn({ pillar, elements, onOpenElement }: PillarColumnProps) {
  const meta = PILLAR_META[pillar];
  return (
    <View style={[styles.column, gradient(COL_GRADIENT_TOP, COL_GRADIENT_BOTTOM)]}>
      <View style={styles.columnHeader}>
        <Image source={meta.icon} style={iconSize(pillar, 26)} accessibilityIgnoresInvertColors />
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
  /** Glance variant: drop shadow, used in the Related Elements panel (Spec §3.2). */
  glance?: boolean;
};

function StoryElementCard({ element, onPress, glance = false }: StoryElementCardProps) {
  const meta = PILLAR_META[element.pillar];
  const bullets = isBulletElement(element);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}: ${element.label}`}
      onPress={onPress}
      style={(state) => [
        styles.card,
        glance && styles.cardGlance,
        !glance && (state as { hovered?: boolean }).hovered && styles.cardHover,
      ]}
    >
      <View style={styles.cardHeader}>
        <Image source={meta.icon} style={iconSize(element.pillar, 19)} accessibilityIgnoresInvertColors />
        <Text style={styles.cardHeaderLabel} numberOfLines={1}>
          {meta.label} / {element.label}
        </Text>
      </View>
      <View>
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

// =====================================================================
// Story Element Detail View (Spec §3.2)
// =====================================================================

type StoryElementDetailViewProps = {
  projectId: string;
  element: StoryElement;
  allElements: StoryElement[];
  onDismiss: () => void;
  onNavigate: (elementId: string) => void;
  onUpdate: (id: string, patch: Partial<StoryElement>) => void;
};

function detailWelcome(element: StoryElement): string {
  const pillar = PILLAR_META[element.pillar].label.toLowerCase();
  return `Let's go deeper on "${element.title}". What's the most important thing about this ${pillar} that isn't on the page yet?`;
}

function StoryElementDetailView({
  projectId,
  element,
  allElements,
  onDismiss,
  onNavigate,
  onUpdate,
}: StoryElementDetailViewProps) {
  const related = useMemo(
    () =>
      element.relatedIds
        .map((id) => allElements.find((el) => el.id === id))
        .filter((el): el is StoryElement => Boolean(el)),
    [element.relatedIds, allElements],
  );

  return (
    <View style={styles.surface}>
      <View style={styles.detailRow}>
        <View style={styles.chatRegion}>
          <ChatPanel projectId={projectId} welcome={detailWelcome(element)} />
        </View>
        <View style={styles.writingRegion}>
          <WritingArea element={element} onDismiss={onDismiss} onUpdate={onUpdate} />
        </View>
        <View style={styles.relatedRegion}>
          <RelatedElementsPanel pillar={element.pillar} related={related} onNavigate={onNavigate} />
        </View>
      </View>
    </View>
  );
}

// --- Writing Area (Spec §3.2 "Center region") ---

type WritingAreaProps = {
  element: StoryElement;
  onDismiss: () => void;
  onUpdate: (id: string, patch: Partial<StoryElement>) => void;
};

function WritingArea({ element, onDismiss, onUpdate }: WritingAreaProps) {
  // `ideaEditing` puts both the element title and the IDEA summary into edit
  // mode (Spec §3.2: title editing is the IDEA-section pencil; §4.2: that
  // pencil also edits the Discovery summary).
  const [ideaEditing, setIdeaEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(element.title);
  const [summaryDraft, setSummaryDraft] = useState(element.summary);
  const [definitionDraft, setDefinitionDraft] = useState(element.definition ?? '');
  const [definitionHeight, setDefinitionHeight] = useState(DEFINITION_MIN_HEIGHT);
  const [pillarMenuOpen, setPillarMenuOpen] = useState(false);
  const definitionRef = useRef<TextInput>(null);
  const meta = PILLAR_META[element.pillar];

  const toggleIdeaEditing = () => {
    if (ideaEditing) {
      // Commit. Keep the canvas card body in sync with the summary for
      // paragraph (Theme/World) elements; Character bodies are bullets.
      const patch: Partial<StoryElement> = { title: titleDraft, summary: summaryDraft };
      if (element.pillar !== 'CHARACTER') patch.body = [summaryDraft];
      onUpdate(element.id, patch);
    }
    setIdeaEditing((v) => !v);
  };

  const commitDefinition = () => {
    if (definitionDraft !== (element.definition ?? '')) {
      onUpdate(element.id, { definition: definitionDraft.length > 0 ? definitionDraft : null });
    }
  };

  const reassignPillar = (pillar: Pillar) => {
    setPillarMenuOpen(false);
    if (pillar !== element.pillar) onUpdate(element.id, { pillar });
  };

  return (
    <View style={[styles.writingOuter, gradient(COL_GRADIENT_TOP, COL_GRADIENT_BOTTOM)]}>
      <View style={styles.writingTopRow}>
        {/* Tappable pillar header — opens the reassignment dropdown (Spec §3.2). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pillar: ${meta.label}. Tap to reassign.`}
          onPress={() => setPillarMenuOpen((v) => !v)}
          style={(state) => [
            styles.pillarHeader,
            (state as { hovered?: boolean }).hovered && styles.pillarHeaderHover,
          ]}
        >
          <Image source={meta.icon} style={iconSize(element.pillar, 35)} accessibilityIgnoresInvertColors />
          <Text style={styles.pillarHeaderLabel}>{meta.label}</Text>
          <Text style={styles.pillarCaret}>▾</Text>
        </Pressable>
        <DismissButton onPress={onDismiss} />
      </View>

      <View style={styles.whiteInner}>
        <View
          style={[styles.detailTagBar, { backgroundColor: TAG_COLOR[element.creativeTag] }]}
          pointerEvents="none"
        />
        <ScrollView
          style={styles.writingScroll}
          contentContainerStyle={styles.writingScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {ideaEditing ? (
            <TextInput
              style={[styles.elementTitleInput, NO_OUTLINE]}
              value={titleDraft}
              onChangeText={setTitleDraft}
              placeholder="Element title"
              placeholderTextColor={TEXT_PLACEHOLDER}
            />
          ) : (
            <Text style={styles.elementTitle}>{element.title}</Text>
          )}

          {/* IDEA section (Spec §3.2) */}
          <View style={styles.ideaSection}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>IDEA</Text>
              <PencilButton
                active={ideaEditing}
                accessibilityLabel={ideaEditing ? 'Done editing idea' : 'Edit idea'}
                onPress={toggleIdeaEditing}
              />
            </View>
            {ideaEditing ? (
              <TextInput
                style={[styles.ideaInput, NO_OUTLINE]}
                value={summaryDraft}
                onChangeText={setSummaryDraft}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.ideaText}>{element.summary}</Text>
            )}
          </View>

          {/* IDEA THOUGHT / DEFINITION section (Spec §3.2) */}
          <View style={styles.ideaSection}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>IDEA THOUGHT / DEFINITION</Text>
              <PencilButton
                accessibilityLabel="Edit definition"
                onPress={() => definitionRef.current?.focus()}
              />
            </View>
            <TextInput
              ref={definitionRef}
              style={[styles.definitionInput, { height: definitionHeight }, NO_OUTLINE]}
              value={definitionDraft}
              onChangeText={setDefinitionDraft}
              onBlur={commitDefinition}
              onContentSizeChange={(e) => {
                const h = (e.nativeEvent as { contentSize?: { height: number } }).contentSize
                  ?.height;
                if (h) setDefinitionHeight(Math.max(DEFINITION_MIN_HEIGHT, h));
              }}
              placeholder="Expand on this idea..."
              placeholderTextColor={TEXT_PLACEHOLDER}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>

      {/* Pillar reassignment dropdown — overlay catches outside taps. */}
      {pillarMenuOpen && (
        <>
          <Pressable
            style={styles.pillarOverlay}
            accessibilityLabel="Close pillar menu"
            onPress={() => setPillarMenuOpen(false)}
          />
          <View style={styles.pillarMenu}>
            {PILLAR_ORDER.map((p) => (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityState={{ selected: p === element.pillar }}
                onPress={() => reassignPillar(p)}
                style={(state) => [
                  styles.pillarMenuItem,
                  (state as { hovered?: boolean }).hovered && styles.pillarMenuItemHover,
                ]}
              >
                <Image source={PILLAR_META[p].icon} style={iconSize(p, 20)} accessibilityIgnoresInvertColors />
                <Text
                  style={[
                    styles.pillarMenuLabel,
                    p === element.pillar && styles.pillarMenuLabelActive,
                  ]}
                >
                  {PILLAR_META[p].label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

type PencilButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
};

function PencilButton({ onPress, accessibilityLabel, active = false }: PencilButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={(state) => [
        styles.pencilButton,
        active && styles.pencilButtonActive,
        (state as { hovered?: boolean }).hovered && styles.iconButtonHover,
      ]}
    >
      <Image source={ICON_PENCIL} style={styles.pencilIcon} accessibilityIgnoresInvertColors />
    </Pressable>
  );
}

type DismissButtonProps = {
  onPress: () => void;
};

function DismissButton({ onPress }: DismissButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close — return to canvas"
      onPress={onPress}
      style={(state) => [
        styles.dismissButton,
        (state as { hovered?: boolean }).hovered && styles.iconButtonHover,
      ]}
    >
      <Image source={BUTTON_CLOSE_X} style={styles.dismissIcon} accessibilityIgnoresInvertColors />
    </Pressable>
  );
}

// --- Related Elements Panel (Spec §3.2 "Right region") ---

type RelatedElementsPanelProps = {
  pillar: Pillar;
  related: StoryElement[];
  onNavigate: (elementId: string) => void;
};

function RelatedElementsPanel({ pillar, related, onNavigate }: RelatedElementsPanelProps) {
  return (
    <View style={styles.relatedPanel}>
      <Text style={styles.relatedHeader}>This {PILLAR_META[pillar].label} connects to:</Text>
      {related.length === 0 ? (
        <Text style={styles.relatedEmpty}>
          No connections yet. As you write, the AI will surface related elements.
        </Text>
      ) : (
        <ScrollView
          style={styles.relatedScroll}
          contentContainerStyle={styles.relatedList}
          showsVerticalScrollIndicator={false}
        >
          {related.map((el) => (
            <StoryElementCard key={el.id} element={el} glance onPress={() => onNavigate(el.id)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// =====================================================================
// Chat Panel — shared by the canvas and the Detail View (Spec §3.1, §3.2)
// =====================================================================

const CANVAS_WELCOME = 'Your ideas are organized. Tap any element to start defining it in detail.';

type ChatPanelProps = {
  projectId: string;
  /** Opening assistant message — contextual to the active element in the Detail View. */
  welcome?: string;
};

function ChatPanel({ projectId, welcome = CANVAS_WELCOME }: ChatPanelProps) {
  // Phase 1/2: local-only. AI wiring + persistence arrive in a later phase.
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
          <Text style={styles.bubbleTextAi}>{welcome}</Text>
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
          style={[styles.chatInput, NO_OUTLINE]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  fadeLayer: {
    flex: 1,
  },
  surface: {
    flex: 1,
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
  comparisonIcon: {
    width: 30,
    height: 32,
  },
  iconButtonHover: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

  // Canvas content row
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: CHAT_PANEL_LEFT_PAD,
    paddingRight: HEADER_RIGHT_PAD,
    paddingTop: CONTENT_PAD_TOP,
    paddingBottom: CONTENT_PAD_BOTTOM,
    gap: REGION_GAP,
  },
  columnsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },

  // Detail View region row
  detailRow: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: CHAT_PANEL_LEFT_PAD,
    paddingRight: HEADER_RIGHT_PAD,
    paddingTop: DETAIL_PAD_TOP,
    paddingBottom: CONTENT_PAD_BOTTOM,
    gap: REGION_GAP,
  },
  chatRegion: {
    width: CHAT_PANEL_WIDTH,
  },
  writingRegion: {
    flex: 1,
  },
  relatedRegion: {
    width: RELATED_PANEL_WIDTH,
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
  cardGlance: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 4 },
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

  // Writing area
  writingOuter: {
    flex: 1,
    backgroundColor: COL_GRADIENT_BOTTOM,
    borderRadius: 10,
    padding: 16,
    position: 'relative',
  },
  writingTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  pillarHeaderHover: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  pillarHeaderLabel: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 20,
    color: TEXT_BLACK,
    includeFontPadding: false,
  },
  pillarCaret: {
    fontSize: 12,
    color: TEXT_SUBTITLE,
    includeFontPadding: false,
    marginLeft: 2,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissIcon: {
    width: 24,
    height: 24,
  },
  whiteInner: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  detailTagBar: {
    position: 'absolute',
    left: 0,
    top: 28,
    width: TAG_BAR_WIDTH,
    height: TAG_BAR_HEIGHT,
    borderTopRightRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
    zIndex: 2,
  },
  writingScroll: {
    flex: 1,
  },
  writingScrollContent: {
    paddingLeft: 34,
    paddingRight: 28,
    paddingTop: 28,
    paddingBottom: 32,
  },
  elementTitle: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 36,
    color: TEXT_BLACK,
    includeFontPadding: false,
    marginBottom: 18,
  },
  elementTitleInput: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 36,
    color: TEXT_BLACK,
    includeFontPadding: false,
    marginBottom: 18,
  },
  ideaSection: {
    backgroundColor: IDEA_BG,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 15,
    color: TEXT_BLACK,
    includeFontPadding: false,
    textTransform: 'uppercase',
  },
  ideaText: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 20,
    color: TEXT_BLACK,
    includeFontPadding: false,
    lineHeight: 28,
  },
  ideaInput: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 20,
    color: TEXT_BLACK,
    includeFontPadding: false,
    lineHeight: 28,
    minHeight: 84,
  },
  definitionInput: {
    fontFamily: 'Aleo_400Regular',
    fontSize: 20,
    color: TEXT_BLACK,
    includeFontPadding: false,
    lineHeight: 28,
  },
  pencilButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  pencilIcon: {
    width: 15,
    height: 15,
  },

  // Pillar reassignment dropdown
  pillarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  pillarMenu: {
    position: 'absolute',
    top: 56,
    left: 16,
    backgroundColor: WHITE,
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 168,
    zIndex: 11,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pillarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  pillarMenuItemHover: {
    backgroundColor: COL_GRADIENT_TOP,
  },
  pillarMenuLabel: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 16,
    color: TEXT_BLACK,
    includeFontPadding: false,
  },
  pillarMenuLabelActive: {
    fontFamily: 'Barlow_500Medium',
  },

  // Related Elements panel
  relatedPanel: {
    flex: 1,
  },
  relatedHeader: {
    fontFamily: 'Barlow_500Medium',
    fontSize: 20,
    color: TEXT_BLACK,
    includeFontPadding: false,
    marginBottom: 16,
    paddingLeft: 4,
  },
  relatedEmpty: {
    fontFamily: 'Aleo_400Regular_Italic',
    fontSize: 16,
    color: TEXT_PLACEHOLDER,
    includeFontPadding: false,
    lineHeight: 24,
    paddingLeft: 4,
    paddingRight: 12,
  },
  relatedScroll: {
    flex: 1,
  },
  relatedList: {
    paddingTop: 4,
    paddingBottom: 16,
    paddingLeft: 4,
    paddingRight: 14,
    gap: 14,
  },
});
