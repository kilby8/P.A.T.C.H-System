// ============================================================
// P.A.T.C.H. SYSTEM — Vital Bar sub-component
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, DimensionValue } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface VitalBarProps {
  label: string;
  current: number;
  max: number;
  /** Hex color for the filled portion of the bar */
  fillColor: string;
  /** Hex color used for the glow shadow */
  glowColor: string;
}

export default function VitalBar({ label, current, max, fillColor, glowColor }: VitalBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
  const pct: DimensionValue = `${Math.round(ratio * 100)}%`;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: fillColor }]}>{label}</Text>
        <Text style={styles.value}>
          {current} / {max}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: pct,
              backgroundColor: fillColor,
              shadowColor: glowColor,
              shadowOpacity: 0.8,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.subheading,
    fontSize: 11,
  },
  value: {
    ...Typography.mono,
    color: Colors.textSecondary,
  },
  track: {
    height: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
