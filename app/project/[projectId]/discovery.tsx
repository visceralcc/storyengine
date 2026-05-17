import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function DiscoveryRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Discovery (placeholder)</Text>
      <Text style={styles.meta}>projectId: {projectId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  heading: { fontSize: 18, color: '#1A1A1A' },
  meta: { fontSize: 12, color: '#999999', marginTop: 8 },
});
