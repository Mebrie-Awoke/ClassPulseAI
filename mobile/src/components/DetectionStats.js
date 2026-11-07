/**
 * ClassPulse AI — DetectionStats Component.
 *
 * Renders detected object counts, activity indicator, approximate disclaimer,
 * and a clear freshness/stale warning badge.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import {
  activityColor,
  activityLabel,
  buildDetectionSummary,
  formatFreshness,
} from '../utils/formatDetection';

export default function DetectionStats({
  result,
  isAnalyzing,
  isStale = false,
  lastUpdatedTimestamp = null,
}) {
  if (!result && !isAnalyzing) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Waiting for initial environment scan…</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Analyzing camera view…</Text>
      </View>
    );
  }

  const summary = buildDetectionSummary(result);
  const color = activityColor(result.activity_level);
  const label = activityLabel(result.activity_level);
  const freshnessText = formatFreshness(lastUpdatedTimestamp);

  return (
    <View style={[styles.container, isStale && styles.containerStale]}>
      {/* Top Meta Row: Activity Badge & Freshness Indicator */}
      <View style={styles.metaRow}>
        <View style={[styles.activityBadge, { borderColor: color }]}>
          <View style={[styles.activityDot, { backgroundColor: color }]} />
          <Text style={[styles.activityText, { color }]}>{label}</Text>
        </View>

        <View style={[styles.freshnessBadge, isStale && styles.freshnessBadgeStale]}>
          <Text style={[styles.freshnessText, isStale && styles.freshnessTextStale]}>
            {isStale ? `⚠ ${freshnessText}` : `● ${freshnessText}`}
          </Text>
        </View>
      </View>

      {/* Object Counts Grid */}
      {summary.length > 0 ? (
        <View style={styles.countRow}>
          {summary.map(item => (
            <View key={item.label} style={styles.countItem}>
              <Text style={styles.countIcon}>{item.icon}</Text>
              <Text style={styles.countNumber}>{item.count}</Text>
              <Text style={styles.countLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.nothingText}>No target objects currently visible in camera frame</Text>
      )}

      {/* Approximation Notice */}
      <Text style={styles.disclaimer}>
        * Counts are approximate estimates based on the visible field of view.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(13, 27, 42, 0.92)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  containerStale: {
    borderColor: 'rgba(255, 179, 71, 0.4)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
  },
  activityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: SPACING.xs,
  },
  activityText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  freshnessBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  freshnessBadgeStale: {
    backgroundColor: 'rgba(255, 179, 71, 0.15)',
  },
  freshnessText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  freshnessTextStale: {
    color: COLORS.warning,
    fontWeight: '700',
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  countItem: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    minWidth: 58,
  },
  countIcon: {
    fontSize: 16,
  },
  countNumber: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 24,
  },
  countLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  waitingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  nothingText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  disclaimer: {
    fontSize: FONTS.sizes.xs - 1,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
