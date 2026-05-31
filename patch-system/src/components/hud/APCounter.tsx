// ============================================================
// P.A.T.C.H. SYSTEM — AP Counter sub-component
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface APCounterProps {
  current: number;
  max: number;
  neuralShock: boolean;
}

export default function APCounter({ current, max, neuralShock }: APCounterProps) {
  const pips = Array.from({ length: max }, (_, i) => i < current);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, neuralShock && styles.labelShock]}>
        ACTIVE PROCESSING POOL
      </Text>
      <View style={styles.pipRow}>
        {pips.map((active, i) => (
          <View
            key={i}
            style={[
              styles.pip,
              active
                ? neuralShock
                  ? styles.pipShock
                  : styles.pipActive
                : styles.pipEmpty,
            ]}
          />
        ))}
        {/* If current > max display overflow as + text */}
        {current > max && (
          <Text style={styles.overflow}>+{current - max}</Text>
        )}
      </View>
      <Text style={[styles.apValue, neuralShock && styles.labelShock]}>
        {current} AP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  label: {
    ...Typography.subheading,
    color: Colors.cyan,
    marginBottom: Spacing.sm,
  },
  labelShock: {
    color: Colors.shock,
  },
  pipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  pip: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  pipActive: {
    backgroundColor: Colors.cyan,
    borderColor: Colors.cyan,
    shadowColor: Colors.cyan,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  pipShock: {
    backgroundColor: Colors.shock,
    borderColor: Colors.shock,
    shadowColor: Colors.shock,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  pipEmpty: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.borderDefault,
  },
  apValue: {
    ...Typography.stat,
    color: Colors.cyan,
  },
  overflow: {
    ...Typography.subheading,
    color: Colors.amber,
    alignSelf: 'center',
    marginLeft: Spacing.xs,
  },
});
