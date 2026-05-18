import { Stack } from 'expo-router';
import { useFonts, Barlow_100Thin, Barlow_500Medium } from '@expo-google-fonts/barlow';
import { Domine_400Regular, Domine_700Bold } from '@expo-google-fonts/domine';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Barlow_100Thin,
    Barlow_500Medium,
    Domine_400Regular,
    Domine_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
