export type BackgroundCategory = 'inmate' | 'volunteer' | 'glitcher';
export type CoreAttribute = 'POWER' | 'PING' | 'HARDWARE' | 'DATA' | 'SYSTEM' | 'CLOUT';

import { getBlueprintById, getGearItemById } from './Gear';

export type BackgroundId =
  | 'enforcer'
  | 'infiltrator'
  | 'cyber-syndicate-tech'
  | 'riot-breaker'
  | 'solitary-drifter'
  | 'scrap-scavver'
  | 'media-star'
  | 'corporate-dropout'
  | 'street-medic'
  | 'neon-runner'
  | 'severed-synth'
  | 'glitched-ghost'
  | 'code-hunter'
  | 'system-drift-nomad'
  | 'memory-broker';

export interface BackgroundProfile {
  id: BackgroundId;
  name: string;
  category: BackgroundCategory;
  sharedCoreTrait: string;
  buildFocus: CoreAttribute;
  proficiency: string;
  starterGear: string[];
  starterBuildPackage: {
    primaryItemId: string;
    secondaryItemId?: string;
    starterBlueprintIds: string[];
    notes: string[];
  };
  flavor: string;
}

export const BACKGROUND_CATEGORY_LABELS: Record<BackgroundCategory, string> = {
  inmate: 'INMATE BLOCK',
  volunteer: 'SLUM DISTRIKT VOLUNTEER',
  glitcher: 'OFF-GRID GLITCHER',
};

export const BACKGROUND_PROFILES: BackgroundProfile[] = [
  {
    id: 'enforcer',
    name: 'The Enforcer',
    category: 'inmate',
    sharedCoreTrait: 'Hardened: +5 Max HP, Advantage against Stun/Pin.',
    buildFocus: 'POWER',
    proficiency: 'POWER (Athletics & Intimidation)',
    starterGear: [
      'Weighted Club',
      'Thick Hide Tunic',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-weighted-club',
      secondaryItemId: 'i-thick-hide-tunic',
      starterBlueprintIds: ['bp-weighted-reinforced-frame', 'bp-padding-reinforcement'],
      notes: ['Frontline bruiser package tuned for close pressure and durability.'],
    },
    flavor: 'Cartel muscle and pit fighters who survived by crushing competition.',
  },
  {
    id: 'infiltrator',
    name: 'The Infiltrator',
    category: 'inmate',
    sharedCoreTrait: 'Hardened: +5 Max HP, Advantage against Stun/Pin.',
    buildFocus: 'PING',
    proficiency: 'PING (Stealth & Sleight of Hand)',
    starterGear: [
      'Recurve Bow',
      'Field Radio',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-recurve-bow',
      secondaryItemId: 'i-field-radio',
      starterBlueprintIds: ['bp-precision-sight', 'bp-signal-booster'],
      notes: ['Skirmish and scouting profile with tactical intel support.'],
    },
    flavor: 'Corporate thieves and ghost agents specialized in bypassing high-security sectors.',
  },
  {
    id: 'cyber-syndicate-tech',
    name: 'The Cyber-Syndicate Tech',
    category: 'inmate',
    sharedCoreTrait: 'Hardened: +5 Max HP, Advantage against Stun/Pin.',
    buildFocus: 'DATA',
    proficiency: 'Data (System Override & Security Cracking)',
    starterGear: [
      'Multi-Tool',
      'Field Radio',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-multi-tool',
      secondaryItemId: 'i-field-radio',
      starterBlueprintIds: ['bp-extended-battery-capacity', 'bp-signal-booster'],
      notes: ['Control-and-intrusion package focused on support infrastructure.'],
    },
    flavor: 'Digital vault raiders convicted for trying to drain megacorp credit reserves.',
  },
  {
    id: 'riot-breaker',
    name: 'The Riot-Breaker',
    category: 'inmate',
    sharedCoreTrait: 'Hardened: +5 Max HP, Advantage against Stun/Pin.',
    buildFocus: 'HARDWARE',
    proficiency: 'HARDWARE (Endurance & Heavy Weapons)',
    starterGear: [
      'Iron Spear',
      'Kevlar Vest',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-iron-spear',
      secondaryItemId: 'i-kevlar-vest',
      starterBlueprintIds: ['bp-kinetic-plating', 'bp-padding-reinforcement'],
      notes: ['Durable breach profile with defensive mitigation baseline.'],
    },
    flavor: 'A corrupt max-security guard or rebel riot leader forged in prison block warfare.',
  },
  {
    id: 'solitary-drifter',
    name: 'The Solitary Drifter',
    category: 'inmate',
    sharedCoreTrait: 'Hardened: +5 Max HP, Advantage against Stun/Pin.',
    buildFocus: 'SYSTEM',
    proficiency: 'SYSTEM (Perception & Environmental Resistance)',
    starterGear: [
      'Recurve Bow',
      'Thick Hide Tunic',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-recurve-bow',
      secondaryItemId: 'i-thick-hide-tunic',
      starterBlueprintIds: ['bp-padding-reinforcement'],
      notes: ['Survival package optimized for attrition and hazard routes.'],
    },
    flavor: 'Years in isolation tuned your senses to server-hum and environmental signal drift.',
  },
  {
    id: 'scrap-scavver',
    name: 'The Scrap-Scavver',
    category: 'volunteer',
    sharedCoreTrait: 'Premium Account: +15% starting Arena Credits.',
    buildFocus: 'DATA',
    proficiency: 'DATA (Tech Scavenging & Fabrication)',
    starterGear: [
      'Multi-Tool',
      'Recurve Bow',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-multi-tool',
      secondaryItemId: 'i-recurve-bow',
      starterBlueprintIds: ['bp-extended-battery-capacity', 'bp-weighted-reinforced-frame'],
      notes: ['Economy-efficient build with fabrication and salvage pressure.'],
    },
    flavor: 'Yard engineers who survive by extracting chips, copper, and code from urban wreckage.',
  },
  {
    id: 'media-star',
    name: 'The Media Star',
    category: 'volunteer',
    sharedCoreTrait: 'Premium Account: +15% starting Arena Credits.',
    buildFocus: 'CLOUT',
    proficiency: 'CLOUT (Crowd Appeal & Deception)',
    starterGear: [
      'Tactical Carbine',
      'Field Radio',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-tactical-carbine',
      secondaryItemId: 'i-field-radio',
      starterBlueprintIds: ['bp-precision-sight', 'bp-signal-booster'],
      notes: ['Showmanship package focused on range control and comm advantage.'],
    },
    flavor: 'Arena influencers and stunt icons who play for viewers as much as victory.',
  },
  {
    id: 'corporate-dropout',
    name: 'The Corporate Dropout',
    category: 'volunteer',
    sharedCoreTrait: 'Premium Account: +15% starting Arena Credits.',
    buildFocus: 'DATA',
    proficiency: 'DATA (Investigation & Corporate Intel)',
    starterGear: [
      'Tactical Carbine',
      'Multi-Tool',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-tactical-carbine',
      secondaryItemId: 'i-multi-tool',
      starterBlueprintIds: ['bp-precision-sight', 'bp-extended-battery-capacity'],
      notes: ['Intel analyst package with tactical offense and utility throughput.'],
    },
    flavor: 'Former analysts and accountants who entered the arena to escape debt and silence.',
  },
  {
    id: 'street-medic',
    name: 'The Street Medic',
    category: 'volunteer',
    sharedCoreTrait: 'Premium Account: +15% starting Arena Credits.',
    buildFocus: 'SYSTEM',
    proficiency: 'SYSTEM (Biometrics & Medicine)',
    starterGear: [
      'Multi-Tool',
      'Kevlar Vest',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-multi-tool',
      secondaryItemId: 'i-kevlar-vest',
      starterBlueprintIds: ['bp-extended-battery-capacity', 'bp-padding-reinforcement'],
      notes: ['Support-healer baseline with improved sustain and protection.'],
    },
    flavor: 'Back-alley cyber-docs who volunteered to repay stolen supply chains.',
  },
  {
    id: 'neon-runner',
    name: 'The Neon Runner',
    category: 'volunteer',
    sharedCoreTrait: 'Premium Account: +15% starting Arena Credits.',
    buildFocus: 'PING',
    proficiency: 'PING (Acrobatics & Navigation)',
    starterGear: [
      'Recurve Bow',
      'Field Radio',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-recurve-bow',
      secondaryItemId: 'i-field-radio',
      starterBlueprintIds: ['bp-precision-sight', 'bp-signal-booster'],
      notes: ['High-mobility scout package for objective routing and kiting.'],
    },
    flavor: 'Rooftop data couriers hardened by high-speed traversal through hostile city grids.',
  },
  {
    id: 'severed-synth',
    name: 'The Severed Synth',
    category: 'glitcher',
    sharedCoreTrait: 'Data Anomalies: Start with random tier-1 utility item; hostile AI prioritize you.',
    buildFocus: 'HARDWARE',
    proficiency: 'HARDWARE (Structural Integrity & Logic)',
    starterGear: [
      'Iron Spear',
      'Kevlar Vest',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-iron-spear',
      secondaryItemId: 'i-kevlar-vest',
      starterBlueprintIds: ['bp-padding-reinforcement'],
      notes: ['Glitcher bruiser profile with defensive core and anomaly aggro pressure.'],
    },
    flavor: 'Escaped android labor units hiding in arena traffic after severing corporate control.',
  },
  {
    id: 'glitched-ghost',
    name: 'The Glitched Ghost',
    category: 'glitcher',
    sharedCoreTrait: 'Data Anomalies: Start with random tier-1 utility item; hostile AI prioritize you.',
    buildFocus: 'SYSTEM',
    proficiency: 'SYSTEM (Aura Manipulation & Insight)',
    starterGear: [
      'Field Radio',
      'Recurve Bow',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-field-radio',
      secondaryItemId: 'i-recurve-bow',
      starterBlueprintIds: ['bp-signal-booster'],
      notes: ['Evasive anomaly package with recon and displacement style play.'],
    },
    flavor: 'Server crash fragments left your avatar unstable, trailing artifacts and phantom echoes.',
  },
  {
    id: 'code-hunter',
    name: 'The Code Hunter',
    category: 'glitcher',
    sharedCoreTrait: 'Data Anomalies: Start with random tier-1 utility item; hostile AI prioritize you.',
    buildFocus: 'PING',
    proficiency: 'PING (Tracking & Ranged Analysis)',
    starterGear: [
      'Tactical Carbine',
      'Field Radio',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-tactical-carbine',
      secondaryItemId: 'i-field-radio',
      starterBlueprintIds: ['bp-precision-sight'],
      notes: ['Bounty-tracker package for target acquisition and ranged pressure.'],
    },
    flavor: 'Rogue bounty operatives who track glitched entities in unmonitored sectors.',
  },
  {
    id: 'system-drift-nomad',
    name: 'The System-Drift Nomad',
    category: 'glitcher',
    sharedCoreTrait: 'Data Anomalies: Start with random tier-1 utility item; hostile AI prioritize you.',
    buildFocus: 'POWER',
    proficiency: 'POWER (Survival & Animal Handling/Bot Taming)',
    starterGear: [
      'Iron Spear',
      'Thick Hide Tunic',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-iron-spear',
      secondaryItemId: 'i-thick-hide-tunic',
      starterBlueprintIds: ['bp-weighted-reinforced-frame'],
      notes: ['Wasteland skirmisher package for close-range survival engagements.'],
    },
    flavor: 'Dead-zone wanderers adapted to regions where AI resource allocation collapses.',
  },
  {
    id: 'memory-broker',
    name: 'The Memory Broker',
    category: 'glitcher',
    sharedCoreTrait: 'Data Anomalies: Start with random tier-1 utility item; hostile AI prioritize you.',
    buildFocus: 'CLOUT',
    proficiency: 'CLOUT (Persuasion & Forgery)',
    starterGear: [
      'Field Radio',
      'Tactical Carbine',
    ],
    starterBuildPackage: {
      primaryItemId: 'i-field-radio',
      secondaryItemId: 'i-tactical-carbine',
      starterBlueprintIds: ['bp-signal-booster', 'bp-precision-sight'],
      notes: ['Social-controller package balancing comm leverage and ranged threat.'],
    },
    flavor: 'Smugglers of deleted memory packets and unpatched code sold to the highest bidder.',
  },
];

const backgroundMap = new Map(BACKGROUND_PROFILES.map((profile) => [profile.id, profile]));

export function getBackgroundById(backgroundId: BackgroundId) {
  return backgroundMap.get(backgroundId);
}

export function validateBackgroundBuildPackages(): string[] {
  const issues: string[] = [];

  BACKGROUND_PROFILES.forEach((profile) => {
    if (!getGearItemById(profile.starterBuildPackage.primaryItemId)) {
      issues.push(`${profile.id}: missing primary item ${profile.starterBuildPackage.primaryItemId}`);
    }

    if (
      profile.starterBuildPackage.secondaryItemId
      && !getGearItemById(profile.starterBuildPackage.secondaryItemId)
    ) {
      issues.push(`${profile.id}: missing secondary item ${profile.starterBuildPackage.secondaryItemId}`);
    }

    profile.starterBuildPackage.starterBlueprintIds.forEach((blueprintId) => {
      if (!getBlueprintById(blueprintId)) {
        issues.push(`${profile.id}: missing starter blueprint ${blueprintId}`);
      }
    });
  });

  return issues;
}
