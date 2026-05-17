import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SplashRoute() {
  const router = useRouter();
  return (
    <Pressable style={styles.container} onPress={() => router.push('/choose')}>
      <View style={styles.inner}>
        <Text style={styles.title}>Splash (placeholder)</Text>
        <Text style={styles.hint}>Tap anywhere to continue</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, color: '#1A1A1A' },
  hint: { fontSize: 14, color: '#999999', marginTop: 8 },
});
