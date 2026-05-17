import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function StepsRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Step Menu (placeholder)</Text>
      <Text style={styles.meta}>projectId: {projectId}</Text>
      <Pressable
        style={styles.row}
        onPress={() => router.push(`/project/${projectId}/discovery`)}
      >
        <Text style={styles.label}>1 Discovery</Text>
      </Pressable>
      <View style={styles.row}>
        <Text style={[styles.label, styles.locked]}>2 Development</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, styles.locked]}>3 Refinement</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  heading: { fontSize: 18, color: '#999999' },
  meta: { fontSize: 12, color: '#999999', marginBottom: 24 },
  row: { paddingVertical: 16 },
  label: { fontSize: 32, color: '#1A1A1A' },
  locked: { color: '#999999' },
});
