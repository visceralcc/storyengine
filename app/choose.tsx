import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ChooseRoute() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Project Chooser (placeholder)</Text>
      <Pressable
        style={styles.row}
        onPress={() => console.log('Open existing — coming soon')}
      >
        <Text style={styles.label}>Open existing Story</Text>
      </Pressable>
      <Pressable
        style={styles.row}
        onPress={() => router.push('/project/placeholder/steps')}
      >
        <Text style={styles.label}>Start New Story</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24 },
  heading: { fontSize: 18, color: '#999999', marginBottom: 24 },
  row: { paddingVertical: 16 },
  label: { fontSize: 24, color: '#1A1A1A' },
});
