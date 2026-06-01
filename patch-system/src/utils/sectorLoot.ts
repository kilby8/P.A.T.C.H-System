import { BLUEPRINT_DEFS, BlueprintDef, BlueprintMarket, GearTheme } from '../models/Gear';

export type SectorDifficulty = 1 | 2 | 3 | 4 | 5;

export interface SectorLootChances {
  foundation: number;
  tactical: number;
  apex: number;
}

export const SECTOR_LOOT_TABLE: Record<SectorDifficulty, SectorLootChances> = {
  1: { foundation: 80, tactical: 20, apex: 0 },
  2: { foundation: 50, tactical: 45, apex: 5 },
  3: { foundation: 20, tactical: 60, apex: 20 },
  4: { foundation: 10, tactical: 40, apex: 50 },
  5: { foundation: 0, tactical: 20, apex: 80 },
};

export interface SectorLootRollResult {
  theme: GearTheme;
  blueprint: BlueprintDef;
  roll: number;
}

function pickTheme(difficulty: SectorDifficulty, roll: number): GearTheme {
  const row = SECTOR_LOOT_TABLE[difficulty];
  if (roll <= row.foundation) return 'foundation';
  if (roll <= row.foundation + row.tactical) return 'tactical';
  return 'apex';
}

function weightedPick<T>(items: T[], weightOf: (item: T) => number): T | undefined {
  if (items.length === 0) return undefined;
  const weights = items.map((item) => Math.max(0, weightOf(item)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];

  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

function getLootCandidates(
  difficulty: SectorDifficulty,
  market: BlueprintMarket,
  theme: GearTheme,
): BlueprintDef[] {
  return BLUEPRINT_DEFS.filter((bp) => (
    bp.theme === theme
    && market.lootEnabled[bp.id]
    && market.themeGates[bp.theme]
    && (market.availability[bp.id] ?? 0) > 0
    && (!bp.sectorLocks || bp.sectorLocks.includes(difficulty))
    && (!bp.uniqueDrop || (market.availability[bp.id] ?? 0) > 0)
  ));
}

export function rollSectorBlueprint(
  difficulty: SectorDifficulty,
  market: BlueprintMarket,
): SectorLootRollResult | null {
  const roll = Math.floor(Math.random() * 100) + 1;
  const requestedTheme = pickTheme(difficulty, roll);

  const themeOrder: GearTheme[] =
    requestedTheme === 'apex'
      ? ['apex', 'tactical', 'foundation']
      : requestedTheme === 'tactical'
        ? ['tactical', 'foundation']
        : ['foundation'];

  for (const theme of themeOrder) {
    const candidates = getLootCandidates(difficulty, market, theme);
    const picked = weightedPick(candidates, (bp) => market.weightMultipliers[bp.id] ?? 1);
    if (picked) {
      return {
        theme,
        blueprint: picked,
        roll,
      };
    }
  }

  return null;
}

export interface SectorLootSimulationResult {
  rolls: number;
  byTheme: Record<GearTheme, number>;
  byBlueprint: Record<string, number>;
}

export function simulateSectorLoot(
  difficulty: SectorDifficulty,
  market: BlueprintMarket,
  rolls: number,
): SectorLootSimulationResult {
  const byTheme: Record<GearTheme, number> = {
    foundation: 0,
    tactical: 0,
    apex: 0,
  };
  const byBlueprint: Record<string, number> = {};

  for (let i = 0; i < rolls; i += 1) {
    const result = rollSectorBlueprint(difficulty, market);
    if (!result) continue;
    byTheme[result.theme] += 1;
    byBlueprint[result.blueprint.id] = (byBlueprint[result.blueprint.id] ?? 0) + 1;
  }

  return {
    rolls,
    byTheme,
    byBlueprint,
  };
}
