import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { initializeProject } from '../src/models/factories';

const TEXT_DARK = '#1A1A1A';
const HOVER_OPACITY = 0.7;

type RowProps = {
  label: string;
  annotation: string;
  onPress: () => void;
};

function ChooserRow({ label, annotation, onPress }: RowProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <View style={[styles.labelRow, hovered && styles.hovered]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.annotation}>{annotation}</Text>
      </View>
      <View style={styles.gapAboveRule} />
      <View style={styles.rule} />
    </Pressable>
  );
}

export default function ChooseRoute() {
  const router = useRouter();

  const onOpenExisting = () => {
    console.log('Open existing — coming soon');
  };

  const onStartNew = () => {
    const { project } = initializeProject({ name: 'Untitled Story' });
    router.push(`/project/${project.id}/steps`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBlock}>
        <ChooserRow
          label="Open existing Story"
          annotation="past"
          onPress={onOpenExisting}
        />
        <View style={styles.gapBetweenRows} />
        <ChooserRow
          label="Start New Story"
          annotation="prologue"
          onPress={onStartNew}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentBlock: {
    position: 'absolute',
    top: '36.4%',
    left: '5.3%',
    width: '48%',
  },
  row: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: 23,
  },
  label: {
    fontFamily: 'Barlow_100Thin',
    fontSize: 40,
    color: TEXT_DARK,
    includeFontPadding: false,
  },
  annotation: {
    fontFamily: 'NoticiaText_700Bold_Italic',
    fontSize: 24,
    color: TEXT_DARK,
    includeFontPadding: false,
  },
  gapAboveRule: {
    height: 32,
  },
  rule: {
    height: 1,
    backgroundColor: TEXT_DARK,
    width: '100%',
  },
  gapBetweenRows: {
    height: 50,
  },
  hovered: {
    opacity: HOVER_OPACITY,
  },
});
