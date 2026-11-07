/**
 * ClassPulse AI — Root Layout (Expo Router)
 * Sets up the navigation stack with a consistent dark theme.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D1B2A' },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}
