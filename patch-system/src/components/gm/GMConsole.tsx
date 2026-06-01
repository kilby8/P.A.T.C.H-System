// ============================================================
// P.A.T.C.H. SYSTEM — GM Console
// ============================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { getSponsorBlueprints } from '../../models/Gear';
import { useCharacter } from '../../store/CharacterContext';
import { CardStyles, Colors, GlobalStyles, Radius, Spacing, Typography } from '../../theme/theme';

const BROADCAST_HEAT_LABELS = {
  1: 'COLD FEED',
  2: 'WARM FEED',
  3: 'TRENDING',
  4: 'FEATURED',
  5: 'MAXIMUM HEAT',
} as const;

const AD_READS = [
  {
    title: 'KINETIC COLA',
    copy: 'Tonight\'s firefight is brought to you by Kinetic Cola: drink voltage, survive the edit.',
    fragmentReward: 15,
    overshieldBoost: 2,
    note: 'corporate ad-read: kinetic cola',
  },
  {
    title: 'BULWARK LIFE',
    copy: 'Bulwark Life assures every viewer that operator survivability remains a premium growth sector.',
    fragmentReward: 20,
    overshieldBoost: 4,
    note: 'corporate ad-read: bulwark life',
  },
  {
    title: 'PATCH PRIME',
    copy: 'PATCH Prime subscribers enjoy expanded angles, biometric overlays, and same-hour casualty analytics.',
    fragmentReward: 25,
    overshieldBoost: 3,
    note: 'corporate ad-read: patch prime',
  },
];

export default function GMConsole() {
  const {
    party,
    selectedCharacterId,
    selectCharacter,
    logout,
    encounter,
    generateEncounter,
    rollEncounter,
    clearEncounter,
    damageMob,
    healMob,
    spendMobAP,
    restoreMobAP,
    removeMob,
    applyDamageOvershield,
    applyDamageHardware,
    restoreOvershield,
    sectorDifficulty,
    setSectorDifficulty,
    sponsorDrop,
    awardFragments,
  } = useCharacter();

  const selectedCharacter = useMemo(
    () => party.find((character) => character.id === selectedCharacterId) ?? party[0],
    [party, selectedCharacterId],
  );
  const sponsorPoolSize = getSponsorBlueprints().length;

  return (
    <View style={GlobalStyles.safeArea}>
      <ScrollView style={GlobalStyles.screen} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>GM SESSION</Text>
            <Text style={styles.title}>ARENA CONTROL</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>LOG OUT</Text>
          </TouchableOpacity>
        </View>

        <View style={CardStyles.glow}>
          <Text style={styles.sectionTitle}>PLAYER SHEETS</Text>
          {party.map((character) => {
            const selected = character.id === selectedCharacterId;
            return (
              <TouchableOpacity
                key={character.id}
                style={[styles.playerCard, selected && styles.playerCardSelected]}
                onPress={() => selectCharacter(character.id)}
                activeOpacity={0.75}
              >
                <View style={styles.playerHeader}>
                  <Text style={styles.playerName}>{character.name.toUpperCase()}</Text>
                  <Text style={[styles.playerFlag, selected && styles.playerFlagSelected]}>
                    {selected ? 'ACTIVE SHEET' : 'VIEW SHEET'}
                  </Text>
                </View>
                <Text style={styles.playerVitals}>
                  OS {character.overshield.current}/{character.overshield.max} • HW {character.hardwareIntegrity.current}/{character.hardwareIntegrity.max} • AP {character.currentAP}
                </Text>
                <Text style={styles.playerVitals}>
                  PWR {character.attributes.POWER} • PNG {character.attributes.PING} • HDW {character.attributes.HARDWARE} • DAT {character.attributes.DATA} • SYS {character.attributes.SYSTEM} • CLT {character.attributes.CLOUT}
                </Text>
                <Text style={styles.playerVitals}>
                  FEED {character.engagement}% • VIEWERS {character.viewerCount.toLocaleString()}
                </Text>
                {character.aiPriorityMarked && (
                  <Text style={styles.priorityFlag}>PRIORITY TARGETING FLAG :: HOSTILE AI BIAS ACTIVE</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[CardStyles.warning, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>PRODUCER DASHBOARD</Text>
          <Text style={styles.producerMeta}>
            LIVE BROADCAST HEAT :: S{sectorDifficulty} :: {BROADCAST_HEAT_LABELS[sectorDifficulty]}
          </Text>
          <View style={styles.scoreRow}>
            {([1, 2, 3, 4, 5] as const).map((difficulty) => (
              <TouchableOpacity
                key={`heat-${difficulty}`}
                style={[styles.scoreButton, sectorDifficulty === difficulty && styles.scoreButtonActive]}
                onPress={() => setSectorDifficulty(difficulty)}
                activeOpacity={0.75}
              >
                <Text style={[styles.scoreButtonText, sectorDifficulty === difficulty && styles.scoreButtonTextActive]}>
                  {difficulty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.generatorActionRow}>
            <TouchableOpacity
              style={styles.rollButton}
              onPress={() => setSectorDifficulty(Math.min(5, sectorDifficulty + 1) as 1 | 2 | 3 | 4 | 5)}
              activeOpacity={0.75}
            >
              <Text style={styles.rollButtonText}>HAZARD SPIKE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSectorDifficulty(Math.max(1, sectorDifficulty - 1) as 1 | 2 | 3 | 4 | 5)}
              activeOpacity={0.75}
            >
              <Text style={styles.clearButtonText}>COOL FEED</Text>
            </TouchableOpacity>
          </View>

          {selectedCharacter && (
            <View style={styles.adReadTargetCard}>
              <Text style={styles.adReadTargetLabel}>ACTIVE SPONSOR TARGET</Text>
              <Text style={styles.adReadTargetValue}>{selectedCharacter.name.toUpperCase()}</Text>
              <Text style={styles.adReadTargetMeta}>
                ENGAGEMENT {selectedCharacter.engagement}% · VIEWERS {selectedCharacter.viewerCount.toLocaleString()} · SPONSOR POOL {sponsorPoolSize}
              </Text>
              <View style={styles.mobActionRow}>
                <MiniButton label="OS -1" onPress={() => applyDamageOvershield(1)} danger />
                <MiniButton label="OS -3" onPress={() => applyDamageOvershield(3)} danger />
                <MiniButton label="HW -1" onPress={() => applyDamageHardware(1)} danger />
                <MiniButton label="HW -3" onPress={() => applyDamageHardware(3)} danger />
              </View>
            </View>
          )}

          {selectedCharacter && (
            <TouchableOpacity
              style={[styles.rollButton, selectedCharacter.engagement < 60 && styles.disabledAction]}
              onPress={() => sponsorDrop(selectedCharacter.id)}
              disabled={selectedCharacter.engagement < 60}
              activeOpacity={0.75}
            >
              <Text style={styles.rollButtonText}>
                {selectedCharacter.engagement < 60 ? 'SPONSOR DROP LOCKED <60 ENGAGEMENT' : 'TRIGGER SPONSOR DROP'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedCharacter && AD_READS.map((adRead) => (
            <View key={adRead.title} style={styles.adReadCard}>
              <Text style={styles.adReadTitle}>{adRead.title}</Text>
              <Text style={styles.adReadCopy}>{adRead.copy.toUpperCase()}</Text>
              <View style={styles.mobActionRow}>
                <MiniButton
                  label={`AIR AD-READ +${adRead.fragmentReward} DF`}
                  onPress={() => awardFragments(selectedCharacter.id, adRead.fragmentReward, adRead.note)}
                />
                <MiniButton
                  label={`SPONSOR SHIELD +${adRead.overshieldBoost}`}
                  onPress={() => restoreOvershield(adRead.overshieldBoost)}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={[CardStyles.base, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>MOB GENERATOR</Text>
          <View style={styles.scoreRow}>
            {[1, 2, 3, 4, 5, 6].map((score) => (
              <TouchableOpacity
                key={score}
                style={styles.scoreButton}
                onPress={() => generateEncounter(score)}
                activeOpacity={0.75}
              >
                <Text style={styles.scoreButtonText}>{score}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.generatorActionRow}>
            <TouchableOpacity style={styles.rollButton} onPress={rollEncounter} activeOpacity={0.75}>
              <Text style={styles.rollButtonText}>ROLL SPECTACLE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearEncounter} activeOpacity={0.75}>
              <Text style={styles.clearButtonText}>CLEAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {encounter ? (
          <View style={[CardStyles.base, styles.sectionSpacing]}>
            <Text style={styles.sectionTitle}>ACTIVE ENCOUNTER</Text>
            <Text style={styles.encounterMeta}>SPECTACLE {encounter.spectacleScore} • {encounter.bracketLabel.toUpperCase()}</Text>
            {encounter.modifiers.map((modifier) => (
              <Text key={modifier} style={styles.modifierText}>{modifier.toUpperCase()}</Text>
            ))}
            {encounter.mobs.map((mob) => (
              <View key={mob.id} style={[styles.mobCard, mob.defeated && styles.mobCardDefeated]}>
                <View style={styles.mobHeader}>
                  <View style={styles.mobIdentity}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mobName}>{mob.name.toUpperCase()}</Text>
                      <Text style={styles.mobRole}>{mob.role}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeMob(mob.id)}>
                    <Text style={styles.removeText}>REMOVE</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.mobStats}>INTEGRITY {mob.currentIntegrity}/{mob.maxIntegrity} • AP {mob.currentAP}/{mob.maxAP}</Text>
                <Text style={styles.mobDesc}>{mob.description}</Text>
                <View style={styles.mobActionRow}>
                  <MiniButton label="-1 HP" onPress={() => damageMob(mob.id, 1)} danger />
                  <MiniButton label="-3 HP" onPress={() => damageMob(mob.id, 3)} danger />
                  <MiniButton label="+1 HP" onPress={() => healMob(mob.id, 1)} />
                  <MiniButton label="AP -1" onPress={() => spendMobAP(mob.id, 1)} />
                </View>
                <View style={styles.mobActionRow}>
                  <MiniButton label="RESET AP" onPress={() => restoreMobAP(mob.id)} />
                  <MiniButton label="+3 HP" onPress={() => healMob(mob.id, 3)} />
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function MiniButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.miniButton, danger && styles.miniButtonDanger]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.miniButtonText, danger && styles.miniButtonTextDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    ...Typography.mono,
    color: Colors.amber,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  logoutButtonText: {
    ...Typography.mono,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    ...Typography.subheading,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  sectionSpacing: {
    marginTop: Spacing.lg,
  },
  playerCard: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  playerCardSelected: {
    borderColor: Colors.cyan,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  playerName: {
    ...Typography.heading,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  playerFlag: {
    ...Typography.mono,
    color: Colors.textMuted,
  },
  playerFlagSelected: {
    color: Colors.cyan,
  },
  playerVitals: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  scoreButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
  },
  scoreButtonActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.bgCard,
  },
  scoreButtonText: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  scoreButtonTextActive: {
    color: Colors.amber,
  },
  generatorActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  producerMeta: {
    ...Typography.mono,
    color: Colors.amber,
    marginBottom: Spacing.md,
  },
  priorityFlag: {
    ...Typography.mono,
    color: Colors.crimson,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  adReadTargetCard: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  adReadTargetLabel: {
    ...Typography.mono,
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  adReadTargetValue: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  adReadTargetMeta: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  adReadCard: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  adReadTitle: {
    ...Typography.subheading,
    color: Colors.cyan,
    marginBottom: Spacing.xs,
  },
  adReadCopy: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },
  rollButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  disabledAction: {
    opacity: 0.4,
  },
  rollButtonText: {
    ...Typography.subheading,
    color: Colors.amber,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  clearButtonText: {
    ...Typography.subheading,
    color: Colors.textSecondary,
  },
  encounterMeta: {
    ...Typography.mono,
    color: Colors.cyan,
    marginBottom: Spacing.sm,
  },
  modifierText: {
    ...Typography.mono,
    color: Colors.amber,
    marginBottom: Spacing.xs,
  },
  mobCard: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  mobCardDefeated: {
    opacity: 0.45,
  },
  mobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobIdentity: {
    flex: 1,
  },
  mobName: {
    ...Typography.heading,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  mobRole: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeText: {
    ...Typography.mono,
    color: Colors.crimson,
  },
  mobStats: {
    ...Typography.mono,
    color: Colors.cyan,
    marginTop: Spacing.sm,
  },
  mobDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  mobActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  miniButton: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  miniButtonDanger: {
    borderColor: Colors.crimson,
  },
  miniButtonText: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  miniButtonTextDanger: {
    color: Colors.crimson,
  },
});