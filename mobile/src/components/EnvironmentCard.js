/**
 * RoomPulse — EnvironmentCard component
 *
 * Displays a selectable card for one environment (Classroom or Library).
 * Shows an icon, name, description, and selected visual state.
 */
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { BookOpen, Building2, Check } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const ENVIRONMENTS = {
  classroom: {
    icon: Building2,
    name: 'Classroom',
    description: 'Detect people, chairs, laptops & more',
  },
  library: {
    icon: BookOpen,
    name: 'Library',
    description: 'Detect readers, books, laptops & more',
  },
};

export default function EnvironmentCard({ id, selected, onPress }) {
  const env = ENVIRONMENTS[id];
  if (!env) return null;
  const EnvironmentIcon = env.icon;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onPress(id)}
      activeOpacity={0.75}
    >
      {/* Selection indicator bar */}
      {selected && <View style={styles.selectedBar} />}

      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <EnvironmentIcon color={selected ? COLORS.primary : COLORS.textSecondary} size={21} strokeWidth={1.8} />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.name, selected && styles.nameSelected]}>
          {env.name}
        </Text>
        <Text style={styles.description}>{env.description}</Text>
      </View>

      {/* Checkmark */}
      {selected && (
        <View style={styles.checkmark}>
          <Check color={COLORS.background} size={14} strokeWidth={2.5} />
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
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: 'rgba(8,126,154,0.55)',
    backgroundColor: '#EAF6F8',
  },
  selectedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconWrapSelected: {
    backgroundColor: 'rgba(8,126,154,0.08)',
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
    lineHeight: 18,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
