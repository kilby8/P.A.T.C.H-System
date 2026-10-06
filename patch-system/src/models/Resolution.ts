// ============================================================
// P.A.T.C.H. SYSTEM — Resolution Engine
// ============================================================
// A check rolls a pool of d6 equal to attribute + skill and totals it
// against a fixed target the GM sets. Targets never scale with the pool:
// growing the pool is how an operator gets reliably better. Every point
// over the target is flair (better television).
import { CpuAttributes, normalizeAttribute } from './Character';

export type DifficultyTier = 'routine' | 'tricky' | 'hard' | 'heroic' | 'legendary';

export interface DifficultyStep {
  tier: DifficultyTier;
  label: string;
  target: number;
}

/** Starting ladder for playtesting; tune after the first real session. */
export const DIFFICULTY_LADDER: DifficultyStep[] = [
  { tier: 'routine', label: 'ROUTINE', target: 10 },
  { tier: 'tricky', label: 'TRICKY', target: 15 },
  { tier: 'hard', label: 'HARD', target: 20 },
  { tier: 'heroic', label: 'HEROIC', target: 25 },
  { tier: 'legendary', label: 'LEGENDARY', target: 30 },
];

export function getDifficultyTarget(tier: DifficultyTier): number {
  return DIFFICULTY_LADDER.find((step) => step.tier === tier)?.target ?? 20;
}

/** Pool size = attribute (1–5) + skill ranks. */
export function getDicePoolSize(attributeValue: number, skillRanks = 0): number {
  return normalizeAttribute(attributeValue) + Math.max(0, Math.floor(skillRanks));
}

export function rollDicePool(poolSize: number, random: () => number = Math.random): number[] {
  const count = Math.max(0, Math.floor(poolSize));
  return Array.from({ length: count }, () => 1 + Math.floor(random() * 6));
}

export interface CheckResult {
  dice: number[];
  total: number;
  target: number;
  success: boolean;
  /** Points over the target on a success; 0 otherwise. */
  flair: number;
  /** Points under the target on a failure; 0 otherwise. */
  shortfall: number;
}

export function resolveCheck(dice: number[], target: number): CheckResult {
  const total = dice.reduce((sum, die) => sum + die, 0);
  const success = total >= target;
  return {
    dice,
    total,
    target,
    success,
    flair: success ? total - target : 0,
    shortfall: success ? 0 : target - total,
  };
}

export function rollCheck(
  attributes: CpuAttributes,
  attribute: keyof CpuAttributes,
  skillRanks: number,
  target: number,
  random?: () => number,
): CheckResult {
  const pool = getDicePoolSize(attributes[attribute], skillRanks);
  return resolveCheck(rollDicePool(pool, random), target);
}
