// ============================================================
// P.A.T.C.H. SYSTEM — Encounter HUD Screen Component
// ============================================================
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useCharacter } from '../../store/CharacterContext';
import { getStartingAP } from '../../models/Character';
import VitalBar from './VitalBar';
import APCounter from './APCounter';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  CardStyles,
  GlobalStyles,
  Shadows,
} from '../../theme/theme';

export default function EncounterHUD() {
  const {
    character,
    spendAP,
    restoreAP,
    applyDamageOvershield,
    applyDamageHardware,
    healHardware,
    restoreOvershield,
  } = useCharacter();

  const maxAP = getStartingAP(character);

  // ── Neural Shock pulse animation ─────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (character.neuralShock) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [character.neuralShock, pulseAnim]);

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <ScrollView
        style={GlobalStyles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.operatorLabel}>OPERATOR</Text>
          <Text style={styles.operatorName}>{character.name.toUpperCase()}</Text>
          <View style={GlobalStyles.dividerGlow} />
        </View>

        {/* ── Neural Shock Banner ────────────────────────── */}
        {character.neuralShock && (
          <Animated.View style={[CardStyles.shock, styles.shockBanner, { opacity: pulseAnim }]}>
            <Text style={styles.shockTitle}>⚠ NEURAL SHOCK DETECTED</Text>
            <Text style={styles.shockSubtitle}>SYSTEM THROTTLED  —  -1 AP PER TURN</Text>
          </Animated.View>
        )}

        {/* ── AP Counter ────────────────────────────────── */}
        <View style={CardStyles.glow}>
          <APCounter
            current={character.currentAP}
            max={maxAP}
            neuralShock={character.neuralShock}
          />
          <View style={styles.apButtonRow}>
            <ActionButton
              label="SPEND  1 AP"
              onPress={() => spendAP(1)}
              disabled={character.currentAP <= 0}
              color={Colors.cyan}
            />
            <ActionButton
              label="TRIGGER REACTION"
              subtitle="DODGE / FIREWALL  (2 AP)"
              onPress={() => spendAP(2)}
              disabled={character.currentAP < 2}
              color={Colors.amber}
            />
          </View>
          <TouchableOpacity style={styles.restoreBtn} onPress={restoreAP}>
            <Text style={styles.restoreBtnText}>↺  NEW TURN — RESTORE AP</Text>
          </TouchableOpacity>
        </View>

        <View style={GlobalStyles.divider} />

        {/* ── Vitals ────────────────────────────────────── */}
        <View style={character.neuralShock ? CardStyles.danger : CardStyles.base}>
          <Text style={styles.sectionTitle}>VITALS</Text>
          <VitalBar
            label="OVERSHIELD — Digital Defence"
            current={character.overshield.current}
            max={character.overshield.max}
            fillColor={Colors.cyan}
            glowColor={Colors.cyan}
          />
          <VitalBar
            label="HARDWARE INTEGRITY — Biological Trauma"
            current={character.hardwareIntegrity.current}
            max={character.hardwareIntegrity.max}
            fillColor={
              character.neuralShock ? Colors.crimson : Colors.green
            }
            glowColor={
              character.neuralShock ? Colors.crimson : Colors.green
            }
          />
          <View style={styles.repairRow}>
            <ActionButton
              label="+ REPAIR OVERSHIELD"
              subtitle="Restore 3 Overshield"
              onPress={() => restoreOvershield(3)}
              disabled={character.overshield.current >= character.overshield.max}
              color={Colors.cyan}
            />
            <ActionButton
              label="+ INJECT MEAT-SPACE MED STIM"
              subtitle="Heal 3 Hardware Integrity"
              onPress={() => healHardware(3)}
              disabled={character.hardwareIntegrity.current >= character.hardwareIntegrity.max}
              color={Colors.green}
            />
          </View>
        </View>

        <View style={GlobalStyles.divider} />

        {/* ── Quick Damage Inputs ────────────────────────── */}
        <View style={CardStyles.base}>
          <Text style={styles.sectionTitle}>QUICK DAMAGE</Text>
          <View style={styles.damageRow}>
            <DamageButton
              label="-1 OS"
              onPress={() => applyDamageOvershield(1)}
              color={Colors.cyan}
            />
            <DamageButton
              label="-3 OS"
              onPress={() => applyDamageOvershield(3)}
              color={Colors.cyanDim}
            />
            <DamageButton
              label="-1 HW"
              onPress={() => applyDamageHardware(1)}
              color={Colors.crimson}
            />
            <DamageButton
              label="-3 HW"
              onPress={() => applyDamageHardware(3)}
              color={Colors.crimsonDim}
            />
          </View>
        </View>

        {/* ── CPU Attribute Summary ─────────────────────── */}
        <View style={[CardStyles.base, { marginTop: Spacing.md }]}>
          <Text style={styles.sectionTitle}>CPU ATTRIBUTES</Text>
          <View style={styles.attrGrid}>
            {(Object.entries(character.attributes) as [string, number][]).map(([key, val]) => (
              <View key={key} style={styles.attrCell}>
                <Text style={styles.attrKey}>{key}</Text>
                <Text style={styles.attrVal}>{val}</Text>
                <Text style={styles.attrMod}>
                  {val >= 10 ? '+' : ''}{Math.floor((val - 10) / 2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────
function ActionButton({
  label,
  subtitle,
  onPress,
  disabled,
  color,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
  disabled: boolean;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color, opacity: disabled ? 0.35 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
      {subtitle && <Text style={[styles.actionBtnSub, { color }]}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}

function DamageButton({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      style={[styles.damageBtn, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.damageBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  operatorLabel: {
    ...Typography.mono,
    color: Colors.textMuted,
  },
  operatorName: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  shockBanner: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  shockTitle: {
    ...Typography.heading,
    color: Colors.shock,
    ...Shadows.shockGlow,
  },
  shockSubtitle: {
    ...Typography.mono,
    color: Colors.shock,
    marginTop: Spacing.xs,
    opacity: 0.85,
  },
  sectionTitle: {
    ...Typography.subheading,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  apButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
  },
  actionBtnText: {
    ...Typography.subheading,
    fontSize: 11,
  },
  actionBtnSub: {
    ...Typography.mono,
    fontSize: 9,
    marginTop: 2,
    opacity: 0.7,
  },
  restoreBtn: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    ...Shadows.greenGlow,
  },
  restoreBtnText: {
    ...Typography.subheading,
    color: Colors.green,
    fontSize: 11,
  },
  damageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  repairRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  damageBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
  },
  damageBtnText: {
    ...Typography.mono,
    fontWeight: '700',
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  attrCell: {
    width: '30%',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  attrKey: {
    ...Typography.mono,
    color: Colors.cyan,
    fontSize: 10,
    marginBottom: 2,
  },
  attrVal: {
    ...Typography.statSmall,
    color: Colors.textPrimary,
  },
  attrMod: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 11,
  },
});
