import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ARENA_BESTIARY, getMobProfile, MobProfile } from '../../models/ArenaBestiary';
import { CardStyles, Colors, GlobalStyles, Radius, Spacing, Typography } from '../../theme/theme';

export default function BestiaryTerminal() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const profiles = useMemo(
    () => ARENA_BESTIARY.map((entity) => getMobProfile(entity.id)).filter((p): p is MobProfile => !!p),
    [],
  );
  const filtered = useMemo(() => {
    if (!normalizedQuery) return profiles;
    return profiles.filter((p) => (
      `${p.name} ${p.role} ${p.tier} ${p.description} ${p.abilities.map((a) => a.name).join(' ')}`.toLowerCase().includes(normalizedQuery)
    ));
  }, [normalizedQuery, profiles]);

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>P.A.T.C.H. DATABASE</Text>
        <Text style={styles.title}>ARENA BESTIARY</Text>
        <Text style={styles.subtitle}>STAT BLOCKS · MATCHES THE ARENA BESTIARY PDF</Text>
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>FILTER HOSTILES</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="SEARCH NAME, ROLE, TIER OR ABILITY"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        <Text style={styles.meta}>{filtered.length} ENTRIES</Text>
      </View>

      {filtered.map((p) => (
        <View key={p.id} style={CardStyles.base}>
          <View style={styles.row}>
            <View style={styles.infoWrap}>
              <Text style={styles.name}>{p.name.toUpperCase()}</Text>
              <Text style={styles.role}>{p.role.toUpperCase()} · {p.tier.toUpperCase()}{p.kind ? ` · ${p.kind.toUpperCase()}` : ''}</Text>
              <Text style={styles.id}>TEMPLATE ID {p.id}{p.sameAs ? ` · SAME STAT BLOCK AS #${p.sameAs}` : ''}</Text>
            </View>
          </View>
          <View style={styles.statBar}>
            {([
              ['INT', p.integrity], ['AP', p.ap], ['DEF', p.defense], ['INIT', p.init], ['MOVE', p.move.split(' (')[0]], ['THREAT', p.threat],
            ] as [string, string | number][]).map(([label, value]) => (
              <View key={label} style={styles.statCell}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.ability}>ATTACK {p.attack} VS DEFENSE · {p.damage} DAMAGE · SAVES {p.saveDice}d6 · EFFECTS SAVE {p.saveTarget}</Text>
          {p.abilities.map((a) => (
            <Text key={a.name} style={styles.ability}><Text style={styles.abilityName}>{a.name.toUpperCase()}. </Text>{a.text}</Text>
          ))}
          {p.tactics ? <Text style={styles.tactics}>TACTICS: {p.tactics}</Text> : null}
          <Text style={styles.description}>{p.description.toUpperCase()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.amberDim,
    paddingVertical: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...Typography.mono,
    fontSize: 9,
    color: Colors.amber,
  },
  statValue: {
    ...Typography.mono,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  ability: {
    ...Typography.mono,
    fontSize: 11,
    color: Colors.textPrimary,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  abilityName: {
    color: Colors.cyan,
  },
  tactics: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.sm,
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
  subtitle: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  sectionTitle: {
    ...Typography.subheading,
    color: Colors.cyan,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    ...Typography.mono,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgDeep,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  meta: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontSize: 10,
  },
  row: {
    marginBottom: Spacing.xs,
  },
  infoWrap: {
    flex: 1,
  },
  name: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  role: {
    ...Typography.mono,
    color: Colors.cyan,
    marginBottom: 2,
    fontSize: 10,
  },
  id: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  description: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 17,
    fontSize: 10,
  },
});
