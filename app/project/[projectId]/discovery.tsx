import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// Tokens — Spec_Discovery_Design.md §3, §7
const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#AFAFAF';
const SURFACE = '#F5F5F5';
const SURFACE_ALT = '#E8E8E8';
const CANVAS_BG = '#FFFFFF';

const HEADER_LEFT_PAD = 82;
const NUMBER_NAME_GAP = 72;
const CHAT_PANEL_LEFT_PAD = 72;
const CHAT_PANEL_WIDTH = 309;
const HEADER_PAD_TOP = 64;
const CONTENT_GAP = 24;

export default function DiscoveryRoute() {
  // projectId reserved for note CRUD wiring in Phase 4
  useLocalSearchParams<{ projectId: string }>();

  return (
    <View style={styles.container}>
      <PhaseHeader />
      <View style={styles.contentRow}>
        <View style={styles.chatPanel} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CANVAS_BG,
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
  },
  divider: {
    width: 1,
    backgroundColor: SURFACE_ALT,
    marginHorizontal: 31,
  },
  canvas: {
    flex: 1,
    backgroundColor: CANVAS_BG,
  },
});
