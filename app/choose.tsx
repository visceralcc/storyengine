import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const TEXT_DARK = '#1A1A1A';

export default function ChooseRoute() {
  const router = useRouter();

  const onOpenExisting = () => {
    console.log('Open existing — coming soon');
  };

  const onStartNew = () => {
    router.push('/project/placeholder/steps');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBlock}>
        <Pressable style={styles.row} onPress={onOpenExisting}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Open existing Story</Text>
            <Text style={styles.annotation}>past</Text>
          </View>
          <View style={styles.gapAboveRule} />
          <View style={styles.rule} />
        </Pressable>
        <View style={styles.gapBetweenRows} />
        <Pressable style={styles.row} onPress={onStartNew}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Start New Story</Text>
            <Text style={styles.annotation}>prologue</Text>
          </View>
          <View style={styles.gapAboveRule} />
          <View style={styles.rule} />
        </Pressable>
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
});
