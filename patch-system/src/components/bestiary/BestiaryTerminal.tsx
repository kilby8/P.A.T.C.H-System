import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ARENA_BESTIARY } from '../../models/ArenaBestiary';
import { CardStyles, Colors, GlobalStyles, Radius, Spacing, Typography } from '../../theme/theme';

export default function BestiaryTerminal() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return ARENA_BESTIARY;
    return ARENA_BESTIARY.filter((entity) => (
      `${entity.name} ${entity.role} ${entity.description}`.toLowerCase().includes(normalizedQuery)
    ));
  }, [normalizedQuery]);

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>P.A.T.C.H. DATABASE</Text>
        <Text style={styles.title}>ARENA BESTIARY</Text>
        <Text style={styles.subtitle}>CANONICAL ENEMY PROFILES</Text>
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>FILTER HOSTILES</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="SEARCH NAME, ROLE, OR BEHAVIOR"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        <Text style={styles.meta}>{filtered.length} ENTRIES</Text>
      </View>

      {filtered.map((entity) => (
        <View key={entity.id} style={CardStyles.base}>
          <View style={styles.row}>
            <View style={styles.infoWrap}>
              <Text style={styles.name}>{entity.name.toUpperCase()}</Text>
              <Text style={styles.role}>{entity.role.toUpperCase()}</Text>
              <Text style={styles.id}>TEMPLATE ID {entity.id}</Text>
            </View>
          </View>
          <Text style={styles.description}>{entity.description.toUpperCase()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
