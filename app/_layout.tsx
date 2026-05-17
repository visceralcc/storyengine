import { Stack } from 'expo-router';
import { useFonts, Barlow_100Thin } from '@expo-google-fonts/barlow';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Barlow_100Thin,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
