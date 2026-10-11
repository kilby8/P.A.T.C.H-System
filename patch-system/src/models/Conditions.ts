// ============================================================
// P.A.T.C.H. SYSTEM — Conditions
// ============================================================

export type ConditionId =
  | 'fried' | 'glitched' | 'lagged' | 'marked' | 'pinned'
  | 'prone' | 'staggered' | 'stealthed' | 'stunned' | 'surprised';

export interface ConditionDef {
  id: ConditionId;
  name: string;
  text: string;
  /** Check that ends it with the 1-AP "Shake it off" action, if any. */
  shakeOff?: string;
}

export const CONDITION_DEFS: ConditionDef[] = [
  { id: 'fried', name: 'Fried', text: 'At the start of each of your turns, take 1d4 Hardware damage that bypasses Overshield.', shakeOff: 'HARDWARE + Endurance (15)' },
  { id: 'glitched', name: 'Glitched', text: 'Before each attack or gear feature, roll 1d6. On a 1 it fails and the AP is spent. Ends when the encounter ends.', shakeOff: 'DATA + Hacking (15)' },
  { id: 'lagged', name: 'Lagged', text: 'You act last in the round, and Dash costs 2 AP. Ends at the end of your next turn.' },
  { id: 'marked', name: 'Marked', text: 'Attacks against you get +1 die. Ends when the effect that marked you ends.' },
  { id: 'pinned', name: 'Pinned', text: "You can't move, and attacks against you have advantage. Inmates have advantage on saves against it.", shakeOff: 'POWER + Athletics (15)' },
  { id: 'prone', name: 'Prone', text: 'Melee attacks against you have advantage; ranged attacks from more than 2 m have disadvantage. Your attacks have disadvantage. Standing up uses your free Move.' },
  { id: 'staggered', name: 'Staggered', text: 'Start your next turn with 1 less AP, then it ends.' },
  { id: 'stealthed', name: 'Stealthed', text: "You can't be targeted. Your first attack has advantage and then reveals you." },
  { id: 'stunned', name: 'Stunned', text: "You gain no AP on your next turn (banked AP stays) and can't take reactions. Ends at the end of that turn. Inmates have advantage on saves against it." },
  { id: 'surprised', name: 'Surprised', text: 'You gain no AP on your first turn of the encounter (banked AP stays).' },
];

const conditionMap = new Map(CONDITION_DEFS.map((condition) => [condition.id, condition]));

export function getConditionById(id: ConditionId): ConditionDef | undefined {
  return conditionMap.get(id);
}

export function sanitizeConditions(conditions: string[] | undefined): ConditionId[] {
  if (!conditions) return [];
  return Array.from(new Set(conditions.filter((id): id is ConditionId => conditionMap.has(id as ConditionId))));
}

export interface CrashSaves {
  successes: number;
  failures: number;
}

export function sanitizeCrashSaves(saves: Partial<CrashSaves> | undefined): CrashSaves {
  const clamp = (value: number | undefined) => Math.max(0, Math.min(3, Math.floor(value ?? 0)));
  return { successes: clamp(saves?.successes), failures: clamp(saves?.failures) };
}

/** A crash save die: 4-6 succeeds, 6 counts twice; 1-3 fails, 1 counts twice. */
export function applyCrashSaveRoll(saves: CrashSaves, roll: number): CrashSaves {
  if (roll >= 4) return { ...saves, successes: Math.min(3, saves.successes + (roll === 6 ? 2 : 1)) };
  return { ...saves, failures: Math.min(3, saves.failures + (roll === 1 ? 2 : 1)) };
}
