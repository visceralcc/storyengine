import { useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

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

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'msg_initial', role: 'assistant', content: 'How can I help?' },
];

export default function DiscoveryRoute() {
  // projectId reserved for note CRUD wiring in Phase 4
  useLocalSearchParams<{ projectId: string }>();

  return (
    <View style={styles.container}>
      <PhaseHeader />
      <View style={styles.contentRow}>
        <ChatPanel />
        <View style={styles.divider} />
        <View style={styles.canvas} />
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
    fontFamily: 'NoticiaText_400Regular',
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
    fontFamily: 'NoticiaText_700Bold',
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
    fontFamily: 'NoticiaText_400Regular_Italic',
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
  chatPanel: {
    width: CHAT_PANEL_WIDTH,
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: CHAT_PANEL_INNER_PAD,
  },
  chatLabel: {
    fontFamily: 'NoticiaText_400Regular',
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
    fontFamily: 'NoticiaText_700Bold',
    fontSize: 16,
    color: TEXT_SECONDARY,
    includeFontPadding: false,
  },
  bubbleTextUser: {
    fontFamily: 'NoticiaText_400Regular',
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
    fontFamily: 'NoticiaText_400Regular',
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
  divider: {
    width: 1,
    backgroundColor: SURFACE_ALT,
    marginHorizontal: 31,
  },
  canvas: {
    flex: 1,
    backgroundColor: WHITE,
  },
});
