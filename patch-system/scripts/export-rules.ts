// ============================================================
// Export the app's rule data as JSON for the rulebook PDFs.
// The books in /rulebook are generated from this file, so the
// app and the books can't drift apart.
//
//   npx tsx scripts/export-rules.ts > ../rulebook/data/rules.json
// ============================================================
import { ARCHETYPE_NODES, getNodePrerequisiteText } from '../src/models/ArchetypeNodes';
import { ARENA_BESTIARY, SPECTACLE_BRACKETS, TIER_STATS, getMobProfile } from '../src/models/ArenaBestiary';
import { BACKGROUND_PROFILES, ORIGIN_PROFILES } from '../src/models/Backgrounds';
import {
  ATTRIBUTE_COST,
  SKILL_RANK_COST,
  AP_BANK_BONUS,
  HARDENED_BONUS,
  STARTING_ADVANCEMENT_POINTS,
  createCharacter,
  getBaseAP,
  getDefense,
  getHardwareIntegrityMax,
  getOvershieldMax,
  getStartingEngagement,
  getStartingViewerCount,
} from '../src/models/Character';
import { CONDITION_DEFS } from '../src/models/Conditions';
import {
  BLUEPRINT_DEFS,
  GEAR_ITEM_DEFS,
  GEAR_RULES,
  createDefaultBlueprintMarket,
  getThemeEngagementRequirement,
} from '../src/models/Gear';
import { DIFFICULTY_LADDER } from '../src/models/Resolution';
import { SAVE_SKILLS, SKILL_DEFS } from '../src/models/Skills';
import { SECTOR_LOOT_TABLE } from '../src/utils/sectorLoot';

// Fixed dice for the Glitcher support roll so exports are stable.
Math.random = () => 0.01;

const attrs = (v: number) => ({ POWER: v, PING: v, HARDWARE: v, DATA: v, SYSTEM: v, CLOUT: v });

const backgrounds = BACKGROUND_PROFILES.map((bg) => {
  const c = createCharacter('x', 'x', attrs(3), STARTING_ADVANCEMENT_POINTS, bg.id);
  return {
    id: bg.id,
    name: bg.name,
    category: bg.category,
    focus: bg.buildFocus,
    skills: bg.skills,
    flavor: bg.flavor,
    notes: bg.starterBuildPackage.notes,
    loadout: (['offensive', 'defensive', 'support'] as const).map((k) => GEAR_ITEM_DEFS.find((i) => i.id === c.gearLoadout[k]?.itemId)?.name),
    blueprints: Object.keys(c.blueprintInventory).map((id) => BLUEPRINT_DEFS.find((b) => b.id === id)?.name),
    fragments: c.dataFragments,
  };
});

const derived = [1, 2, 3, 4, 5].map((v) => ({
  value: v,
  bonus: v - 3,
  hardware: getHardwareIntegrityMax(attrs(v)),
  hardwareInmate: getHardwareIntegrityMax(attrs(v), 'inmate'),
  ap: getBaseAP(v),
}));

const broadcast = (['inmate', 'volunteer', 'glitcher', 'offworlder'] as const).map((origin) => ({
  origin,
  byClout: [1, 2, 3, 4, 5].map((clout) => ({
    engagement: getStartingEngagement({ ...attrs(3), CLOUT: clout }, origin),
    viewers: getStartingViewerCount({ ...attrs(3), CLOUT: clout }, origin),
  })),
}));

const rook = createCharacter('rook', 'Rook', { POWER: 2, PING: 4, HARDWARE: 3, DATA: 2, SYSTEM: 4, CLOUT: 3 }, STARTING_ADVANCEMENT_POINTS, 'neon-runner', {
  extraSkillRanks: { marksmanship: 2 },
});

const market = createDefaultBlueprintMarket();

const out = {
  constants: {
    startingAdvancementPoints: STARTING_ADVANCEMENT_POINTS,
    hardenedBonus: HARDENED_BONUS,
    apBankBonus: AP_BANK_BONUS,
    skillRankCost: SKILL_RANK_COST,
    attributeCost: ATTRIBUTE_COST,
    overshieldRange: [getOvershieldMax(attrs(1)), getOvershieldMax(attrs(5))],
    ladder: DIFFICULTY_LADDER.map((s) => ({ label: s.label, target: s.target })),
    engagementGates: { tactical: getThemeEngagementRequirement('tactical'), apex: getThemeEngagementRequirement('apex') },
  },
  skills: SKILL_DEFS,
  saveSkills: SAVE_SKILLS,
  origins: ORIGIN_PROFILES,
  backgrounds,
  derived,
  broadcast,
  rook: {
    hardware: rook.hardwareIntegrity.max,
    overshield: rook.overshield.max,
    ap: getBaseAP(rook.attributes.SYSTEM),
    defense: getDefense(rook),
    engagement: rook.engagement,
    viewers: rook.viewerCount,
    fragments: rook.dataFragments,
    skills: rook.skills,
  },
  gear: GEAR_ITEM_DEFS.map((item) => ({ ...item, rules: GEAR_RULES[item.id] })),
  blueprints: BLUEPRINT_DEFS.map((bp) => ({ ...bp, price: market.prices[bp.id], stock: market.availability[bp.id] })),
  themeGates: market.themeGates,
  nodes: ARCHETYPE_NODES.map((node) => ({ ...node, prerequisite: getNodePrerequisiteText(node) })),
  tiers: TIER_STATS,
  bestiary: ARENA_BESTIARY.map((e) => getMobProfile(e.id)),
  spectacle: SPECTACLE_BRACKETS,
  sectorLoot: SECTOR_LOOT_TABLE,
  conditions: CONDITION_DEFS,
};

process.stdout.write(JSON.stringify(out, null, 1));
