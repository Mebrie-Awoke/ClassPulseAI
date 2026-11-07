/**
 * ClassPulse AI — CommentaryCard component
 *
 * Shows the AI-generated commentary from the backend.
 * Animates subtly when new commentary arrives.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

export default function CommentaryCard({ commentary, isAnalyzing }) {
  const opacity = useRef(new Animated.Value(1)).current;

  // Fade out/in when commentary changes
  useEffect(() => {
    if (!commentary) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.3, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [commentary]);

  const displayText = commentary || (isAnalyzing ? 'Analyzing scene…' : 'Start scanning to get AI commentary.');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.aiLabel}>🤖 AI Commentary</Text>
        {isAnalyzing && <Text style={styles.scanningDot}>●</Text>}
      </View>
      <Animated.Text style={[styles.commentary, { opacity }]}>
        "{displayText}"
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  aiLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scanningDot: {
    color: COLORS.live,
    fontSize: 10,
  },
  commentary: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
