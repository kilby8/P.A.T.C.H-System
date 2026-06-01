// ============================================================
// P.A.T.C.H. SYSTEM — Main Navigation (tab bar)
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCharacter } from '../store/CharacterContext';
import { Colors, Typography, Spacing } from '../theme/theme';
import EncounterHUD from './hud/EncounterHUD';
import ArchetypeMatrix from './archetype/ArchetypeMatrix';
import CondoPhaseTerminal from './condo/CondoPhaseTerminal';
import LoginTerminal from './auth/LoginTerminal';
import CharacterCreationTerminal from './character-creation/CharacterCreationTerminal';
import GMConsole from './gm/GMConsole';
import RulesTerminal from './rules/RulesTerminal';
import GearTerminal from './gear/GearTerminal';
import BestiaryTerminal from './bestiary/BestiaryTerminal';

type Tab = 'GM' | 'HUD' | 'MATRIX' | 'CONDO' | 'RULES' | 'GEAR' | 'BESTIARY';

const PLAYER_TABS: { id: Exclude<Tab, 'GM'>; label: string; icon: string }[] = [
  { id: 'HUD', label: 'ENCOUNTER', icon: '⚔' },
  { id: 'MATRIX', label: 'ARCHETYPE', icon: '◎' },
  { id: 'GEAR', label: 'GEAR', icon: '⌁' },
  { id: 'BESTIARY', label: 'BESTIARY', icon: '☠' },
  { id: 'CONDO', label: 'CONDO', icon: '⏱' },
  { id: 'RULES', label: 'RULES', icon: '☰' },
];

const GM_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'GM', label: 'GM', icon: '▣' },
  { id: 'HUD', label: 'SHEET', icon: '⚔' },
  { id: 'MATRIX', label: 'BUILD', icon: '◎' },
  { id: 'GEAR', label: 'GEAR', icon: '⌁' },
  { id: 'BESTIARY', label: 'BESTIARY', icon: '☠' },
  { id: 'CONDO', label: 'RECOVERY', icon: '⏱' },
  { id: 'RULES', label: 'RULES', icon: '☰' },
];

export default function AppNavigator() {
  const { session, logout, remoteSessionCode, syncStatus } = useCharacter();
  const [activeTab, setActiveTab] = useState<Tab>('HUD');
  const [creatingCharacter, setCreatingCharacter] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (session.role === 'guest') {
      setActiveTab('HUD');
      return;
    }

    if (session.role === 'gm') {
      setActiveTab('GM');
      return;
    }

    setActiveTab('HUD');
  }, [session.role]);

  if (creatingCharacter) {
    return <CharacterCreationTerminal />;
  }

  if (session.role === 'guest') {
    return <LoginTerminal onCreateNew={() => setCreatingCharacter(true)} />;
  }

  const tabs = session.role === 'gm' ? GM_TABS : PLAYER_TABS;

  return (
    <View style={styles.root}>
      {/* Session / status bar — padded for status bar height */}
      <View style={[styles.sessionBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.sessionLabel}>
          {session.role.toUpperCase()} :: {session.actorName.toUpperCase()}
          {remoteSessionCode ? ` :: ${remoteSessionCode} :: ${syncStatus.toUpperCase()}` : ''}
        </Text>
        <TouchableOpacity onPress={logout} activeOpacity={0.75}>
          <Text style={styles.sessionLogout}>LOG OUT</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.screen}>
        {activeTab === 'GM'       && session.role === 'gm' && <GMConsole />}
        {activeTab === 'HUD'      && <EncounterHUD />}
        {activeTab === 'MATRIX'   && <ArchetypeMatrix />}
        {activeTab === 'GEAR'     && <GearTerminal />}
        {activeTab === 'BESTIARY' && <BestiaryTerminal />}
        {activeTab === 'CONDO'    && <CondoPhaseTerminal />}
        {activeTab === 'RULES'    && <RulesTerminal />}
      </View>

      {/* Tab Bar — padded for Android nav bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgVoid,
  },
  screen: {
    flex: 1,
  },
  sessionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
    backgroundColor: Colors.bgDeep,
  },
  sessionLabel: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    flexShrink: 1,
    marginRight: Spacing.sm,
  },
  sessionLogout: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
    backgroundColor: Colors.bgDeep,
    paddingTop: Spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: Colors.cyan,
    marginTop: -1,
  },
  tabIcon: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  tabIconActive: {
    color: Colors.cyan,
  },
  tabLabel: {
    ...Typography.mono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  tabLabelActive: {
    color: Colors.cyan,
  },
});
