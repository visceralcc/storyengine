import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const TEXT_UNLOCKED = '#1A1A1A';
const TEXT_LOCKED = '#999999';
const RULE_UNLOCKED = '#1A1A1A';
const RULE_LOCKED = '#D2D2D2';

type StepRowProps = {
  number: string;
  name: string;
  locked: boolean;
  onPress?: () => void;
};

function StepRow({ number, name, locked, onPress }: StepRowProps) {
  const [hovered, setHovered] = useState(false);
  const textColor = locked ? TEXT_LOCKED : TEXT_UNLOCKED;
  const ruleColor = locked ? RULE_LOCKED : RULE_UNLOCKED;

  const content = (hover: boolean) => (
    <>
      <View style={[styles.labelRow, hover && styles.hovered]}>
        <Text style={[styles.number, { color: textColor }]}>{number}</Text>
        <Text style={[styles.name, { color: textColor }]}>{name}</Text>
      </View>
      <View style={styles.gapAboveRule} />
      <View style={[styles.rule, { backgroundColor: ruleColor }]} />
    </>
  );

  if (locked) {
    return <View style={styles.row}>{content(false)}</View>;
  }
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {content(hovered)}
    </Pressable>
  );
}

export default function StepsRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.contentBlock}>
        <StepRow
          number="1"
          name="Discovery"
          locked={false}
          onPress={() => router.push(`/project/${projectId}/discovery`)}
        />
        <View style={styles.gapBetweenRows} />
        <StepRow
          number="2"
          name="Development"
          locked={false}
          onPress={() => router.push(`/project/${projectId}/development`)}
        />
        <View style={styles.gapBetweenRows} />
        <StepRow number="3" name="Refinement" locked />
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
    top: '27.9%',
    left: '5.3%',
    width: '48%',
  },
  row: {},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingLeft: 13,
  },
  number: {
    fontFamily: 'Barlow_100Thin',
    fontSize: 96,
    lineHeight: 110,
    width: 90,
    includeFontPadding: false,
  },
  name: {
    fontFamily: 'Barlow_100Thin',
    fontSize: 96,
    lineHeight: 110,
    includeFontPadding: false,
  },
  gapAboveRule: {
    height: 21,
  },
  rule: {
    height: 1,
    width: '100%',
  },
  gapBetweenRows: {
    height: 21,
  },
  hovered: {
    opacity: 0.7,
  },
});
