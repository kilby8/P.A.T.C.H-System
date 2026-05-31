// ============================================================
// P.A.T.C.H. SYSTEM — Character Model
// ============================================================

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
 *   baseAP = 2 + Math.floor(systemModifier / 2)
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
}

// ── Attribute Modifier (standard -5 … +5 scale) ─────────────
export function getModifier(attributeValue: number): number {
  return Math.floor((attributeValue - 10) / 2);
}

// ── Derived AP ───────────────────────────────────────────────
export function getBaseAP(systemValue: number): number {
  const mod = getModifier(systemValue);
  return 2 + Math.floor(mod / 2);
}

export function getHardwareIntegrityMax(attributes: CpuAttributes): number {
  const hardwareModifier = getModifier(attributes.HARDWARE);
  return 10 + attributes.HARDWARE + hardwareModifier * 2;
}

export function getOvershieldMax(attributes: CpuAttributes): number {
  const dataModifier = getModifier(attributes.DATA);
  return 15 + attributes.SYSTEM + dataModifier;
}

export function getStartingAP(character: Character): number {
  const base = getBaseAP(character.attributes.SYSTEM);
  const penalty = character.neuralShock ? 1 : 0;
  return Math.max(0, base - penalty);
}

// ── Neural Shock check ───────────────────────────────────────
export function checkNeuralShock(hi: VitalLayer): boolean {
  if (hi.max === 0) return false;
  return hi.current / hi.max < 0.5;
}

export function hydrateCharacter(character: Character): Character {
  const hardwareIntegrityMax = getHardwareIntegrityMax(character.attributes);
  const overshieldMax = getOvershieldMax(character.attributes);
  const hardwareIntegrity: VitalLayer = {
    max: hardwareIntegrityMax,
    current: Math.min(hardwareIntegrityMax, Math.max(0, character.hardwareIntegrity.current)),
  };
  const overshield: VitalLayer = {
    max: overshieldMax,
    current: Math.min(overshieldMax, Math.max(0, character.overshield.current)),
  };
  const neuralShock = checkNeuralShock(hardwareIntegrity);
  const hydrated = {
    ...character,
    hardwareIntegrity,
    overshield,
    neuralShock,
  };
  const maxAP = getStartingAP(hydrated);

  return {
    ...hydrated,
    currentAP: Math.min(Math.max(0, character.currentAP), maxAP),
    unlockedNodes: character.unlockedNodes ?? [],
    unlockedSubSkills: character.unlockedSubSkills ?? [],
  };
}

// ── Factory ─────────────────────────────────────────────────
export function createCharacter(
  id: string,
  name: string,
  attributes: CpuAttributes,
  advancementPoints = 0,
): Character {
  const hardwareIntegrityMax = getHardwareIntegrityMax(attributes);
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
  };
}
