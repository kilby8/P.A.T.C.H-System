// ============================================================
// P.A.T.C.H. SYSTEM — App Entry Point
// ============================================================
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { CharacterProvider } from './src/store/CharacterContext';
import { createCharacter } from './src/models/Character';
import AppNavigator from './src/components/AppNavigator';

const DEMO_PARTY = [
  createCharacter(
    'op-001',
    'Ghost//Runner',
    { POWER: 12, PING: 16, HARDWARE: 10, DATA: 14, SYSTEM: 14, CLOUT: 10 },
    5,
  ),
  createCharacter(
    'op-002',
    'Chrome Saint',
    { POWER: 14, PING: 11, HARDWARE: 15, DATA: 10, SYSTEM: 12, CLOUT: 9 },
    4,
  ),
  createCharacter(
    'op-003',
    'Null Velvet',
    { POWER: 9, PING: 15, HARDWARE: 11, DATA: 16, SYSTEM: 13, CLOUT: 14 },
    6,
  ),
];

export default function App() {
  return (
    <CharacterProvider initialCharacters={DEMO_PARTY}>
      <StatusBar style="light" />
      <AppNavigator />
    </CharacterProvider>
  );
}
