import { Stack } from 'expo-router';
import { useFonts, Barlow_100Thin, Barlow_500Medium } from '@expo-google-fonts/barlow';
import {
  NoticiaText_400Regular,
  NoticiaText_400Regular_Italic,
  NoticiaText_700Bold,
  NoticiaText_700Bold_Italic,
} from '@expo-google-fonts/noticia-text';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Barlow_100Thin,
    Barlow_500Medium,
    NoticiaText_400Regular,
    NoticiaText_400Regular_Italic,
    NoticiaText_700Bold,
    NoticiaText_700Bold_Italic,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
