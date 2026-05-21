import { Stack } from 'expo-router';
import {
  useFonts,
  Barlow_100Thin,
  Barlow_400Regular,
  Barlow_500Medium,
} from '@expo-google-fonts/barlow';
import { Aleo_400Regular, Aleo_400Regular_Italic, Aleo_700Bold } from '@expo-google-fonts/aleo';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Barlow_100Thin,
    Barlow_400Regular,
    Barlow_500Medium,
    Aleo_400Regular,
    Aleo_400Regular_Italic,
    Aleo_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
