// ============================================================
// P.A.T.C.H. SYSTEM — App Entry Point
// ============================================================
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CharacterProvider } from './src/store/CharacterContext';
import { createCharacter } from './src/models/Character';
import AppNavigator from './src/components/AppNavigator';

const DEMO_PARTY = [
  createCharacter(
    'op-001',
    'Ghost//Runner',
    { POWER: 4, PING: 5, HARDWARE: 3, DATA: 4, SYSTEM: 4, CLOUT: 3 },
    5,
    'neon-runner',
  ),
  createCharacter(
    'op-002',
    'Chrome Saint',
    { POWER: 4, PING: 3, HARDWARE: 5, DATA: 3, SYSTEM: 4, CLOUT: 3 },
    4,
    'riot-breaker',
  ),
  createCharacter(
    'op-003',
    'Null Velvet',
    { POWER: 3, PING: 5, HARDWARE: 3, DATA: 5, SYSTEM: 4, CLOUT: 4 },
    6,
    'memory-broker',
  ),
];

export default function App() {
  return (
    <SafeAreaProvider>
      <CharacterProvider initialCharacters={DEMO_PARTY}>
        <StatusBar style="light" />
        <AppNavigator />
      </CharacterProvider>
    </SafeAreaProvider>
  );
}
