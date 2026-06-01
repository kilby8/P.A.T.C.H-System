// ============================================================
// P.A.T.C.H. SYSTEM — Local Login Terminal
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCharacter } from '../../store/CharacterContext';
import { getStartingAP } from '../../models/Character';
import { BACKGROUND_CATEGORY_LABELS, getBackgroundById } from '../../models/Backgrounds';
import { CardStyles, Colors, GlobalStyles, Radius, Spacing, Typography } from '../../theme/theme';

export default function LoginTerminal() {
  const { party, loginAsPlayer, loginAsGM, remoteSessionCode, setRemoteSessionCode, syncStatus, remoteSyncAvailable } = useCharacter();
  const [gmCode, setGmCode] = useState('');
  const [error, setError] = useState('');

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <ScrollView style={GlobalStyles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>P.A.T.C.H. SYSTEM</Text>
        <Text style={styles.title}>ACCESS TERMINAL</Text>
        <Text style={styles.subtitle}>SELECT A PLAYER SHEET OR ENTER GM OVERRIDE</Text>

        <View style={[CardStyles.base, styles.syncCard]}>
          <Text style={styles.sectionTitle}>SHARED SESSION</Text>
          <TextInput
            value={remoteSessionCode}
            onChangeText={setRemoteSessionCode}
            placeholder="OPTIONAL SESSION CODE (E.G. ARENA-001)"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            style={styles.input}
          />
          <Text style={styles.syncHint}>
            {remoteSyncAvailable
              ? `REMOTE SYNC ${syncStatus.toUpperCase()}`
              : 'REMOTE SYNC OFFLINE — SET EXPO_PUBLIC_SUPABASE_URL AND EXPO_PUBLIC_SUPABASE_ANON_KEY'}
          </Text>
        </View>

        <View style={CardStyles.glow}>
          <Text style={styles.sectionTitle}>PLAYER LOGIN</Text>
          {party.map((character) => {
            const background = getBackgroundById(character.backgroundId);
            return (
            <TouchableOpacity
              key={character.id}
              style={styles.playerButton}
              onPress={() => loginAsPlayer(character.id)}
              activeOpacity={0.75}
            >
              <View>
                <Text style={styles.playerName}>{character.name.toUpperCase()}</Text>
                {background ? (
                  <Text style={styles.playerBackground}>
                    {background.name.toUpperCase()} • {BACKGROUND_CATEGORY_LABELS[background.category]}
                  </Text>
                ) : null}
                <Text style={styles.playerMeta}>
                  AP {character.currentAP}/{getStartingAP(character)} • HW {character.hardwareIntegrity.current}/{character.hardwareIntegrity.max}
                </Text>
              </View>
              <Text style={styles.playerArrow}>ENTER</Text>
            </TouchableOpacity>
            );
          })}
        </View>

        <View style={[CardStyles.base, styles.gmCard]}>
          <Text style={styles.sectionTitle}>GM LOGIN</Text>
          <TextInput
            value={gmCode}
            onChangeText={(value) => {
              setGmCode(value);
              setError('');
            }}
            placeholder="ENTER GM ACCESS CODE"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.gmButton}
            onPress={() => {
              if (!loginAsGM(gmCode)) {
                setError('INVALID GM ACCESS CODE');
                return;
              }
              setGmCode('');
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.gmButtonText}>AUTHORIZE GM</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  eyebrow: {
    ...Typography.mono,
    color: Colors.cyan,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.displayLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.subheading,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  playerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  playerName: {
    ...Typography.heading,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  playerMeta: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  playerBackground: {
    ...Typography.mono,
    color: Colors.amber,
    marginTop: 2,
    fontSize: 10,
  },
  playerArrow: {
    ...Typography.mono,
    color: Colors.cyan,
  },
  gmCard: {
    marginTop: Spacing.lg,
  },
  syncCard: {
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    ...Typography.mono,
  },
  gmButton: {
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  gmButtonText: {
    ...Typography.subheading,
    color: Colors.amber,
  },
  errorText: {
    ...Typography.mono,
    color: Colors.crimson,
    marginTop: Spacing.sm,
  },
  syncHint: {
    ...Typography.mono,
    color: Colors.textSecondary,
  },
});

