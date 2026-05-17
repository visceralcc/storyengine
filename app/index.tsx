import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';

const TRANSITION_MS = 500;
const VIDEO_LOAD_DELAY_MS = 600;

export default function SplashRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const bgProgress = useRef(new Animated.Value(0)).current;
  const [navigated, setNavigated] = useState(false);

  const goToChooser = () => {
    if (navigated) return;
    setNavigated(true);
    router.push('/choose');
  };

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(bgProgress, {
        toValue: 1,
        duration: TRANSITION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }, VIDEO_LOAD_DELAY_MS);
    return () => clearTimeout(t);
  }, [bgProgress]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = () => goToChooser();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const backgroundColor = bgProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#1A1A1A'],
  });
  const titleColor = bgProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1A1A1A', '#FFFFFF'],
  });

  const fontSize = Math.min(260, width * 0.14);

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <Pressable style={styles.pressable} onPress={goToChooser}>
        <Animated.Text
          numberOfLines={1}
          allowFontScaling={false}
          style={[styles.title, { color: titleColor, fontSize }]}
        >
          STORYENGINE
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '8%',
  },
  title: {
    fontFamily: 'Barlow_100Thin',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
