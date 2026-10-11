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
import {
  Character,
  CpuAttributes,
  getAttributeBonus,
  getStartingAP,
  getMaxBankedAP,
  getDefense,
  isFlatlined,
} from '../../models/Character';
import {
  CATEGORY_LABELS,
  GEAR_CATEGORIES,
  GearCategory,
  getBlueprintById,
  getGearItemById,
  getGearRules,
} from '../../models/Gear';
import { SKILL_DEFS, getSkillById, getSkillRank } from '../../models/Skills';
import { CONDITION_DEFS } from '../../models/Conditions';
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

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/** Attacks the rulebook allows with the equipped gear: pool = attribute + skill, 1 AP each. */
function buildAttacksFromGear(character: Character): DerivedAttack[] {
  const attacks: DerivedAttack[] = [];
  const { attributes, skills, gearLoadout } = character;

  GEAR_CATEGORIES.forEach((category) => {
    const equipped = gearLoadout[category];
    if (!equipped) return;
    const item = getGearItemById(equipped.itemId);
    if (!item) return;

    const rules = getGearRules(item.id);
    const skill = getSkillById(rules.skill);
    const rank = getSkillRank(skills, rules.skill);
    const pool = attributes[rules.attribute] + rank;
    const bonus = formatModifier(getAttributeBonus(attributes[rules.attribute]));
    const schematicLines = equipped.hardpoints
      .map((blueprintId) => (blueprintId ? getBlueprintById(blueprintId) : undefined))
      .filter((blueprint): blueprint is NonNullable<typeof blueprint> => Boolean(blueprint))
      .map((blueprint) => `${blueprint.name.toUpperCase()}: ${blueprint.rules.toUpperCase()}`);

    if (category === 'defensive') {
      const hdwBonus = formatModifier(getAttributeBonus(attributes.HARDWARE));
      attacks.push({
        id: `${category}-${item.id}`,
        title: `${item.name.toUpperCase()} · COUNTER`,
        category,
        apCost: 1,
        attackRoll: `REACTION WHEN A MELEE ATTACK MISSES YOU · NO ROLL · +${rules.defenseBonus ?? 0} DEFENSE`,
        damageRoll: `${rules.counter ?? rules.damage} ${hdwBonus} COUNTER`,
        detail: rules.feature.toUpperCase(),
        schematicLines,
      });
      return;
    }

    attacks.push({
      id: `${category}-${item.id}`,
      title: `${item.name.toUpperCase()} · ${rules.range.toUpperCase()}`,
      category,
      apCost: 1,
      attackRoll: `${pool}d6  (${rules.attribute} ${attributes[rules.attribute]} + ${(skill?.name ?? rules.skill).toUpperCase()} ${rank}) VS DEFENSE`,
      damageRoll: `${rules.damage} ${bonus} ${rules.damageType.toUpperCase()}  · +1 PER FULL 5 FLAIR`,
      detail: rules.feature.toUpperCase(),
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
    startTurn,
    toggleCondition,
    rollCrashSave,
    applyDamageOvershield,
    applyDamageHardware,
    healHardware,
    restoreOvershield,
  } = useCharacter();

  const turnGain = getStartingAP(character);
  const maxAP = getMaxBankedAP(character);
  const defense = getDefense(character);
  const flatlined = isFlatlined(character);
  const derivedAttacks = buildAttacksFromGear(character);
  const rebootShield = () => {
    // Reboot Shield (2 AP): regain 1d6 + SYSTEM Overshield.
    spendAP(2);
    restoreOvershield(1 + Math.floor(Math.random() * 6) + character.attributes.SYSTEM);
  };
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
          <Text style={styles.apRule}>
            +{turnGain} AP EACH TURN · UNSPENT AP BANKS · MAX {maxAP} HELD
          </Text>
          <View style={styles.apButtonRow}>
            <ActionButton
              label="SPEND  1 AP"
              subtitle="ATTACK · DASH · HIDE · HELP · REACTION"
              onPress={() => spendAP(1)}
              disabled={character.currentAP <= 0}
              color={Colors.cyan}
            />
            <ActionButton
              label="SPEND  2 AP"
              subtitle="PATCH UP · 2-AP ABILITY"
              onPress={() => spendAP(2)}
              disabled={character.currentAP < 2}
              color={Colors.amber}
            />
          </View>
          <TouchableOpacity style={styles.restoreBtn} onPress={startTurn} accessibilityLabel="Start turn">
            <Text style={styles.restoreBtnText}>▶  START TURN — GAIN {turnGain} AP</Text>
          </TouchableOpacity>
          {session.role === 'gm' && (
            <TouchableOpacity style={styles.restoreBtn} onPress={restoreAP}>
              <Text style={styles.restoreBtnText}>↺  GM: RESET AP TO {turnGain}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Defense & conditions ─────────────────────────── */}
        <View style={[CardStyles.base, { marginTop: Spacing.md }]}>
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={styles.broadcastLabel}>DEFENSE</Text>
              <Text style={styles.statValue}>{defense}</Text>
              <Text style={styles.statHint}>10 + PING + ARMOR</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.broadcastLabel}>INITIATIVE</Text>
              <Text style={styles.statValue}>{character.attributes.PING}d6</Text>
              <Text style={styles.statHint}>PING DICE</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.broadcastLabel}>SPEED</Text>
              <Text style={styles.statValue}>6 m</Text>
              <Text style={styles.statHint}>PER MOVE</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>CONDITIONS</Text>
          <View style={styles.chipRow}>
            {CONDITION_DEFS.map((condition) => {
              const active = character.conditions.includes(condition.id);
              return (
                <TouchableOpacity
                  key={condition.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleCondition(condition.id)}
                  accessibilityLabel={`${active ? 'Clear' : 'Apply'} ${condition.name}`}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{condition.name.toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {CONDITION_DEFS.filter((condition) => character.conditions.includes(condition.id)).map((condition) => (
            <Text key={condition.id} style={styles.conditionText}>
              {condition.name.toUpperCase()}: {condition.text}{condition.shakeOff ? ` Shake it off (1 AP): ${condition.shakeOff}.` : ''}
            </Text>
          ))}
        </View>

        {flatlined && (
          <View style={[CardStyles.danger, { marginTop: Spacing.md }]}>
            <Text style={styles.shockTitle}>FLATLINED</Text>
            <Text style={styles.conditionText}>
              ROLL A CRASH SAVE AT THE START OF EACH TURN: 4-6 SUCCEEDS (6 COUNTS TWICE), 1-3 FAILS (1 COUNTS TWICE).
              THREE SUCCESSES: STABLE. THREE FAILURES: THE BUILD IS DESTROYED.
            </Text>
            <Text style={styles.statValue}>
              ✓ {character.crashSaves.successes} / 3    ✗ {character.crashSaves.failures} / 3
            </Text>
            {character.crashSaves.failures >= 3 ? (
              <Text style={styles.shockSubtitle}>OPERATOR DESTROYED. THE PERSON WAKES UP; THE BUILD DOES NOT.</Text>
            ) : character.crashSaves.successes >= 3 ? (
              <Text style={styles.shockSubtitle}>STABLE. GET UP WITH 1 HARDWARE WHEN THE ENCOUNTER ENDS.</Text>
            ) : (
              <TouchableOpacity style={styles.restoreBtn} onPress={() => rollCrashSave()} accessibilityLabel="Roll crash save">
                <Text style={styles.restoreBtnText}>⚂  ROLL CRASH SAVE</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
              label="REBOOT SHIELD  (2 AP)"
              subtitle={`Regain 1d6 + ${character.attributes.SYSTEM} Overshield`}
              onPress={rebootShield}
              disabled={character.currentAP < 2 || character.overshield.current >= character.overshield.max}
              color={Colors.cyan}
            />
            <ActionButton
              label="+3 HARDWARE"
              subtitle="Patch Up / Field Weld result"
              onPress={() => healHardware(3)}
              disabled={character.hardwareIntegrity.current >= character.hardwareIntegrity.max}
              color={Colors.green}
            />
          </View>
          <View style={styles.repairRow}>
            <ActionButton
              label="+1 HARDWARE"
              subtitle="Fine-tune a heal"
              onPress={() => healHardware(1)}
              disabled={character.hardwareIntegrity.current >= character.hardwareIntegrity.max}
              color={Colors.green}
            />
            <ActionButton
              label="ENCOUNTER OVER"
              subtitle="Overshield resets to full"
              onPress={() => restoreOvershield(character.overshield.max)}
              disabled={character.overshield.current >= character.overshield.max}
              color={Colors.cyan}
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
          <Text style={styles.sectionTitle}>ATTACKS // GEAR-LINKED  ·  1 AP EACH</Text>
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
            {(Object.entries(character.attributes) as [keyof CpuAttributes, number][]).map(([key, val]) => (
              <View key={key} style={styles.attrCell}>
                <Text style={styles.attrKey}>{key}</Text>
                <Text style={styles.attrVal}>{val}</Text>
                <Text style={styles.attrMod}>{val}d6</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Skills ──────────────────────────────────────── */}
        <View style={[CardStyles.base, { marginTop: Spacing.md }]}>
          <Text style={styles.sectionTitle}>SKILLS · POOL = ATTRIBUTE + RANK</Text>
          {SKILL_DEFS.filter((skill) => getSkillRank(character.skills, skill.id) > 0).map((skill) => {
            const rank = getSkillRank(character.skills, skill.id);
            return (
              <View key={skill.id} style={styles.skillRow}>
                <Text style={styles.skillName}>{skill.name.toUpperCase()}  ·  {skill.attribute}</Text>
                <Text style={styles.skillPool}>RANK {rank}  ·  {character.attributes[skill.attribute] + rank}d6</Text>
              </View>
            );
          })}
          <Text style={styles.statHint}>UNTRAINED SKILLS ROLL THE ATTRIBUTE ALONE. SAVES ADD YOUR BEST RELATED SKILL.</Text>
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
  apRule: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.statSmall,
    color: Colors.textPrimary,
    marginVertical: 2,
  },
  statHint: {
    ...Typography.mono,
    fontSize: 9,
    color: Colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberGlow,
  },
  chipText: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.amber,
  },
  conditionText: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.textPrimary,
    lineHeight: 15,
    marginBottom: Spacing.xs,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
  },
  skillName: {
    ...Typography.mono,
    fontSize: 11,
    color: Colors.textPrimary,
  },
  skillPool: {
    ...Typography.mono,
    fontSize: 11,
    color: Colors.cyan,
  },
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
