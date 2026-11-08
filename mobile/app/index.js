/**
 * ClassPulse AI — Home Screen (app/index.js)
 *
 * Shows environment selection and Start Scanning button.
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
import { ArrowRight, ScanLine } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../src/constants/theme';
import EnvironmentCard from '../src/components/EnvironmentCard';

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
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <ScanLine color={COLORS.primary} size={22} strokeWidth={1.8} />
            </View>
            <Text style={styles.logoText}>ClassPulse AI</Text>
          </View>
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
          <Text style={[
            styles.startButtonText,
            !selectedEnvironment && styles.startButtonTextDisabled,
          ]}>
            {selectedEnvironment ? 'Start Scanning' : 'Select an environment first'}
          </Text>
          {selectedEnvironment && <ArrowRight color={COLORS.background} size={18} strokeWidth={2.2} />}
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
    alignItems: 'flex-start',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl + 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: 'rgba(8,126,154,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagline: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
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
    borderRadius: RADIUS.md,
    minHeight: 54,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  startButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.background,
  },
  startButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  footerNote: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.lg,
  },
});
