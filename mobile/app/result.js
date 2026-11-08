/**
 * ClassPulse AI — Results Screen (app/result.js)
 *
 * Displays a summary of the last scan.
 * Result data passed via router params (not persisted anywhere).
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
import { Armchair, BarChart3, BookOpen, Building2, Info, Laptop, Monitor, RefreshCw, ScanLine, Users } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../src/constants/theme';
import {
  activityColor,
  activityLabel,
  buildDetectionSummary,
  formatProcessingTime,
} from '../src/utils/formatDetection';

export default function ResultScreen() {
  const router = useRouter();
  const { environment, result: resultJson } = useLocalSearchParams();

  const result = useMemo(() => {
    if (!resultJson || resultJson === 'null') return null;
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
  const EnvironmentIcon = environment === 'library' ? BookOpen : Building2;

  // --- No result ---
  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.noResultIcon}>
            <ScanLine color={COLORS.primary} size={26} strokeWidth={1.8} />
          </View>
          <Text style={styles.noResultTitle}>No Results Yet</Text>
          <Text style={styles.noResultBody}>
            The scan ended before any detections were processed. Try scanning for a bit longer.
          </Text>
          <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain}>
            <RefreshCw color={COLORS.background} size={17} />
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
          <View style={styles.headerIcon}>
            <BarChart3 color={COLORS.primary} size={21} strokeWidth={1.8} />
          </View>
          <Text style={styles.headerTitle}>Scan Results</Text>
          <Text style={styles.headerSub}>Session complete</Text>
        </View>

        {/* Environment */}
        <View style={styles.envBadge}>
          <EnvironmentIcon color={COLORS.primary} size={17} strokeWidth={1.8} />
          <Text style={styles.envBadgeText}>{envName}</Text>
        </View>

        {/* Activity level */}
        <View style={[styles.activityCard, { borderLeftColor: color }]}>
          <Text style={styles.activityLabel}>Overall Activity</Text>
          <Text style={[styles.activityValue, { color }]}>{label}</Text>
        </View>

        {/* Detection counts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Objects</Text>
          {summary.length > 0 ? (
            <View style={styles.countsGrid}>
              {summary.map(item => (
                <View key={item.label} style={styles.countCard}>
                  {React.createElement(({ People: Users, Chairs: Armchair, Books: BookOpen, Laptops: Laptop, Screens: Monitor })[item.label] || Monitor, { color: COLORS.textSecondary, size: 17, strokeWidth: 1.8 })}
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
          <Text style={styles.sectionTitle}>AI Commentary</Text>
          <View style={styles.commentaryBox}>
            <Text style={styles.commentaryText}>{result.commentary}</Text>
          </View>
        </View>

        {/* Approximate disclaimer */}
        <View style={styles.disclaimer}>
          <Info color={COLORS.textSecondary} size={15} strokeWidth={1.8} />
          <Text style={styles.disclaimerText}>
            All counts and activity levels are approximate estimates based on what was
            visible in the camera frame. Results vary with lighting, angle, and model confidence.
          </Text>
        </View>

        {/* Processing info */}
        {result.processing_time_ms ? (
          <Text style={styles.procInfo}>
            Last detection: {formatProcessingTime(result.processing_time_ms)}
          </Text>
        ) : null}

        {/* Scan Again */}
        <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain}>
          <RefreshCw color={COLORS.background} size={17} />
          <Text style={styles.scanAgainText}>Scan Another Environment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },

  // Header
  header: { alignItems: 'flex-start', paddingVertical: SPACING.md },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: 'rgba(84,199,233,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },

  // Env badge
  envBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  envBadgeText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },

  // Activity card
  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 3,
  },
  activityLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.xs,
  },
  activityValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },

  // Sections
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  countsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  countCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 0,
    flexBasis: '47%',
    flex: 1,
  },
  countCardNumber: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 32, marginTop: SPACING.xs },
  countCardLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  noDetections: { color: COLORS.textMuted, fontStyle: 'italic', fontSize: FONTS.sizes.sm },

  // Commentary
  commentaryBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  commentaryText: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, lineHeight: 24 },

  // Disclaimer
  disclaimer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  disclaimerText: { flex: 1, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, lineHeight: 18 },
  procInfo: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.lg },

  // Scan again
  scanAgainButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    minHeight: 54,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  scanAgainText: { color: COLORS.background, fontWeight: '700', fontSize: FONTS.sizes.md, textAlign: 'center', flexShrink: 1 },

  // No result
  noResultIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  noResultTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  noResultBody: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
});
