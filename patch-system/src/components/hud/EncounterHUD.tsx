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
} from 'react-native';
import { useCharacter } from '../../store/CharacterContext';
import { CpuAttributes, getModifier, getStartingAP } from '../../models/Character';
import {
  CATEGORY_LABELS,
  GEAR_CATEGORIES,
  GearCategory,
  getBlueprintById,
  getGearItemById,
} from '../../models/Gear';
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

type DerivedAttack = {
  id: string;
  title: string;
  category: GearCategory;
  apCost: number;
  attackRoll: string;
  damageRoll: string;
  detail: string;
  schematicLines: string[];
};

function getThemeApCost(theme: 'foundation' | 'tactical' | 'apex'): number {
  if (theme === 'apex') return 3;
  if (theme === 'tactical') return 2;
  return 1;
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getWeaponRollProfile(itemId: string, attributes: CpuAttributes): { attackRoll: string; damageRoll: string } {
  const powerMod = formatModifier(getModifier(attributes.POWER));
  const pingMod = formatModifier(getModifier(attributes.PING));
  const hardwareMod = formatModifier(getModifier(attributes.HARDWARE));
  const dataMod = formatModifier(getModifier(attributes.DATA));

  if (itemId === 'i-recurve-bow') {
    return { attackRoll: `1d20 ${pingMod}`, damageRoll: `1d8 ${pingMod} KINETIC` };
  }
  if (itemId === 'i-tactical-carbine') {
    return { attackRoll: `1d20 ${pingMod}`, damageRoll: `2d6 ${pingMod} KINETIC` };
  }
  if (itemId === 'i-hard-light-lance') {
    return { attackRoll: `1d20 ${hardwareMod}`, damageRoll: `2d8 ${hardwareMod} ENERGY` };
  }
  if (itemId === 'i-iron-spear') {
    return { attackRoll: `1d20 ${powerMod}`, damageRoll: `1d10 ${powerMod} PIERCING` };
  }
  if (itemId === 'i-weighted-club') {
    return { attackRoll: `1d20 ${powerMod}`, damageRoll: `1d8 ${powerMod} BLUNT` };
  }
  if (itemId === 'i-multi-tool') {
    return { attackRoll: `1d20 ${dataMod}`, damageRoll: `1d4 ${dataMod} UTILITY` };
  }
  if (itemId === 'i-field-radio') {
    return { attackRoll: `1d20 ${dataMod}`, damageRoll: `1d4 ${dataMod} SIGNAL` };
  }
  if (itemId === 'i-signal-jammer') {
    return { attackRoll: `1d20 ${dataMod}`, damageRoll: `1d6 ${dataMod} DISRUPTION` };
  }
  if (itemId === 'i-thick-hide-tunic') {
    return { attackRoll: `1d20 ${hardwareMod}`, damageRoll: `1d4 ${hardwareMod} COUNTER` };
  }
  if (itemId === 'i-kevlar-vest') {
    return { attackRoll: `1d20 ${hardwareMod}`, damageRoll: `1d6 ${hardwareMod} COUNTER` };
  }
  if (itemId === 'i-kinetic-shielding') {
    return { attackRoll: `1d20 ${hardwareMod}`, damageRoll: `1d8 ${hardwareMod} COUNTER` };
  }

  return { attackRoll: `1d20 ${powerMod}`, damageRoll: `1d6 ${powerMod}` };
}

function getOffensiveProfile(itemId: string, fallback: string): { title: string; detail: string } {
  if (itemId === 'i-recurve-bow') {
    return {
      title: 'KINETIC VOLLEY',
      detail: 'MID-RANGE SHOT PATTERN WITH REPOSITION WINDOWS BETWEEN BURSTS.',
    };
  }
  if (itemId === 'i-tactical-carbine') {
    return {
      title: 'BURST SUPPRESSION',
      detail: 'CONTROLLED FIRE TO PIN TARGETS AND CREATE TEAM ANGLES.',
    };
  }
  if (itemId === 'i-hard-light-lance') {
    return {
      title: 'PHASE LANCE THRUST',
      detail: 'HIGH-IMPACT ENERGY STRIKE THAT PRESSES THROUGH STANDARD COVER.',
    };
  }
  if (itemId === 'i-iron-spear') {
    return {
      title: 'PIERCING DRIVE',
      detail: 'REACH-ADVANTAGE THRUST FOR ZONE CONTROL AND OPENING DAMAGE.',
    };
  }

  return {
    title: 'BRUTE STRIKE',
    detail: `DIRECT OFFENSIVE PRESSURE USING ${fallback.toUpperCase()}.`,
  };
}

function buildAttacksFromGear(
  loadout: ReturnType<typeof useCharacter>['character']['gearLoadout'],
  attributes: CpuAttributes,
): DerivedAttack[] {
  const attacks: DerivedAttack[] = [];

  GEAR_CATEGORIES.forEach((category) => {
    const equipped = loadout[category];
    if (!equipped) return;

    const item = getGearItemById(equipped.itemId);
    if (!item) return;

    const schematicLines = equipped.hardpoints
      .map((blueprintId) => (blueprintId ? getBlueprintById(blueprintId) : undefined))
      .filter((blueprint): blueprint is NonNullable<typeof blueprint> => Boolean(blueprint))
      .map((blueprint) => `${blueprint.name.toUpperCase()}: ${blueprint.effect.toUpperCase()}`);
    const rollProfile = getWeaponRollProfile(item.id, attributes);

    if (category === 'offensive') {
      const profile = getOffensiveProfile(item.id, item.name);
      attacks.push({
        id: `${category}-${item.id}`,
        title: profile.title,
        category,
        apCost: getThemeApCost(item.theme),
        attackRoll: rollProfile.attackRoll,
        damageRoll: rollProfile.damageRoll,
        detail: profile.detail,
        schematicLines,
      });
      return;
    }

    if (category === 'support') {
      attacks.push({
        id: `${category}-${item.id}`,
        title: 'UTILITY EXECUTE',
        category,
        apCost: Math.max(1, getThemeApCost(item.theme) - 1),
        attackRoll: rollProfile.attackRoll,
        damageRoll: rollProfile.damageRoll,
        detail: `${item.functionality.toUpperCase()} USED TO ENABLE TEAM POSITIONING OR CONTROL.`,
        schematicLines,
      });
      return;
    }

    attacks.push({
      id: `${category}-${item.id}`,
      title: 'GUARD REACTION',
      category,
      apCost: 1,
      attackRoll: rollProfile.attackRoll,
      damageRoll: rollProfile.damageRoll,
      detail: `${item.functionality.toUpperCase()} USED FOR MITIGATION AND COUNTER WINDOWS.`,
      schematicLines,
    });
  });

  return attacks;
}

export default function EncounterHUD() {
  const {
    character,
    session,
    spendAP,
    restoreAP,
    applyDamageOvershield,
    applyDamageHardware,
    healHardware,
    restoreOvershield,
  } = useCharacter();

  const maxAP = getStartingAP(character);
  const derivedAttacks = buildAttacksFromGear(character.gearLoadout, character.attributes);
  const sponsorStatus = character.engagement >= 80
    ? 'PLATINUM SPONSOR WINDOW'
    : character.engagement >= 60
      ? 'PRIORITY SPONSOR WINDOW'
      : character.engagement >= 35
        ? 'TRENDING FEED'
        : 'LOW VISIBILITY FEED';

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
    <View style={GlobalStyles.safeArea}>
      <ScrollView
        style={GlobalStyles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.operatorLabel}>OPERATOR</Text>
          <Text style={styles.operatorName}>{character.name.toUpperCase()}</Text>
          <View style={styles.broadcastCard}>
            <View style={styles.broadcastRow}>
              <View>
                <Text style={styles.broadcastLabel}>VIEWERS</Text>
                <Text style={styles.broadcastValue}>{character.viewerCount.toLocaleString()}</Text>
              </View>
              <View style={styles.broadcastDivider} />
              <View style={styles.engagementWrap}>
                <Text style={styles.broadcastLabel}>ENGAGEMENT</Text>
                <Text style={styles.broadcastValue}>{character.engagement}%</Text>
                <View style={styles.engagementTrack}>
                  <View style={[styles.engagementFill, { width: `${character.engagement}%` }]} />
                </View>
                <Text style={styles.broadcastStatus}>{sponsorStatus}</Text>
              </View>
            </View>
          </View>
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

        <View style={CardStyles.base}>
          <Text style={styles.sectionTitle}>LIVE LOADOUT EFFECTS</Text>
          {GEAR_CATEGORIES.flatMap((category) => {
            const equipped = character.gearLoadout[category];
            if (!equipped) return [];

            return equipped.hardpoints
              .map((blueprintId) => (blueprintId ? getBlueprintById(blueprintId) : undefined))
              .filter((blueprint) => blueprint?.sponsorGrade)
              .map((blueprint) => (
                <View key={`${category}-${blueprint?.id}`} style={styles.effectRow}>
                  <Text style={styles.effectName}>
                    {CATEGORY_LABELS[category]} :: {blueprint?.name.toUpperCase()}
                  </Text>
                  <Text style={styles.effectText}>
                    {(blueprint?.streamTrait ?? blueprint?.effect ?? '').toUpperCase()}
                  </Text>
                </View>
              ));
          })}
          {GEAR_CATEGORIES.every((category) => {
            const equipped = character.gearLoadout[category];
            return !equipped || equipped.hardpoints.every((blueprintId) => !getBlueprintById(blueprintId ?? '')?.sponsorGrade);
          }) && (
            <Text style={styles.broadcastStatus}>NO SPONSOR-GRADE EFFECTS INSTALLED.</Text>
          )}
        </View>

        <View style={GlobalStyles.divider} />

        <View style={CardStyles.glow}>
          <Text style={styles.sectionTitle}>ATTACKS // GEAR-LINKED</Text>
          {derivedAttacks.map((attack) => (
            <View key={attack.id} style={styles.attackRow}>
              <View style={styles.attackHeader}>
                <Text style={styles.attackTitle}>{attack.title}</Text>
                <Text style={styles.attackMeta}>{CATEGORY_LABELS[attack.category]} · AP {attack.apCost}</Text>
              </View>
              <Text style={styles.attackRollLine}>ATTACK ROLL: {attack.attackRoll}</Text>
              <Text style={styles.attackRollLine}>DAMAGE ROLL: {attack.damageRoll}</Text>
              <Text style={styles.attackDetail}>{attack.detail}</Text>
              {attack.schematicLines.map((line) => (
                <Text key={`${attack.id}-${line}`} style={styles.attackSchematic}>{line}</Text>
              ))}
              {attack.schematicLines.length === 0 && (
                <Text style={styles.attackSchematic}>NO INSTALLED SCHEMATICS ON THIS SLOT.</Text>
              )}
            </View>
          ))}
          {derivedAttacks.length === 0 && (
            <Text style={styles.broadcastStatus}>NO EQUIPPED GEAR. ASSIGN LOADOUT IN GEAR TERMINAL.</Text>
          )}
        </View>

        {/* ── Quick Damage Inputs ────────────────────────── */}
        {session.role === 'gm' ? (
          <View style={CardStyles.base}>
            <Text style={styles.sectionTitle}>QUICK DAMAGE (GM)</Text>
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
        ) : (
          <View style={CardStyles.base}>
            <Text style={styles.sectionTitle}>DAMAGE AUTHORITY</Text>
            <Text style={styles.broadcastStatus}>PLAYER/ENEMY DAMAGE IS GM-CONTROLLED FROM THE GM CONSOLE.</Text>
          </View>
        )}

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
    </View>
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
  broadcastCard: {
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgDeep,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  broadcastLabel: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
    marginBottom: 4,
  },
  broadcastValue: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  broadcastDivider: {
    width: 1,
    backgroundColor: Colors.borderDefault,
    marginHorizontal: Spacing.md,
  },
  engagementWrap: {
    flex: 1,
  },
  engagementTrack: {
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    marginTop: Spacing.xs,
  },
  engagementFill: {
    height: '100%',
    backgroundColor: Colors.amber,
    borderRadius: Radius.pill,
  },
  broadcastStatus: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  effectRow: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgDeep,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  effectName: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
    marginBottom: 4,
  },
  effectText: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 10,
    lineHeight: 16,
  },
  attackRow: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  attackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  attackTitle: {
    ...Typography.subheading,
    color: Colors.cyan,
    fontSize: 12,
  },
  attackMeta: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
  },
  attackRollLine: {
    ...Typography.mono,
    color: Colors.green,
    fontSize: 10,
    lineHeight: 15,
  },
  attackDetail: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 10,
    lineHeight: 16,
    marginBottom: 4,
  },
  attackSchematic: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
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
