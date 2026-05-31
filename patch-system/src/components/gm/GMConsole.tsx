// ============================================================
// P.A.T.C.H. SYSTEM — GM Console
// ============================================================
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useCharacter } from '../../store/CharacterContext';
import { CardStyles, Colors, GlobalStyles, Radius, Spacing, Typography } from '../../theme/theme';

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
  } = useCharacter();

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
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
              </TouchableOpacity>
            );
          })}
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
                  <View>
                    <Text style={styles.mobName}>{mob.name.toUpperCase()}</Text>
                    <Text style={styles.mobRole}>{mob.role}</Text>
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
    </SafeAreaView>
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
  scoreButtonText: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  generatorActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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