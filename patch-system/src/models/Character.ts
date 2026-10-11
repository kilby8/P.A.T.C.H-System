// ============================================================
// P.A.T.C.H. SYSTEM — Character Model
// ============================================================
import {
  BlueprintInventory,
  createStarterBlueprintInventory,
  createStarterLoadout,
  GEAR_ITEM_DEFS,
  GearLoadout,
  GEAR_CATEGORIES,
  getBlueprintById,
  getGearItemById,
  getGearRules,
} from './Gear';
import { BackgroundId, OriginId, getBackgroundById } from './Backgrounds';
import {
  BACKGROUND_SKILL_RANK,
  SkillRanks,
  sanitizeSkillRanks,
} from './Skills';
import { ConditionId, CrashSaves, sanitizeConditions, sanitizeCrashSaves } from './Conditions';

/** The six CPU Attributes of a PATCH character. */
export interface CpuAttributes {
  POWER: number;
  PING: number;
  HARDWARE: number;
  DATA: number;
  SYSTEM: number;
  CLOUT: number;
}

/** Dual-layer vital structure (max + current). */
export interface VitalLayer {
  max: number;
  current: number;
}

/**
 * Full character state for the P.A.T.C.H. System.
 *
 * Active Processing Pool (AP)
 * CPU Attributes run 1–5 (3 is average). A check rolls a d6 pool of
 * attribute + skill and totals it against a fixed target (see Resolution.ts).
 *
 *   baseAP = 1 + Math.floor(SYSTEM / 2)
 *   If Neural Shock is active: startingAP = baseAP - 1 (minimum 0)
 *
 * Neural Shock triggers when Hardware Integrity current < 50 % of max.
 */
export interface Character {
  id: string;
  name: string;

  // ── CPU Attributes ──────────────────────────────────────
  attributes: CpuAttributes;

  // ── Dual-Layer Vitals ───────────────────────────────────
  /** Digital defense layer — regenerates more freely. */
  overshield: VitalLayer;
  /** Biological / hardware trauma — harder to restore. */
  hardwareIntegrity: VitalLayer;

  // ── Active Processing Pool ──────────────────────────────
  /** AP available for the current turn. */
  currentAP: number;

  // ── Neural Shock ────────────────────────────────────────
  /** True when hardwareIntegrity.current < 50 % of max. */
  neuralShock: boolean;

  // ── Advancement ─────────────────────────────────────────
  /** Character Advancement Points available to spend on nodes. */
  advancementPoints: number;

  /** IDs of unlocked archetype nodes. */
  unlockedNodes: string[];

  /** IDs of unlocked sub-skills across all archetype nodes. */
  unlockedSubSkills: string[];

  // ── Gear + Economy ───────────────────────────────────────
  /** Equipped gear per category with hardpoint installations. */
  gearLoadout: GearLoadout;

  /** Owned blueprint counts by blueprint ID. */
  blueprintInventory: BlueprintInventory;

  /** Whether a blueprint stack is tradable. */
  blueprintTradable: Record<string, boolean>;

  /** Wallet currency used for terminal purchases. */
  dataFragments: number;

  /** Current live-feed engagement rating from 0-100. */
  engagement: number;

  /** Estimated active viewers currently following the operator feed. */
  viewerCount: number;

  /** Recent sponsor-grade schematic arrivals routed through the broadcast inbox. */
  sponsorInbox: string[];

  /** True when hostile AI should prioritize this operator (glitcher anomaly trait). */
  aiPriorityMarked: boolean;

  /** Roster identity package containing passives/proficiencies/starter narrative. */
  backgroundId: BackgroundId;

  /** Where the program pulled the operator from; sets the shared trait. */
  origin: OriginId;

  /** Skill ranks (0-5). Pool = attribute + rank. */
  skills: SkillRanks;

  /** Active conditions (Fried, Pinned, Stunned...). */
  conditions: ConditionId[];

  /** Crash saves while Flatlined (0 Hardware Integrity). */
  crashSaves: CrashSaves;
}

const BASE_STARTING_FRAGMENTS = 120;
const MAX_ENGAGEMENT = 100;
/** Advancement Points a new operator starts with. */
export const STARTING_ADVANCEMENT_POINTS = 2;
/** Hardened (Inmate Block): extra maximum Hardware Integrity. */
export const HARDENED_BONUS = 5;
/** Banked AP can never exceed the turn's AP + this. */
export const AP_BANK_BONUS = 1;

/** The operator's origin; older saves fall back to the background's category. */
export function resolveOrigin(backgroundId: BackgroundId, origin?: OriginId): OriginId {
  if (origin === 'offworlder' || origin === 'inmate' || origin === 'volunteer' || origin === 'glitcher') return origin;
  return getBackgroundById(backgroundId)?.category ?? 'inmate';
}

function hasGlitcherAnomalyTrait(origin: OriginId): boolean {
  return origin === 'glitcher';
}

function getStartingDataFragments(origin: OriginId): number {
  if (origin === 'volunteer') {
    return Math.floor(BASE_STARTING_FRAGMENTS * 1.15);
  }
  return BASE_STARTING_FRAGMENTS;
}

export function getStartingEngagement(attributes: CpuAttributes, origin: OriginId): number {
  const base = 25 + getAttributeBonus(attributes.CLOUT) * 8;
  const categoryBonus = origin === 'volunteer' ? 8 : origin === 'glitcher' ? 5 : 0;
  return Math.max(10, Math.min(MAX_ENGAGEMENT, base + categoryBonus));
}

export function getStartingViewerCount(attributes: CpuAttributes, origin: OriginId): number {
  const categoryBonus = origin === 'volunteer' ? 180 : origin === 'glitcher' ? 90 : 0;
  return Math.max(80, 120 + normalizeAttribute(attributes.CLOUT) * 60 + categoryBonus);
}

/** Background skills at rank 2, plus any extra ranks the player chose. */
export function getStartingSkills(backgroundId: BackgroundId, extra?: SkillRanks): SkillRanks {
  const ranks: SkillRanks = {};
  getBackgroundById(backgroundId)?.skills.forEach((id) => { ranks[id] = BACKGROUND_SKILL_RANK; });
  Object.entries(extra ?? {}).forEach(([id, rank]) => {
    const key = id as keyof SkillRanks;
    ranks[key] = (ranks[key] ?? 0) + (rank ?? 0);
  });
  return sanitizeSkillRanks(ranks);
}

function sanitizeSponsorInbox(sponsorInbox?: string[]): string[] {
  if (!sponsorInbox) return [];

  const { isSponsorBlueprint } = require('./Gear') as typeof import('./Gear');
  return sponsorInbox.filter((blueprintId) => isSponsorBlueprint(blueprintId)).slice(0, 12);
}

function getRandomTierOneUtilityItemId(): string | undefined {
  // Tier-1 utility is modeled as non-apex support gear.
  const utilityPool = GEAR_ITEM_DEFS.filter(
    (item) => item.category === 'support' && item.theme !== 'apex',
  );

  if (utilityPool.length === 0) return undefined;
  return utilityPool[Math.floor(Math.random() * utilityPool.length)]?.id;
}

function sanitizeBackgroundId(backgroundId?: BackgroundId): BackgroundId {
  if (backgroundId && getBackgroundById(backgroundId)) {
    return backgroundId;
  }
  return 'enforcer';
}

function createBackgroundStarterLoadout(backgroundId: BackgroundId, origin: OriginId = resolveOrigin(backgroundId)): GearLoadout {
  const backgroundProfile = getBackgroundById(backgroundId);
  const loadout = createStarterLoadout();
  if (!backgroundProfile) {
    return loadout;
  }

  const applyStarterItem = (itemId?: string) => {
    if (!itemId) return;
    const item = getGearItemById(itemId);
    if (!item) return;

    loadout[item.category] = {
      itemId: item.id,
      hardpoints: Array.from({ length: item.hardpoints }, () => null),
    };
  };

  applyStarterItem(backgroundProfile.starterBuildPackage.primaryItemId);
  applyStarterItem(backgroundProfile.starterBuildPackage.secondaryItemId);

  if (origin === 'glitcher') {
    const randomUtilityItemId = getRandomTierOneUtilityItemId();
    applyStarterItem(randomUtilityItemId);
  }

  return loadout;
}

function createBackgroundStarterBlueprintInventory(backgroundId: BackgroundId): BlueprintInventory {
  const backgroundProfile = getBackgroundById(backgroundId);
  if (!backgroundProfile) {
    return createStarterBlueprintInventory();
  }

  const inventory: BlueprintInventory = {};
  backgroundProfile.starterBuildPackage.starterBlueprintIds.forEach((blueprintId) => {
    if (!getBlueprintById(blueprintId)) return;
    inventory[blueprintId] = (inventory[blueprintId] ?? 0) + 1;
  });

  if (Object.keys(inventory).length > 0) {
    return inventory;
  }

  return createStarterBlueprintInventory();
}

function sanitizeBlueprintInventory(
  inventory: BlueprintInventory | undefined,
  fallbackBackgroundId: BackgroundId,
): BlueprintInventory {
  if (!inventory) {
    return createBackgroundStarterBlueprintInventory(fallbackBackgroundId);
  }

  const sanitized: BlueprintInventory = {};
  Object.entries(inventory).forEach(([blueprintId, count]) => {
    if (!getBlueprintById(blueprintId)) return;
    sanitized[blueprintId] = Math.max(0, Math.floor(count));
  });
  return sanitized;
}

function sanitizeBlueprintTradable(
  tradable: Record<string, boolean> | undefined,
  inventory: BlueprintInventory,
): Record<string, boolean> {
  const sanitized: Record<string, boolean> = {};
  Object.keys(inventory).forEach((blueprintId) => {
    sanitized[blueprintId] = tradable?.[blueprintId] ?? true;
  });
  return sanitized;
}

function sanitizeGearLoadout(loadout: GearLoadout | undefined, fallbackBackgroundId: BackgroundId, origin: OriginId): GearLoadout {
  const fallback = createBackgroundStarterLoadout(fallbackBackgroundId, origin);
  if (!loadout) return fallback;

  return GEAR_CATEGORIES.reduce<GearLoadout>((acc, category) => {
    const equipped = loadout[category] ?? fallback[category];
    if (!equipped) {
      acc[category] = null;
      return acc;
    }

    const item = getGearItemById(equipped.itemId);
    if (!item || item.category !== category) {
      acc[category] = fallback[category];
      return acc;
    }

    const hardpoints = Array.from({ length: item.hardpoints }, (_, index) => {
      const maybeBlueprint = equipped.hardpoints[index] ?? null;
      if (!maybeBlueprint) return null;
      const blueprint = getBlueprintById(maybeBlueprint);
      if (!blueprint) return null;
      if (!blueprint.compatibleCategories.includes(category)) return null;
      return blueprint.id;
    });

    acc[category] = {
      itemId: item.id,
      hardpoints,
    };
    return acc;
  }, { ...fallback });
}

// ── Attribute Scale (1–5, 3 is average) ─────────────────────
export const ATTRIBUTE_MIN = 1;
export const ATTRIBUTE_MAX = 5;
export const ATTRIBUTE_AVERAGE = 3;

const ATTRIBUTE_KEYS: (keyof CpuAttributes)[] = ['POWER', 'PING', 'HARDWARE', 'DATA', 'SYSTEM', 'CLOUT'];

/**
 * Put a value on the 1–5 attribute scale.
 * Older saves used a D&D-style scale (10 = average). Anything above the new
 * max is converted first (6 -> 2, 10 -> 3, 13 -> 4, 16 -> 5), then clamped.
 */
export function normalizeAttribute(value: number): number {
  if (!Number.isFinite(value)) return ATTRIBUTE_AVERAGE;
  const converted = value > ATTRIBUTE_MAX ? Math.round((value - 1) / 3) : Math.round(value);
  return Math.max(ATTRIBUTE_MIN, Math.min(ATTRIBUTE_MAX, converted));
}

export function sanitizeAttributes(attributes: Partial<CpuAttributes> | undefined): CpuAttributes {
  return ATTRIBUTE_KEYS.reduce<CpuAttributes>(
    (acc, key) => {
      acc[key] = normalizeAttribute(attributes?.[key] ?? ATTRIBUTE_AVERAGE);
      return acc;
    },
    {
      POWER: ATTRIBUTE_AVERAGE,
      PING: ATTRIBUTE_AVERAGE,
      HARDWARE: ATTRIBUTE_AVERAGE,
      DATA: ATTRIBUTE_AVERAGE,
      SYSTEM: ATTRIBUTE_AVERAGE,
      CLOUT: ATTRIBUTE_AVERAGE,
    },
  );
}

/** Flat bonus relative to an average operator (-2 … +2). Used for damage and broadcast math. */
export function getAttributeBonus(attributeValue: number): number {
  return normalizeAttribute(attributeValue) - ATTRIBUTE_AVERAGE;
}

// ── Derived AP ───────────────────────────────────────────────
export function getBaseAP(systemValue: number): number {
  return 1 + Math.floor(normalizeAttribute(systemValue) / 2);
}

/** Titan Chassis sub-skills the app applies automatically. */
export const REINFORCED_PLATING_ID = 'B5-SUB-1';
export const REDUNDANT_SYSTEMS_ID = 'B5-SUB-2';

export function getHardwareIntegrityMax(attributes: CpuAttributes, origin?: OriginId, unlockedSubSkills: string[] = []): number {
  return 5 + normalizeAttribute(attributes.HARDWARE) * 5
    + (origin === 'inmate' ? HARDENED_BONUS : 0)
    + (unlockedSubSkills.includes(REINFORCED_PLATING_ID) ? 5 : 0);
}

/** Neural Shock threshold: 50%, or 35% with Redundant Systems. */
export function getNeuralShockThreshold(unlockedSubSkills: string[] = []): number {
  return unlockedSubSkills.includes(REDUNDANT_SYSTEMS_ID) ? 0.35 : 0.5;
}

export function getOvershieldMax(attributes: CpuAttributes): number {
  return 16 + normalizeAttribute(attributes.SYSTEM) * 2 + normalizeAttribute(attributes.DATA);
}

/** AP gained at the start of a turn: base AP, minus 1 in Neural Shock. */
export function getStartingAP(character: Pick<Character, 'attributes' | 'neuralShock'>): number {
  const base = getBaseAP(character.attributes.SYSTEM);
  const penalty = character.neuralShock ? 1 : 0;
  return Math.max(0, base - penalty);
}

/** Most AP an operator can hold: base AP + 1. */
export function getMaxBankedAP(character: Pick<Character, 'attributes'>): number {
  return getBaseAP(character.attributes.SYSTEM) + AP_BANK_BONUS;
}

/** AP after the start-of-turn gain: bank + gain, capped. Stunned/Surprised gain nothing; Staggered gains 1 less. */
export function getAPAfterTurnStart(character: Character): number {
  const blocked = character.conditions.includes('stunned') || character.conditions.includes('surprised');
  const staggered = character.conditions.includes('staggered') ? 1 : 0;
  const gain = blocked ? 0 : Math.max(0, getStartingAP(character) - staggered);
  return Math.min(getMaxBankedAP(character), character.currentAP + gain);
}

/** Defense = 10 + PING + armor bonus. */
export function getDefense(character: Pick<Character, 'attributes' | 'gearLoadout'>): number {
  const armorId = character.gearLoadout.defensive?.itemId;
  const bonus = armorId ? getGearRules(armorId).defenseBonus ?? 0 : 0;
  return 10 + normalizeAttribute(character.attributes.PING) + bonus;
}

/** Flatlined at 0 Hardware Integrity. */
export function isFlatlined(character: Pick<Character, 'hardwareIntegrity'>): boolean {
  return character.hardwareIntegrity.current <= 0;
}

// ── Neural Shock check ───────────────────────────────────────
export function checkNeuralShock(hi: VitalLayer, threshold = 0.5): boolean {
  if (hi.max === 0) return false;
  return hi.current / hi.max < threshold;
}

export function hydrateCharacter(character: Character): Character {
  const sanitizedBackgroundId = sanitizeBackgroundId(character.backgroundId);
  const origin = resolveOrigin(sanitizedBackgroundId, character.origin);
  const attributes = sanitizeAttributes(character.attributes);
  const unlockedSubSkills = character.unlockedSubSkills ?? [];
  const hardwareIntegrityMax = getHardwareIntegrityMax(attributes, origin, unlockedSubSkills);
  const overshieldMax = getOvershieldMax(attributes);
  const hardwareIntegrity: VitalLayer = {
    max: hardwareIntegrityMax,
    current: Math.min(hardwareIntegrityMax, Math.max(0, character.hardwareIntegrity.current)),
  };
  const overshield: VitalLayer = {
    max: overshieldMax,
    current: Math.min(overshieldMax, Math.max(0, character.overshield.current)),
  };
  const neuralShock = checkNeuralShock(hardwareIntegrity, getNeuralShockThreshold(unlockedSubSkills));
  const hydrated = {
    ...character,
    attributes,
    hardwareIntegrity,
    overshield,
    neuralShock,
  };
  const maxAP = getMaxBankedAP(hydrated);

  const blueprintInventory = sanitizeBlueprintInventory(character.blueprintInventory, sanitizedBackgroundId);

  return {
    ...hydrated,
    currentAP: Math.min(Math.max(0, character.currentAP), maxAP),
    unlockedNodes: character.unlockedNodes ?? [],
    unlockedSubSkills: character.unlockedSubSkills ?? [],
    gearLoadout: sanitizeGearLoadout(character.gearLoadout, sanitizedBackgroundId, origin),
    blueprintInventory,
    blueprintTradable: sanitizeBlueprintTradable(character.blueprintTradable, blueprintInventory),
    dataFragments: Math.max(0, Math.floor(character.dataFragments ?? 0)),
    engagement: Math.max(0, Math.min(MAX_ENGAGEMENT, Math.floor(character.engagement ?? getStartingEngagement(attributes, origin)))),
    viewerCount: Math.max(0, Math.floor(character.viewerCount ?? getStartingViewerCount(attributes, origin))),
    sponsorInbox: sanitizeSponsorInbox(character.sponsorInbox),
    aiPriorityMarked: character.aiPriorityMarked ?? hasGlitcherAnomalyTrait(origin),
    backgroundId: sanitizedBackgroundId,
    origin,
    skills: character.skills ? sanitizeSkillRanks(character.skills) : getStartingSkills(sanitizedBackgroundId),
    conditions: sanitizeConditions(character.conditions),
    crashSaves: hardwareIntegrity.current > 0 ? { successes: 0, failures: 0 } : sanitizeCrashSaves(character.crashSaves),
  };
}

// ── Factory ─────────────────────────────────────────────────
export interface CreateCharacterOptions {
  /** Defaults to the background's origin; 'offworlder' may use any background. */
  origin?: OriginId;
  /** Extra creation ranks on top of the background's two rank-2 skills. */
  extraSkillRanks?: SkillRanks;
}

export function createCharacter(
  id: string,
  name: string,
  rawAttributes: CpuAttributes,
  advancementPoints = STARTING_ADVANCEMENT_POINTS,
  backgroundId: BackgroundId = 'enforcer',
  options: CreateCharacterOptions = {},
): Character {
  const sanitizedBackgroundId = sanitizeBackgroundId(backgroundId);
  const origin = resolveOrigin(sanitizedBackgroundId, options.origin);
  const attributes = sanitizeAttributes(rawAttributes);
  const starterBlueprintInventory = createBackgroundStarterBlueprintInventory(sanitizedBackgroundId);
  const hardwareIntegrityMax = getHardwareIntegrityMax(attributes, origin);
  const overshieldMax = getOvershieldMax(attributes);
  const hi: VitalLayer = { max: hardwareIntegrityMax, current: hardwareIntegrityMax };
  const os: VitalLayer = { max: overshieldMax, current: overshieldMax };
  const neuralShock = checkNeuralShock(hi);
  const baseAP = getBaseAP(attributes.SYSTEM);
  const startingAP = neuralShock ? Math.max(0, baseAP - 1) : baseAP;

  return {
    id,
    name,
    attributes,
    overshield: os,
    hardwareIntegrity: hi,
    currentAP: startingAP,
    neuralShock,
    advancementPoints,
    unlockedNodes: [],
    unlockedSubSkills: [],
    gearLoadout: createBackgroundStarterLoadout(sanitizedBackgroundId, origin),
    blueprintInventory: starterBlueprintInventory,
    blueprintTradable: sanitizeBlueprintTradable(undefined, starterBlueprintInventory),
    dataFragments: getStartingDataFragments(origin),
    engagement: getStartingEngagement(attributes, origin),
    viewerCount: getStartingViewerCount(attributes, origin),
    sponsorInbox: [],
    aiPriorityMarked: hasGlitcherAnomalyTrait(origin),
    backgroundId: sanitizedBackgroundId,
    origin,
    skills: getStartingSkills(sanitizedBackgroundId, options.extraSkillRanks),
    conditions: [],
    crashSaves: { successes: 0, failures: 0 },
  };
}
