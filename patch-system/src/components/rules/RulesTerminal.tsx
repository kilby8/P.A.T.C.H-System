import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CardStyles, Colors, GlobalStyles, Spacing, Typography } from '../../theme/theme';
import { RULES_SECTIONS } from '../../../assets/docs/rules';

type SortMode = 'original' | 'az';

export default function RulesTerminal() {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('original');
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    const baseSections = normalizedQuery
      ? RULES_SECTIONS
      .map((section) => {
        const titleMatches = section.title.toLowerCase().includes(normalizedQuery);
        const matchingRules = titleMatches
          ? section.rules
          : section.rules.filter((rule) => rule.toLowerCase().includes(normalizedQuery));

        return {
          ...section,
          rules: matchingRules,
        };
      })
      .filter((section) => section.rules.length > 0)
      : RULES_SECTIONS;

    if (sortMode === 'original') {
      return baseSections;
    }

    return [...baseSections]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((section) => ({
        ...section,
        rules: [...section.rules].sort((a, b) => a.localeCompare(b)),
      }));
  }, [normalizedQuery, sortMode]);

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>P.A.T.C.H. SYSTEM</Text>
        <Text style={styles.title}>RULES INDEX</Text>
        <Text style={styles.subtitle}>GENERAL GUIDE FOR BUILDING AND RUNNING THE GAME</Text>
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.searchLabel}>FILTER RULES</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="SEARCH BY KEYWORD (E.G. QUICKSTART, PLAYTEST, LORE)"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>SORT</Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortMode === 'original' && styles.sortButtonActive]}
              onPress={() => setSortMode('original')}
              activeOpacity={0.75}
            >
              <Text style={[styles.sortButtonText, sortMode === 'original' && styles.sortButtonTextActive]}>
                ORIGINAL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortMode === 'az' && styles.sortButtonActive]}
              onPress={() => setSortMode('az')}
              activeOpacity={0.75}
            >
              <Text style={[styles.sortButtonText, sortMode === 'az' && styles.sortButtonTextActive]}>
                A-Z
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.searchMeta}>
          {normalizedQuery
            ? `${filteredSections.reduce((total, section) => total + section.rules.length, 0)} MATCHES`
            : 'SHOWING ALL RULES'}
        </Text>
      </View>

      {filteredSections.map((section) => (
        <View key={section.title} style={CardStyles.base}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.rules.map((rule, index) => (
            <View key={`${section.title}-${index}`} style={styles.ruleRow}>
              <Text style={styles.ruleIndex}>{index + 1}.</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      ))}

      {filteredSections.length === 0 && (
        <View style={CardStyles.warning}>
          <Text style={styles.noResultsTitle}>NO RULES MATCH SEARCH</Text>
          <Text style={styles.noResultsText}>TRY A BROADER TERM OR CLEAR THE FILTER.</Text>
        </View>
      )}
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
    color: Colors.cyan,
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
    fontSize: 11,
  },
  searchLabel: {
    ...Typography.subheading,
    color: Colors.amber,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    ...Typography.mono,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: 6,
    backgroundColor: Colors.bgDeep,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 11,
  },
  searchMeta: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontSize: 10,
  },
  sortRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortLabel: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortButton: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: 6,
    backgroundColor: Colors.bgDeep,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  sortButtonActive: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanGlow,
  },
  sortButtonText: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  sortButtonTextActive: {
    color: Colors.cyan,
  },
  sectionTitle: {
    ...Typography.subheading,
    color: Colors.cyan,
    marginBottom: Spacing.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  ruleIndex: {
    ...Typography.mono,
    color: Colors.amber,
    width: 22,
    marginTop: 1,
  },
  ruleText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  noResultsTitle: {
    ...Typography.subheading,
    color: Colors.amber,
    marginBottom: Spacing.xs,
  },
  noResultsText: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 11,
  },
});