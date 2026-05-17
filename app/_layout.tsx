import { Stack } from 'expo-router';
import { useFonts, Barlow_100Thin } from '@expo-google-fonts/barlow';
import { NoticiaText_700Bold_Italic } from '@expo-google-fonts/noticia-text';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Barlow_100Thin,
    NoticiaText_700Bold_Italic,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
