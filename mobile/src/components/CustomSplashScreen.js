/**
 * RoomPulse — Full-Display Custom Splash Screen.
 *
 * Guarantees:
 *   - 100% full-screen coverage with no white borders, unwanted margins, or empty space.
 *   - Maintains aspect ratio with cover cropping.
 *   - Completely hides status bar during splash display.
 *   - Controlled display duration (~2 seconds) with smooth fade-out animation.
 *   - Seamless handoff from native OS splash (preventAutoHide -> hideAsync on mount).
 *   - Hardened timeout safety to guarantee the splash is never permanently stuck.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

const SPLASH_IMAGE = require('../../assets/splashs.jpg');
const DISPLAY_DURATION_MS = 2000;
const FADE_OUT_DURATION_MS = 400;
const SAFETY_FALLBACK_TIMEOUT_MS = 3500;

export default function CustomSplashScreen({ onFinish }) {
  const [isRendered, setIsRendered] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isFinishedRef = useRef(false);

  useEffect(() => {
    // Dismiss the native OS splash window immediately now that custom splash is active
    SplashScreen.hideAsync().catch(() => {
      // Non-fatal if already dismissed
    });

    const finishSplash = () => {
      if (isFinishedRef.current) return;
      isFinishedRef.current = true;

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_OUT_DURATION_MS,
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
        if (onFinish) {
          onFinish();
        }
      });
    };

    // Primary duration timer
    const displayTimer = setTimeout(finishSplash, DISPLAY_DURATION_MS);

    // Hardened safety timer ensures splash never remains visible if an unexpected hitch occurs
    const safetyTimer = setTimeout(() => {
      if (!isFinishedRef.current) {
        finishSplash();
      }
    }, SAFETY_FALLBACK_TIMEOUT_MS);

    return () => {
      clearTimeout(displayTimer);
      clearTimeout(safetyTimer);
    };
  }, [fadeAnim, onFinish]);

  if (!isRendered) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents="none"
    >
      <StatusBar hidden={true} translucent={true} />
      <Image
        source={SPLASH_IMAGE}
        style={styles.splashImage}
        resizeMode="cover"
        fadeDuration={0}
      />
    </Animated.View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#030712',
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});

