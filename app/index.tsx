import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Asset } from 'expo-asset';

// Bundled looping background video (Spec_SplashScreen_Design §3.1). Resolved
// through expo-asset so the raw <video> element receives a real URL string —
// a bare `require` of an asset is not directly usable as a DOM `src`.
const SPLASH_VIDEO_URI = Asset.fromModule(require('../assets/video/splash.mp4')).uri;

/**
 * Full-bleed background video. A plain HTML <video> rendered through React
 * Native Web's DOM passthrough (web-only — no expo-av). Autoplays, loops,
 * muted, and covers the viewport, cropping from the center. If it fails to
 * load, the dark container background shows through (Spec §5.3 fallback).
 */
function VideoBackground() {
  return (
    <video
      src={SPLASH_VIDEO_URI}
      autoPlay
      loop
      muted
      playsInline
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
      }}
    />
  );
}

export default function SplashRoute() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [navigated, setNavigated] = useState(false);

  const goToChooser = () => {
    if (navigated) return;
    setNavigated(true);
    router.push('/choose');
  };

  // Any keypress also advances, so desktop users aren't stuck (Spec §4.1).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = () => goToChooser();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // 260pt display size, scaled down proportionally on narrower viewports (Spec §8).
  const fontSize = Math.min(260, width * 0.14);

  return (
    <View style={styles.container}>
      <VideoBackground />
      <Pressable style={styles.pressable} onPress={goToChooser}>
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={[styles.title, { fontSize }]}
        >
          STORYENGINE
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Dark fallback shown while the video loads (and if it fails to play) —
    // prevents a white flash and matches the Spec §5.3 failure state.
    backgroundColor: '#1A1A1A',
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '8%',
    // Sit above the absolutely-positioned video (zIndex 0).
    zIndex: 1,
  },
  title: {
    fontFamily: 'Barlow_100Thin',
    textAlign: 'center',
    includeFontPadding: false,
    color: '#FFFFFF',
  },
});
