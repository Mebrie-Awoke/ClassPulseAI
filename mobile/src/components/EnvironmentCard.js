/**
 * ClassPulse AI — EnvironmentCard component
 *
 * Displays a selectable card for one environment (Classroom or Library).
 * Shows an icon, name, description, and selected visual state.
 */
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const ENVIRONMENTS = {
  classroom: {
    icon: '🏫',
    name: 'Classroom',
    description: 'Detect people, chairs, laptops & more',
  },
  library: {
    icon: '📖',
    name: 'Library',
    description: 'Detect readers, books, laptops & more',
  },
};

export default function EnvironmentCard({ id, selected, onPress }) {
  const env = ENVIRONMENTS[id];
  if (!env) return null;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onPress(id)}
      activeOpacity={0.75}
    >
      {/* Selection indicator bar */}
      {selected && <View style={styles.selectedBar} />}

      <Text style={styles.icon}>{env.icon}</Text>

      <View style={styles.textContainer}>
        <Text style={[styles.name, selected && styles.nameSelected]}>
          {env.name}
        </Text>
        <Text style={styles.description}>{env.description}</Text>
      </View>

      {/* Checkmark */}
      {selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceAlt,
  },
  selectedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },
  icon: {
    fontSize: 36,
    marginLeft: SPACING.xs,
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  nameSelected: {
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});
