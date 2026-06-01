export type GearCategory = 'offensive' | 'defensive' | 'support';
export type GearTheme = 'foundation' | 'tactical' | 'apex';
export type SectorBand = 1 | 2 | 3 | 4 | 5;
export type BlueprintDropRule = 'standard' | 'named' | 'legendary';

export interface GearItemDef {
  id: string;
  name: string;
  category: GearCategory;
  theme: GearTheme;
  hardpoints: number;
  functionality: string;
}

export interface BlueprintDef {
  id: string;
  name: string;
  theme: GearTheme;
  compatibleCategories: GearCategory[];
  effect: string;
  dropRule: BlueprintDropRule;
  sponsorGrade?: boolean;
  streamTrait?: string;
  sectorLocks?: SectorBand[];
  uniqueDrop?: boolean;
}

export interface EquippedGear {
  itemId: string;
  hardpoints: Array<string | null>;
}

export type GearLoadout = Record<GearCategory, EquippedGear | null>;
export type BlueprintInventory = Record<string, number>;

export interface BlueprintMarket {
  prices: Record<string, number>;
  availability: Record<string, number>;
  themeGates: Record<GearTheme, boolean>;
  lootEnabled: Record<string, boolean>;
  weightMultipliers: Record<string, number>;
}

export interface BlueprintTradeLogEntry {
  id: string;
  at: string;
  type: 'trade' | 'inject' | 'install' | 'purchase' | 'loot' | 'award' | 'override';
  blueprintId?: string;
  amount: number;
  fragmentDelta?: number;
  fromCharacterId?: string;
  toCharacterId?: string;
  note?: string;
}

export const GEAR_CATEGORIES: GearCategory[] = ['offensive', 'defensive', 'support'];
export const GEAR_THEMES: GearTheme[] = ['foundation', 'tactical', 'apex'];

export const CATEGORY_LABELS: Record<GearCategory, string> = {
  offensive: 'OFFENSIVE',
  defensive: 'DEFENSIVE',
  support: 'SUPPORT',
};

export const THEME_LABELS: Record<GearTheme, string> = {
  foundation: 'FOUNDATION',
  tactical: 'TACTICAL',
  apex: 'APEX',
};

export const GEAR_ITEM_DEFS: GearItemDef[] = [
  {
    id: 'i-weighted-club',
    name: 'Weighted Club',
    category: 'offensive',
    theme: 'foundation',
    hardpoints: 1,
    functionality: 'Blunt force with high durability.',
  },
  {
    id: 'i-iron-spear',
    name: 'Iron Spear',
    category: 'offensive',
    theme: 'foundation',
    hardpoints: 1,
    functionality: 'Reach advantage and piercing damage.',
  },
  {
    id: 'i-recurve-bow',
    name: 'Recurve Bow',
    category: 'offensive',
    theme: 'foundation',
    hardpoints: 1,
    functionality: 'Mid-range kinetic damage delivery.',
  },
  {
    id: 'i-tactical-carbine',
    name: 'Tactical Carbine',
    category: 'offensive',
    theme: 'tactical',
    hardpoints: 2,
    functionality: 'Versatile platform that accepts sights and suppressors.',
  },
  {
    id: 'i-hard-light-lance',
    name: 'Hard-Light Lance',
    category: 'offensive',
    theme: 'apex',
    hardpoints: 3,
    functionality: 'Energy-based strikes that ignore non-energy cover.',
  },
  {
    id: 'i-thick-hide-tunic',
    name: 'Thick Hide Tunic',
    category: 'defensive',
    theme: 'foundation',
    hardpoints: 1,
    functionality: 'Basic protection from environmental hazards.',
  },
  {
    id: 'i-kevlar-vest',
    name: 'Kevlar Vest',
    category: 'defensive',
    theme: 'tactical',
    hardpoints: 2,
    functionality: 'Mitigation against kinetic damage.',
  },
  {
    id: 'i-kinetic-shielding',
    name: 'Kinetic Shielding',
    category: 'defensive',
    theme: 'apex',
    hardpoints: 3,
    functionality: 'Repels high-velocity projectiles.',
  },
  {
    id: 'i-multi-tool',
    name: 'Multi-Tool',
    category: 'support',
    theme: 'foundation',
    hardpoints: 1,
    functionality: 'Essential for basic repairs and scavenging.',
  },
  {
    id: 'i-field-radio',
    name: 'Field Radio',
    category: 'support',
    theme: 'tactical',
    hardpoints: 2,
    functionality: 'Secure team communication.',
  },
  {
    id: 'i-signal-jammer',
    name: 'Signal Jammer',
    category: 'support',
    theme: 'apex',
    hardpoints: 3,
    functionality: 'Disables local electronic communication.',
  },
];

export const BLUEPRINT_DEFS: BlueprintDef[] = [
  {
    id: 'bp-weighted-reinforced-frame',
    name: 'Weighted/Reinforced Frame',
    theme: 'foundation',
    compatibleCategories: ['offensive'],
    effect: 'Increases durability of Foundation-tier weapons.',
    dropRule: 'standard',
  },
  {
    id: 'bp-precision-sight',
    name: 'Precision Sight',
    theme: 'tactical',
    compatibleCategories: ['offensive'],
    effect: 'Adds +1 accuracy and range to Tactical offensive items.',
    dropRule: 'standard',
  },
  {
    id: 'bp-essence-capacitor',
    name: 'Essence-Capacitor',
    theme: 'apex',
    compatibleCategories: ['offensive'],
    effect: 'Allows weapons to store and release high-energy bursts.',
    dropRule: 'standard',
  },
  {
    id: 'bp-padding-reinforcement',
    name: 'Padding/Reinforcement',
    theme: 'foundation',
    compatibleCategories: ['defensive'],
    effect: 'Increases mitigation for hide or textile armor.',
    dropRule: 'standard',
  },
  {
    id: 'bp-kinetic-plating',
    name: 'Kinetic Plating',
    theme: 'tactical',
    compatibleCategories: ['defensive'],
    effect: 'Adds resistance to bullet and impact damage.',
    dropRule: 'standard',
  },
  {
    id: 'bp-phase-shifter',
    name: 'Phase-Shifter',
    theme: 'apex',
    compatibleCategories: ['defensive'],
    effect: 'Grants a chance to negate incoming energy damage entirely.',
    dropRule: 'standard',
  },
  {
    id: 'bp-extended-battery-capacity',
    name: 'Extended Battery/Capacity',
    theme: 'foundation',
    compatibleCategories: ['support'],
    effect: 'Increases usage duration of support items.',
    dropRule: 'standard',
  },
  {
    id: 'bp-signal-booster',
    name: 'Signal Booster',
    theme: 'tactical',
    compatibleCategories: ['support'],
    effect: 'Increases communication and scanning range.',
    dropRule: 'standard',
  },
  {
    id: 'bp-hacking-suite',
    name: 'Hacking Suite',
    theme: 'apex',
    compatibleCategories: ['support'],
    effect: 'Allows remote override of hostile turrets or terminals.',
    dropRule: 'standard',
  },
  {
    id: 'bp-ghostline-scope',
    name: 'Ghostline Scope',
    theme: 'tactical',
    compatibleCategories: ['offensive'],
    effect: 'Named optic package that grants precision through dense obscurants.',
    dropRule: 'named',
    sectorLocks: [3],
  },
  {
    id: 'bp-bulwark-sigil',
    name: 'Bulwark Sigil',
    theme: 'apex',
    compatibleCategories: ['defensive'],
    effect: 'Named ward lattice that redirects a burst of incoming force.',
    dropRule: 'named',
    sectorLocks: [4],
  },
  {
    id: 'bp-crownbreaker-daemon-key',
    name: 'Crownbreaker Daemon Key',
    theme: 'apex',
    compatibleCategories: ['support'],
    effect: 'Legendary intrusion key enabling one controlled hostile subsystem breach.',
    dropRule: 'legendary',
    sectorLocks: [5],
    uniqueDrop: true,
  },
  {
    id: 'bp-neon-tracer',
    name: 'Neon Tracer',
    theme: 'tactical',
    compatibleCategories: ['offensive'],
    effect: 'Enhances projectile visibility for stylized shot tracking.',
    dropRule: 'standard',
    sponsorGrade: true,
    streamTrait: '+10% engagement gain when offensive pressure is maintained.',
  },
  {
    id: 'bp-kill-feed-display',
    name: 'Kill-Feed Display',
    theme: 'tactical',
    compatibleCategories: ['support'],
    effect: 'Projects real-time combat telemetry overlays into the public feed.',
    dropRule: 'standard',
    sponsorGrade: true,
    streamTrait: '+5% fragment payout from sponsored appearances.',
  },
  {
    id: 'bp-holographic-cloak',
    name: 'Holographic Cloak',
    theme: 'apex',
    compatibleCategories: ['defensive'],
    effect: 'Generates visual decoys and distortion around the operator silhouette.',
    dropRule: 'standard',
    sponsorGrade: true,
    streamTrait: '+20% engagement spike after a close-call evade.',
  },
  {
    id: 'bp-signature-finisher',
    name: 'Signature Finisher',
    theme: 'apex',
    compatibleCategories: ['offensive'],
    effect: 'Unlocks a branded execution sequence with custom camera priority.',
    dropRule: 'standard',
    sponsorGrade: true,
    streamTrait: 'Massive viewer spike when closing an encounter on-camera.',
  },
];

const itemMap = new Map(GEAR_ITEM_DEFS.map((item) => [item.id, item]));
const blueprintMap = new Map(BLUEPRINT_DEFS.map((bp) => [bp.id, bp]));

export function getGearItemById(itemId: string): GearItemDef | undefined {
  return itemMap.get(itemId);
}

export function getBlueprintById(blueprintId: string): BlueprintDef | undefined {
  return blueprintMap.get(blueprintId);
}

export function createStarterLoadout(): GearLoadout {
  return {
    offensive: { itemId: 'i-weighted-club', hardpoints: [null] },
    defensive: { itemId: 'i-thick-hide-tunic', hardpoints: [null] },
    support: { itemId: 'i-multi-tool', hardpoints: [null] },
  };
}

export function createStarterBlueprintInventory(): BlueprintInventory {
  return {
    'bp-weighted-reinforced-frame': 1,
    'bp-padding-reinforcement': 1,
    'bp-extended-battery-capacity': 1,
  };
}

export function createDefaultBlueprintMarket(): BlueprintMarket {
  const prices: Record<string, number> = {};
  const availability: Record<string, number> = {};
  const lootEnabled: Record<string, boolean> = {};
  const weightMultipliers: Record<string, number> = {};

  BLUEPRINT_DEFS.forEach((blueprint) => {
    prices[blueprint.id] = blueprint.sponsorGrade
      ? 0
      : blueprint.theme === 'foundation'
        ? 40
        : blueprint.theme === 'tactical'
          ? 90
          : 180;
    availability[blueprint.id] = blueprint.sponsorGrade
      ? 0
      : blueprint.uniqueDrop
        ? 1
        : blueprint.theme === 'foundation'
          ? 12
          : blueprint.theme === 'tactical'
            ? 6
            : 2;
    lootEnabled[blueprint.id] = !blueprint.sponsorGrade;
    weightMultipliers[blueprint.id] = blueprint.dropRule === 'legendary' ? 0.25 : blueprint.dropRule === 'named' ? 0.6 : 1;
  });

  return {
    prices,
    availability,
    themeGates: {
      foundation: true,
      tactical: true,
      apex: false,
    },
    lootEnabled,
    weightMultipliers,
  };
}

export function getCompatibleBlueprints(category: GearCategory): BlueprintDef[] {
  return BLUEPRINT_DEFS.filter((blueprint) => blueprint.compatibleCategories.includes(category));
}

export function isSponsorBlueprint(blueprintId: string): boolean {
  return blueprintMap.get(blueprintId)?.sponsorGrade ?? false;
}

export function getSponsorBlueprints(): BlueprintDef[] {
  return BLUEPRINT_DEFS.filter((blueprint) => blueprint.sponsorGrade);
}

export function getThemeEngagementRequirement(theme: GearTheme): number {
  if (theme === 'apex') return 65;
  if (theme === 'tactical') return 35;
  return 0;
}
