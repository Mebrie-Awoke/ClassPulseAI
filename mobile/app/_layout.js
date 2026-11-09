/**
 * RoomPulse — Root Navigation Layout (Expo Router).
 *
 * Implements:
 *   - Native OS splash hold with preventAutoHideAsync.
 *   - Full-display custom splash screen with smooth fade transition.
 *   - Hidden status bar during splash, restoring dark status bar on handoff.
 *   - Consistent navigation stack theme and styling.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../src/constants/theme';
import CustomSplashScreen from '../src/components/CustomSplashScreen';

// Prevent the native splash screen from auto-hiding before custom splash is mounted
SplashScreen.preventAutoHideAsync().catch(() => {
  // Safe guard: Catch error if called repeatedly in dev reload
});

export default function RootLayout() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" hidden={isSplashVisible} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      />
      {isSplashVisible && (
        <CustomSplashScreen onFinish={handleSplashFinish} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
