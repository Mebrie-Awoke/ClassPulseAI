/**
 * ClassPulse AI — Root Layout (Expo Router)
 *
 * Sets up the navigation stack with a consistent dark theme.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../constants/theme';
import CustomSplashScreen from '../components/CustomSplashScreen';

SplashScreen.preventAutoHideAsync().catch(error => {
  console.warn('Could not keep the native splash screen visible:', error);
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      />
      {showSplash && <CustomSplashScreen onFinish={() => setShowSplash(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030712',
  },
});
