/**
 * ClassPulse AI — Results Screen
 *
 * Shows a concise summary of the last scan session.
 * Received via router params (not persisted to any database).
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import {
  activityColor,
  activityLabel,
  buildDetectionSummary,
  environmentIcon,
  formatProcessingTime,
} from '../utils/formatDetection';

export default function ResultScreen() {
  const router = useRouter();
  const { environment, result: resultJson } = useLocalSearchParams();

  const result = useMemo(() => {
    if (!resultJson) return null;
    try {
      return JSON.parse(resultJson);
    } catch {
      return null;
    }
  }, [resultJson]);

  const handleScanAgain = () => {
    router.replace('/');
  };

  const envName = environment === 'library' ? 'Library' : 'Classroom';
  const envIcon = environmentIcon(environment);

  if (!result) {
    // No result data — scan ended without any detections
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.noResultIcon}>🤷</Text>
          <Text style={styles.noResultTitle}>No Results Yet</Text>
          <Text style={styles.noResultBody}>
            The scan ended before any detections were processed.
          </Text>
          <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain}>
            <Text style={styles.scanAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const summary = buildDetectionSummary(result);
  const color = activityColor(result.activity_level);
  const label = activityLabel(result.activity_level);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📊</Text>
          <Text style={styles.headerTitle}>Scan Results</Text>
          <Text style={styles.headerSubtitle}>Session complete</Text>
        </View>

        {/* Environment badge */}
        <View style={styles.envBadge}>
          <Text style={styles.envBadgeIcon}>{envIcon}</Text>
          <Text style={styles.envBadgeText}>{envName}</Text>
        </View>

        {/* Activity level */}
        <View style={[styles.activityCard, { borderColor: color }]}>
          <Text style={styles.activityCardLabel}>Overall Activity</Text>
          <Text style={[styles.activityCardValue, { color }]}>{label}</Text>
        </View>

        {/* Detection counts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Objects</Text>
          {summary.length > 0 ? (
            <View style={styles.countsGrid}>
              {summary.map(item => (
                <View key={item.label} style={styles.countCard}>
                  <Text style={styles.countCardIcon}>{item.icon}</Text>
                  <Text style={styles.countCardNumber}>{item.count}</Text>
                  <Text style={styles.countCardLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDetections}>
              No tracked objects were detected during this session.
            </Text>
          )}
        </View>

        {/* AI Commentary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Commentary</Text>
          <View style={styles.commentaryBox}>
            <Text style={styles.commentaryText}>"{result.commentary}"</Text>
          </View>
        </View>

        {/* Approximate disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠ All counts and activity levels are approximate estimates based on
            what was visible in the camera frame at the time of detection.
            Results depend on lighting, angle, and model confidence.
          </Text>
        </View>

        {/* Processing info */}
        {result.processing_time_ms && (
          <Text style={styles.processingInfo}>
            Last detection took {formatProcessingTime(result.processing_time_ms)}
          </Text>
        )}

        {/* Scan again */}
        <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain}>
          <Text style={styles.scanAgainText}>🔁  Scan Another Environment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  headerIcon: {
    fontSize: 44,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  // Environment badge
  envBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  envBadgeIcon: {
    fontSize: 20,
  },
  envBadgeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  // Activity card
  activityCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
  },
  activityCardLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  activityCardValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
  },
  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  countCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
  },
  countCardIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  countCardNumber: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 32,
  },
  countCardLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  noDetections: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
    fontSize: FONTS.sizes.sm,
  },
  // Commentary
  commentaryBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  commentaryText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  // Disclaimer
  disclaimer: {
    backgroundColor: 'rgba(255,179,71,0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    marginBottom: SPACING.lg,
  },
  disclaimerText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  processingInfo: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.lg,
  },
  // Scan again button
  scanAgainButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  scanAgainText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: FONTS.sizes.lg,
  },
  // No result
  noResultIcon: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  noResultTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  noResultBody: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
});
