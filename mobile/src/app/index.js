/**
 * ClassPulse AI — Home Screen (index.js)
 *
 * Shows environment selection and Start Scanning button.
 * No unnecessary navigation, no settings, no profile.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import EnvironmentCard from '../components/EnvironmentCard';

export default function HomeScreen() {
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const router = useRouter();

  const handleStartScanning = () => {
    if (!selectedEnvironment) return;
    router.push({
      pathname: '/scanner',
      params: { environment: selectedEnvironment },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🔍</Text>
          <Text style={styles.logoText}>ClassPulse AI</Text>
          <Text style={styles.tagline}>Your Environment, Decoded by AI.</Text>
        </View>

        {/* Environment selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Environment</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the type of space you want to analyze
          </Text>

          <EnvironmentCard
            id="classroom"
            selected={selectedEnvironment === 'classroom'}
            onPress={setSelectedEnvironment}
          />
          <EnvironmentCard
            id="library"
            selected={selectedEnvironment === 'library'}
            onPress={setSelectedEnvironment}
          />
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            !selectedEnvironment && styles.startButtonDisabled,
          ]}
          onPress={handleStartScanning}
          disabled={!selectedEnvironment}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            {selectedEnvironment ? '▶  Start Scanning' : 'Select an environment first'}
          </Text>
        </TouchableOpacity>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Powered by YOLOv8 · Real-time object detection
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  logoIcon: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  logoText: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.surfaceAlt,
  },
  startButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.background,
  },
  footerNote: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xl,
  },
});
