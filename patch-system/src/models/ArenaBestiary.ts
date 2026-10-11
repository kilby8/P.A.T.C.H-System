// ============================================================
// P.A.T.C.H. SYSTEM — Arena Bestiary / GM Population Guide
// ============================================================

export type EnemyRole =
  | 'Melee Swarmer'
  | 'Ranged Harasser'
  | 'Skirmisher'
  | 'Support'
  | 'Tank'
  | 'Sapper'
  | 'Fodder'
  | 'Area Denier'
  | 'Variable'
  | 'Elite'
  | 'Garnish'
  | 'Squelch Pulse'
  | 'Neural-Sever'
  | 'Data Spillage'
  | 'Blink Strike'
  | 'Path Blocking'
  | 'Aura Buff'
  | 'Healer'
  | 'Anti-Cheat Tank'
  | 'Fiscal Aggression'
  | 'Magnetic Repulsion'
  | 'LAG Induction'
  | 'AP Drain'
  | 'Explosive Trap'
  | 'GLITCH Status'
  | 'Ranged AOE'
  | 'AC Recovery'
  | 'Harpoon Drag'
  | 'Low-HP Hunter'
  | 'LAG Zone'
  | 'STUN/Ads'
  | 'Ignore Overshield'
  | 'Item Loss'
  | 'Reinforcement Call'
  | 'Damage Reflection'
  | 'Data Weakness'
  | 'Stealth / Bypass'
  | 'FRY Status'
  | 'Position Swap'
  | 'Loot Carrier'
  | 'Boss / Ad-Barrage'
  | 'AC Drain'
  | 'Ally/Sponsor Gear';

export interface BestiaryEntity {
  id: number;
  name: string;
  role: EnemyRole;
  description: string;
}

export interface SpectacleForceEntry {
  templateId: number;
  count: number;
}

export interface SpectacleBracket {
  key: 'DULL_BROADCAST' | 'ACTIVE_ENGAGEMENT' | 'PRIME_TIME_SURGE';
  label: string;
  scoreRange: [number, number];
  force: SpectacleForceEntry[];
  modifiers: string[];
}

export const SPECTACLE_BRACKETS: SpectacleBracket[] = [
  {
    key: 'DULL_BROADCAST',
    label: 'Dull Broadcast',
    scoreRange: [1, 2],
    force: [
      { templateId: 11, count: 1 },
      { templateId: 14, count: 2 },
      { templateId: 1, count: 3 },
    ],
    modifiers: [],
  },
  {
    key: 'ACTIVE_ENGAGEMENT',
    label: 'Active Engagement',
    scoreRange: [3, 4],
    force: [
      { templateId: 13, count: 1 },
      { templateId: 12, count: 1 },
      { templateId: 3, count: 2 },
      { templateId: 2, count: 2 },
    ],
    modifiers: [],
  },
  {
    key: 'PRIME_TIME_SURGE',
    label: 'Prime-Time Surge',
    scoreRange: [5, 6],
    force: [
      { templateId: 11, count: 1 },
      { templateId: 13, count: 1 },
      { templateId: 12, count: 2 },
      { templateId: 10, count: 1 },
    ],
    modifiers: ['Damage double effect'],
  },
];

export const ARENA_BESTIARY: BestiaryEntity[] = [
  { id: 1, name: 'Glitch-Scrapper', role: 'Melee Swarmer', description: 'Human form with jagged, rusted metal plates bolted to limbs; they twitch uncontrollably.' },
  { id: 2, name: 'Net-Junkie', role: 'Ranged Harasser', description: 'Frayed cables; mismatched, buzzing weapons that spark with excess current.' },
  { id: 3, name: 'Debt-Dodger', role: 'Skirmisher', description: 'Lean, nervous figures wearing lightweight, minimalist gear for high-speed evasion.' },
  { id: 4, name: 'Stream-Whore', role: 'Support', description: 'Neon-reflective fabrics and strobing LEDs; designed for high-definition feeds.' },
  { id: 5, name: 'Rig-Breaker', role: 'Tank', description: 'Hulking silhouette in heavy industrial plating; moves with a heavy, hydraulic thud.' },
  { id: 6, name: 'Code-Leech', role: 'Sapper', description: 'Pale-skinned with interface ports on their neck; they avoid eye contact while tracking data.' },
  { id: 7, name: 'The Desperate', role: 'Fodder', description: 'Shivering, gaunt figures with no armor; they fight with jagged glass or metal shanks.' },
  { id: 8, name: 'The Martyr', role: 'Area Denier', description: 'Heavily bandaged; their chest is rigged with a volatile, glowing core that pulses violently.' },
  { id: 9, name: 'The Traitor', role: 'Variable', description: 'Looks like a standard player, but eyes flicker with an unsettling, synthetic red strobe.' },
  { id: 10, name: 'Corp Shill', role: 'Elite', description: 'Pristine, high-end armor branded with sponsor logos; unnerving, polished confidence.' },
  { id: 11, name: 'Auditor', role: 'Garnish', description: 'Humanoids in tailored suits; flat, HD screen faces display rotating currency symbols.' },
  { id: 12, name: 'Censor', role: 'Squelch Pulse', description: 'Small, polished chrome spheres; they track targets with an aggressive, laser-red eye.' },
  { id: 13, name: 'Liquidator', role: 'Neural-Sever', description: 'Faceless figures in long, dark trench coats made of dense, tangled data-cables.' },
  { id: 14, name: 'Blight-Drone', role: 'Data Spillage', description: 'Spherical tanks on magnetic cushions; they leave a trail of oily, flickering pixel-rot.' },
  { id: 15, name: 'Wall-Stalker', role: 'Blink Strike', description: 'Translucent human figures that lag in and out of reality.' },
  { id: 16, name: 'Firewall-Brute', role: 'Path Blocking', description: 'Towering, static-filled barriers of light that pulse with forbidden data.' },
  { id: 17, name: 'Ad-Revenue-Bot', role: 'Aura Buff', description: 'Covered in digital screens cycling through aggressive commercial advertisements.' },
  { id: 18, name: 'System-Janitor', role: 'Healer', description: 'Clunky machines with sweeping appendages designed to absorb corrupted data.' },
  { id: 19, name: 'Mainframe-Guardian', role: 'Anti-Cheat Tank', description: '8-foot-tall monolith of shifting steel; hovers silently without traditional limbs.' },
  { id: 20, name: 'Rent-Enforcer', role: 'Fiscal Aggression', description: 'Ornate gold armor; carries a heavy, industrial-sized ledger as a blunt weapon.' },
  { id: 21, name: 'Blight-Drone (Pusher)', role: 'Magnetic Repulsion', description: 'Wide-bodied drone with rotating magnetic plates that repel physical objects.' },
  { id: 22, name: 'Blight-Drone (Screamer)', role: 'LAG Induction', description: 'Multi-pronged sphere that vibrates; emits a static-filled, high-pitched shriek.' },
  { id: 23, name: 'Wall-Stalker (Variant)', role: 'Blink Strike', description: 'Shimmering, translucent figure that only solidifies for a split second before striking.' },
  { id: 24, name: 'Firewall-Brute', role: 'Path Blocking', description: 'Towering barrier of light; pulses with forbidden data.' },
  { id: 25, name: 'Data-Wraith', role: 'AP Drain', description: 'Flickering, semi-transparent human form; looks like a corrupt video file.' },
  { id: 26, name: 'Logic-Bomb', role: 'Explosive Trap', description: 'Metallic geometric cube; shifts surface texture and pulses with warning light.' },
  { id: 27, name: 'Error-Core', role: 'GLITCH Status', description: 'Cube of shifting non-Euclidean geometry; surface looks like a missing-texture checkerboard.' },
  { id: 28, name: 'Mainframe-Guardian', role: 'Tank', description: '8-foot-tall monolith of shifting steel plating; hovers silently.' },
  { id: 29, name: 'Ad-Blast Cannon', role: 'Ranged AOE', description: 'Stationary tripod turret; covered in flashing LCD screens blaring audio ads.' },
  { id: 30, name: 'Greed-Spirit', role: 'AC Recovery', description: 'Ghostly figure shrouded in digital gold dust; constantly sheds currency symbols.' },
  { id: 31, name: 'Debt-Collector', role: 'Harpoon Drag', description: 'Hulking figure in a ragged business suit; drags a heavy, glowing spiked harpoon.' },
  { id: 32, name: 'Pixel-Hound', role: 'Low-HP Hunter', description: 'Fast, quadrupedal robot made of low-resolution voxels; tracks targets with a digital growl.' },
  { id: 33, name: 'Render-Glitched', role: 'LAG Zone', description: 'Humanoid with missing limbs and skin; shows empty wireframe architecture underneath.' },
  { id: 34, name: 'Ad-Drone', role: 'STUN/Ads', description: 'Small drone with a megaphone; screams pre-recorded corporate slogans.' },
  { id: 35, name: 'Data-Leech', role: 'AP Drain', description: 'Parasitic slug-like creature made of tangled fiber-optic cables.' },
  { id: 36, name: 'Code-Executioner', role: 'Ignore Overshield', description: 'Towering masked figure; wields a massive scythe of solidified binary code.' },
  { id: 37, name: 'Memory-Wiper', role: 'Item Loss', description: 'Faceless entity in white cloth; thin, elongated fingers that dissolve objects.' },
  { id: 38, name: 'Security-Node', role: 'Reinforcement Call', description: 'Pulsing red pillar embedded in the floor; emits a rhythmic, siren-like ping.' },
  { id: 39, name: 'Proxy-Agent', role: 'Explosive Trap', description: 'Perfect copy of a player character, but movements are too smooth and mechanical.' },
  { id: 40, name: 'Feedback-Loop', role: 'Damage Reflection', description: 'Mirrored metallic orb; reflects the image of anyone standing before it with distortions.' },
  { id: 41, name: 'Null-Sector-Guard', role: 'Data Weakness', description: 'Heavily armored brute glowing with molten-orange light; etched with complex vents.' },
  { id: 42, name: 'System-Janitor', role: 'Healer', description: 'Clunky utilitarian machine with long, sweeping appendages.' },
  { id: 43, name: 'Ad-Revenue-Bot', role: 'Aura Buff', description: 'Covered in digital screens cycling through aggressive commercial advertisements.' },
  { id: 44, name: 'Ghost-Protocol-Unit', role: 'Stealth / Bypass', description: 'Sleek, featureless black robot; no visible sensors or weapons until it strikes.' },
  { id: 45, name: 'Neural-Burner', role: 'FRY Status', description: 'Thin, frantic human in a damaged rig; leaking thick smoke from skull ports.' },
  { id: 46, name: 'Glitch-Witch', role: 'Position Swap', description: 'Ethereal figure draped in color-shifting data ribbons; stares with hollow, glowing eyes.' },
  { id: 47, name: 'Cache-Hider', role: 'Loot Carrier', description: 'Hunchbacked creature; carries a massive glowing backpack overflowing with treasures.' },
  { id: 48, name: 'System-Overlord', role: 'Boss / Ad-Barrage', description: 'Massive wall of screens and cables; speaks in a booming, multi-layered voice.' },
  { id: 49, name: 'Rent-Enforcer', role: 'AC Drain', description: 'Polished gold armor; carries a heavy, industrial-sized ledger as a weapon.' },
  { id: 50, name: 'Last-Subscriber', role: 'Ally/Sponsor Gear', description: 'Frantic civilian in a team jersey; armed with high-end tech they cannot use.' },
];

// ── Combat profiles ─────────────────────────────────────────
export type ThreatTier = 'Fodder' | 'Support' | 'Standard' | 'Tank' | 'Elite' | 'Boss';

export interface TierStats {
  integrity: number;
  ap: number;
  init: number;
  defense: number;
  /** Attack roll: dice plus flat bonus against an operator's Defense. */
  attackDice: number;
  attackBonus: number;
  damage: string;
  /** Target operators roll against (attribute + best related skill) to resist its effects. */
  saveTarget: number;
  /** Dice it rolls to resist an operator's ability (15 for tier 1-2, 18 for tier 3). */
  saveDice: number;
  /** Cost in the encounter budget (4 per operator for a solid fight). */
  threat: number;
}

export const TIER_STATS: Record<ThreatTier, TierStats> = {
  Fodder:   { integrity: 6,  ap: 1, init: 8,  defense: 13, attackDice: 3, attackBonus: 2, damage: '1d4',   saveTarget: 11, saveDice: 3, threat: 1 },
  Support:  { integrity: 8,  ap: 2, init: 10, defense: 14, attackDice: 3, attackBonus: 2, damage: '1d4',   saveTarget: 11, saveDice: 3, threat: 2 },
  Standard: { integrity: 10, ap: 2, init: 11, defense: 15, attackDice: 4, attackBonus: 1, damage: '1d6',   saveTarget: 13, saveDice: 4, threat: 2 },
  Tank:     { integrity: 18, ap: 3, init: 9,  defense: 17, attackDice: 4, attackBonus: 2, damage: '1d8',   saveTarget: 15, saveDice: 4, threat: 4 },
  Elite:    { integrity: 16, ap: 3, init: 14, defense: 18, attackDice: 5, attackBonus: 1, damage: '1d8+2', saveTarget: 15, saveDice: 5, threat: 4 },
  Boss:     { integrity: 28, ap: 4, init: 16, defense: 20, attackDice: 6, attackBonus: 0, damage: '2d6+2', saveTarget: 17, saveDice: 6, threat: 8 },
};

/** Integrity by role keyword (the app's long-standing rule). */
export function getMobBaseIntegrity(role: string): number {
  if (role.includes('Boss')) return 28;
  if (role.includes('Tank')) return 18;
  if (role.includes('Elite')) return 16;
  if (role.includes('Fodder') || role.includes('Low-HP Hunter') || role.includes('Garnish')) return 6;
  if (role.includes('Support') || role.includes('Healer') || role.includes('Sapper')) return 8;
  return 10;
}

/** AP by role keyword; the Pixel-Hound (Low-HP Hunter) keeps 2 AP. */
export function getMobBaseAP(role: string): number {
  if (role.includes('Boss')) return 4;
  if (role.includes('Elite') || role.includes('Tank')) return 3;
  if (role.includes('Fodder') || role.includes('Garnish')) return 1;
  return 2;
}

export function getThreatTier(role: string): ThreatTier {
  const integrity = getMobBaseIntegrity(role);
  if (integrity === 28) return 'Boss';
  if (integrity === 18) return 'Tank';
  if (integrity === 16) return 'Elite';
  if (integrity === 6) return 'Fodder';
  if (integrity === 8) return 'Support';
  return 'Standard';
}

export interface MobAbility { name: string; text: string }

export interface EntityDetail {
  kind: string;
  move: string;
  abilities: MobAbility[];
  tactics: string;
}

/** Same-name variants get a label so the table can tell them apart. */
export const ENTITY_DISPLAY_NAMES: Record<number, string> = {
  19: 'Mainframe-Guardian (Anti-Cheat)',
  28: 'Mainframe-Guardian (Monolith)',
  20: 'Rent-Enforcer (Collector)',
  49: 'Rent-Enforcer (Garnishee)',
};

/** App entries that duplicate another entry's stat block. */
export const ENTITY_SAME_AS: Record<number, number> = { 24: 16, 42: 18, 43: 17 };

export const ENTITY_DETAILS: Record<number, EntityDetail> = {
  1: { kind: "Human, glitched", move: "6 m", abilities: [{ name: "Swarm", text: "Gets +1 die on attacks for each other Glitch-Scrapper adjacent to its target (max +2)." }, { name: "Twitch", text: "Its first attack each encounter has disadvantage: it can’t stop shaking." }], tactics: "Surround the nearest operator; never retreat." },
  2: { kind: "Human, wired", move: "6 m", abilities: [{ name: "Sparking Spray", text: "Ranged attack, 20 m. On a hit with 5+ flair, the target makes a DATA save (15) or is Glitched." }], tactics: "Hang back behind cover and spray whoever is fighting the Scrappers." },
  3: { kind: "Human", move: "8 m", abilities: [{ name: "Skip Town", text: "After it attacks, it may Move 6 m for free." }, { name: "Hard to Pin Down", text: "Ranged attacks against it have disadvantage on any round it has moved." }], tactics: "Hit, run, repeat. Goes after isolated operators." },
  4: { kind: "Human, broadcast rig", move: "6 m", abilities: [{ name: "Strobe Feed", text: "1 AP. Until its next turn, allies within 10 m get +1 die on attacks." }, { name: "Spotlight", text: "1 AP, 20 m. One operator is Marked until the end of its next turn." }], tactics: "Stay behind the line; Spotlight whoever is hurting the most." },
  5: { kind: "Human, industrial plating", move: "5 m", abilities: [{ name: "Hydraulic Slam", text: "2 AP. Melee attack; on a hit the target also makes a POWER save (17) or is knocked Prone." }, { name: "Heavy Plate", text: "Reduce physical damage from each hit by 1." }], tactics: "Walk into the middle and start slamming." },
  6: { kind: "Human, interface ports", move: "6 m", abilities: [{ name: "Siphon", text: "1 AP, 10 m, no attack roll. The target loses 1d4 Overshield and the Leech regains that much Integrity." }, { name: "Plant Leak", text: "2 AP. Seed a 2 m patch of pixel-rot (DATA save 15 or Glitched) on its square." }], tactics: "Never melee. Siphons from range, retreats, leaves rot behind." },
  7: { kind: "Human", move: "6 m", abilities: [{ name: "Nothing to Lose", text: "When reduced to 0 Integrity, it makes one last attack immediately, for free." }], tactics: "Throw them at the operators in waves." },
  8: { kind: "Human, volatile core", move: "6 m", abilities: [{ name: "Core Breach", text: "When defeated, or as a 2 AP action, it explodes: 2d6 damage to everything within 3 m (PING save 15 for half). The Martyr is destroyed." }, { name: "Pulse Warning", text: "Its core glows; an operator can spot an imminent breach with Perception (15)." }], tactics: "Run straight at the biggest group of operators." },
  9: { kind: "Human?, synthetic", move: "6 m", abilities: [{ name: "Familiar Face", text: "It looks like a contestant. Until an operator sees through it (SYSTEM + Insight, 15, 1 AP), that operator can’t target it." }, { name: "Copycat", text: "It uses the attack and damage of one operator it can see (choose each turn)." }], tactics: "Walk up \"friendly\", then knife the healer." },
  10: { kind: "Human, sponsor armor", move: "6 m", abilities: [{ name: "Sponsored Armor", text: "The first hit against it each round deals 2 less damage." }, { name: "Brand Protection", text: "An operator who damages it on camera loses 1 Engagement; the sponsor is not amused." }, { name: "Endorsed Strike", text: "2 AP. Attack with +2 dice; on a hit the target is Staggered." }], tactics: "Fight the highest-Engagement operator. It wants the camera." },
  11: { kind: "Synthetic, HD screen face", move: "6 m", abilities: [{ name: "Assess", text: "1 AP, 20 m. The target is Marked until the end of the encounter." }, { name: "Line Item", text: "Each time a Marked operator is hit, they lose 2 Data Fragments." }], tactics: "Stays at the edge, Assessing. Flees at the first hit." },
  12: { kind: "Machine, chrome sphere", move: "6 m (hover)", abilities: [{ name: "Squelch Pulse", text: "2 AP. Operators within 5 m make a SYSTEM save (15) or are Staggered, and can’t use Callout or speak on comms until their next turn." }], tactics: "Float into the middle and pulse every round." },
  13: { kind: "Network entity, cable coat", move: "6 m", abilities: [{ name: "Neural-Sever", text: "Its hits deal +2 damage to Hardware Integrity. If the target is in Neural Shock, it must also make a HARDWARE save (15) or be Stunned." }], tactics: "Hunts operators who are already hurt." },
  14: { kind: "Machine, drone", move: "6 m (magnetic)", abilities: [{ name: "Pixel-Rot Trail", text: "Every space it leaves becomes pixel-rot for the rest of the encounter: an operator entering it makes a DATA save (15) or is Glitched." }], tactics: "Circle the arena, spreading rot." },
  15: { kind: "Network entity, lagging", move: "6 m", abilities: [{ name: "Lag Blink", text: "1 AP. Teleport up to 10 m; its next attack this turn has advantage." }, { name: "Out of Sync", text: "Opportunity-style reactions (Counter) against it have disadvantage." }], tactics: "Blink behind the backline, strike, blink away." },
  16: { kind: "Network entity, light barrier", move: "0 m (stationary)", abilities: [{ name: "Wall of Light", text: "Blocks a 4 m line; nothing passes through it. Operators that start a turn adjacent take 1d4." }, { name: "Forbidden Data", text: "Its melee hits make the target Fried (HARDWARE save 15)." }], tactics: "Placed to split the squad or block the exit. Destroy it to pass." },
  17: { kind: "Machine, ad screens", move: "5 m", abilities: [{ name: "Ad Break Aura", text: "Allies within 5 m get +1 to attack totals and damage. Operators within 5 m have disadvantage on Stealth." }], tactics: "Stay behind the heaviest ally and keep the aura up." },
  18: { kind: "Machine, utility", move: "5 m", abilities: [{ name: "Sweep", text: "1 AP. One ally within 3 m regains 1d6+2 Integrity." }, { name: "Absorb Corruption", text: "1 AP. Remove Glitched or Fried from one ally within 3 m." }], tactics: "Keep the Tank or Elite alive. Kill it first." },
  19: { kind: "Machine, monolith", move: "5 m (hover)", abilities: [{ name: "Anti-Cheat", text: "It can target Stealthed operators within 10 m. Any operator who uses an Apex or sponsor-grade blueprint effect within 10 m is Marked." }, { name: "Ban Hammer", text: "2 AP. Melee attack; on a hit the target is Pinned (POWER save 17 resists)." }], tactics: "Stand in front of the objective and punish anything flashy." },
  20: { kind: "Human, gold armor", move: "6 m", abilities: [{ name: "Ledger Slam", text: "On a hit, the target also loses 5 Data Fragments." }, { name: "Past Due", text: "+1 die on attacks against an operator with fewer than 50 fragments." }], tactics: "Goes for the poorest operator, loudly." },
  21: { kind: "Machine, drone", move: "6 m (magnetic)", abilities: [{ name: "Repulse", text: "1 AP. Every operator within 5 m is pushed 4 m away (POWER save 15 resists)." }, { name: "Magnetic Field", text: "Ranged kinetic attacks against it have disadvantage." }], tactics: "Shove operators off ledges and into hazards." },
  22: { kind: "Machine, drone", move: "6 m (hover)", abilities: [{ name: "Shriek", text: "2 AP. Operators within 10 m make a SYSTEM save (15) or are Lagged." }], tactics: "Shriek on round one, then every other round." },
  23: { kind: "Network entity, lagging", move: "6 m", abilities: [{ name: "Lag Blink", text: "1 AP. Teleport up to 10 m; its next attack this turn has advantage." }, { name: "Split-Second Solid", text: "Attacks against it have disadvantage except on the turn it attacked." }], tactics: "As the Wall-Stalker, but harder to pin down." },
  25: { kind: "Network entity, corrupt video", move: "6 m (phasing)", abilities: [{ name: "AP Drain", text: "On a hit, the target is Staggered and the Wraith gains 1 AP." }, { name: "Phasing", text: "Moves through walls and Firewall-Brutes." }], tactics: "Drain the operator with the most AP." },
  26: { kind: "Machine, trap", move: "0 m (stationary)", abilities: [{ name: "Logic Trigger", text: "When an operator ends a Move within 2 m, it explodes: 2d6 damage to everything within 3 m (PING save 15 for half)." }, { name: "Disarm", text: "An adjacent operator can spend 1 AP on DATA + Hacking (17) to disarm it." }], tactics: "Place it where operators will want to stand." },
  27: { kind: "Network entity, broken geometry", move: "4 m", abilities: [{ name: "Missing Texture", text: "Its hits make the target Glitched (no save)." }, { name: "Non-Euclidean", text: "Roll a d6 when an attack hits it: on a 1 the attack phases through and misses." }], tactics: "Drifts toward whoever has the best gear." },
  28: { kind: "Machine, monolith", move: "5 m (hover)", abilities: [{ name: "Monolith", text: "Reduce damage from each hit by 2." }, { name: "Hold the Line", text: "Operators can’t Move past it within 2 m without a PING + Acrobatics check (15)." }], tactics: "Plants itself in a chokepoint." },
  29: { kind: "Machine, turret", move: "0 m (stationary)", abilities: [{ name: "Ad Blast", text: "2 AP, 40 m. Everything in a 3 m radius takes 1d6 (PING save 15 for half)." }, { name: "Overridable", text: "A Hacking Suite Override or Crownbreaker Key turns it on its owners." }], tactics: "Bombard clusters from its perch." },
  30: { kind: "Network entity, gold dust", move: "6 m (hover)", abilities: [{ name: "Collect", text: "At the start of each of its turns it regains 1d4 Integrity, unless it is Glitched." }, { name: "Hoard", text: "Whoever defeats it gains 2d6 Data Fragments." }], tactics: "Floats out of reach and heals; bait for greedy operators." },
  31: { kind: "Human, harpoon", move: "6 m", abilities: [{ name: "Harpoon", text: "1 AP, 15 m. Ranged attack; on a hit the target is dragged 6 m to it and Pinned (POWER save 15 resists)." }], tactics: "Drag operators out of cover and into the swarm." },
  32: { kind: "Machine, voxel hound", move: "10 m", abilities: [{ name: "Scent of Blood", text: "+2 dice on attacks against an operator in Neural Shock or with 0 Overshield." }, { name: "Pack Runner", text: "Moves 10 m instead of 6." }], tactics: "Ignore the healthy. Chase the bleeding." },
  33: { kind: "Network entity, wireframe", move: "4 m", abilities: [{ name: "Lag Field", text: "An operator who starts a turn within 5 m makes a SYSTEM save (15) or is Lagged." }], tactics: "Slowly walk into the squad’s backline." },
  34: { kind: "Machine, drone", move: "8 m (hover)", abilities: [{ name: "Slogan Blast", text: "1 AP, 10 m. The target makes a SYSTEM save (15) or is Stunned. Each operator can only be Stunned by Ad-Drones once per encounter." }], tactics: "Fly over the action and stun the scariest operator." },
  35: { kind: "Network entity, parasite", move: "4 m", abilities: [{ name: "Latch", text: "On a hit, it attaches: the target is Staggered at the start of each turn until it’s pulled off (1 AP, POWER + Athletics 15) or destroyed." }], tactics: "Latch onto the first operator in reach." },
  36: { kind: "Network entity, executioner", move: "6 m", abilities: [{ name: "Binary Scythe", text: "Reach 2 m. Its hits bypass Overshield." }, { name: "Execute", text: "Against a Flatlined operator, each hit counts as two crash-save failures." }], tactics: "Recommended: promote to Elite or Boss for a finale." },
  37: { kind: "Network entity, white cloth", move: "6 m", abilities: [{ name: "Dissolve", text: "2 AP. Melee attack; on a hit, one item the target carries stops working until the end of the encounter (DATA save 15 negates; a Weighted Club is immune)." }], tactics: "Strip the operator who relies on one big item." },
  38: { kind: "Machine, pillar", move: "0 m (stationary)", abilities: [{ name: "Siren", text: "2 AP. One The Desperate (#7) appears adjacent; at most 3 at a time." }, { name: "Jammed", text: "A Signal Jammer’s Jam or Comms Blackout stops the Siren until its next turn." }], tactics: "Keeps calling until destroyed." },
  39: { kind: "Synthetic, operator copy", move: "6 m", abilities: [{ name: "Perfect Copy", text: "It looks exactly like one operator; telling which is real takes SYSTEM + Insight (15)." }, { name: "Detonate", text: "When defeated, or as a 2 AP action, it explodes: 2d6 within 3 m (PING save 15 for half)." }], tactics: "Walks up beside the squad pretending to be one of them." },
  40: { kind: "Machine, mirror orb", move: "4 m (hover)", abilities: [{ name: "Mirror", text: "When hit by an attack, the attacker takes half the damage dealt, rounded down." }], tactics: "Floats between operators and their targets." },
  41: { kind: "Human, molten armor", move: "5 m", abilities: [{ name: "Molten Plate", text: "Reduce physical damage from each hit by 3." }, { name: "Data Weakness", text: "Takes double damage from energy attacks and from support-gear attacks." }], tactics: "Wade in; let the squad figure out the weakness." },
  44: { kind: "Machine, black chassis", move: "8 m", abilities: [{ name: "Ghost Start", text: "Begins every encounter Stealthed." }, { name: "First Strike", text: "Its first attack from Stealth bypasses Overshield." }, { name: "Re-Hide", text: "1 AP. Hide again (its Stealth total is 4d6+4)." }], tactics: "Strike from nowhere, vanish, repeat." },
  45: { kind: "Human, burning rig", move: "6 m", abilities: [{ name: "Overheat", text: "Its hits make the target Fried (HARDWARE save 15)." }, { name: "Smoke Ports", text: "Ranged attacks through the 3 m around it have disadvantage." }], tactics: "Charge the closest operator, trailing smoke." },
  46: { kind: "Network entity, data ribbons", move: "6 m (hover)", abilities: [{ name: "Swap", text: "1 AP, 15 m. Swap the positions of any two creatures it can see; an unwilling operator makes a SYSTEM save (15) to resist." }], tactics: "Put the squad’s healer next to the Martyr." },
  47: { kind: "Creature, loot pack", move: "8 m", abilities: [{ name: "Run for It", text: "It doesn’t attack. If it reaches an arena exit (about 3 rounds), it escapes." }, { name: "Jackpot", text: "If defeated, roll one extra sector loot and add 20 fragments to the payout." }], tactics: "Flee. The whole encounter becomes a chase." },
  48: { kind: "Machine, wall of screens", move: "0 m (stationary)", abilities: [{ name: "Ad Barrage", text: "2 AP, once per round. Every operator who can see it makes a SYSTEM save (17) or is Stunned. An operator Stunned by Ad Barrage is immune to it for the rest of the encounter." }, { name: "Commercial Break", text: "3 AP, once per round. Two Ad-Drones (#34) appear." }, { name: "Multi-Layered Voice", text: "At half Integrity it gains 1 AP per turn for the rest of the fight." }], tactics: "The finale. Protect it with drones and let it scream." },
  49: { kind: "Human, gold armor", move: "6 m", abilities: [{ name: "Garnish Wages", text: "On a hit, it steals 10 Data Fragments from the target." }, { name: "Repossessed", text: "When defeated, it drops everything it stole." }], tactics: "Grab the money and run for the edge of the arena." },
  50: { kind: "Human, superfan", move: "6 m", abilities: [{ name: "Not Hostile", text: "A civilian with sponsor gear they can’t use. Mobs target it." }, { name: "Grateful Fan", text: "If it survives the encounter, it hands the nearest operator a random sponsor-grade blueprint." }, { name: "Dead on Camera", text: "If it dies on camera, every operator loses 3 Engagement." }], tactics: "An escort objective in disguise." },
};

const SAVE_RX = /\b(POWER|PING|HARDWARE|DATA|SYSTEM|CLOUT) save (?:\((\d+)\)|(\d+))/g;

export interface MobProfile {
  id: number;
  name: string;
  role: EnemyRole;
  description: string;
  tier: ThreatTier;
  integrity: number;
  ap: number;
  init: number;
  defense: number;
  attack: string;
  damage: string;
  saveTarget: number;
  saveDice: number;
  threat: number;
  kind: string;
  move: string;
  abilities: MobAbility[];
  tactics: string;
  sameAs?: number;
}

/** Full stat block for an entity. Ability save targets follow its tier. */
export function getMobProfile(templateId: number): MobProfile | undefined {
  const entity = getBestiaryEntityById(templateId);
  if (!entity) return undefined;
  const sameAs = ENTITY_SAME_AS[templateId];
  const detail = ENTITY_DETAILS[sameAs ?? templateId];
  const tier = getThreatTier(entity.role);
  const stats = TIER_STATS[tier];
  const fix = (text: string) => text.replace(SAVE_RX, (_m, attr: string, paren?: string) => (paren ? `${attr} save (${stats.saveTarget})` : `${attr} save ${stats.saveTarget}`));
  return {
    id: entity.id,
    name: ENTITY_DISPLAY_NAMES[entity.id] ?? entity.name,
    role: entity.role,
    description: entity.description,
    tier,
    integrity: getMobBaseIntegrity(entity.role),
    ap: getMobBaseAP(entity.role),
    init: stats.init,
    defense: stats.defense,
    attack: `${stats.attackDice}d6${stats.attackBonus ? `+${stats.attackBonus}` : ''}`,
    damage: stats.damage,
    saveTarget: stats.saveTarget,
    saveDice: stats.saveDice,
    threat: stats.threat,
    kind: detail?.kind ?? '',
    move: detail?.move ?? '6 m',
    abilities: (detail?.abilities ?? []).map((a) => ({ name: a.name, text: fix(a.text) })),
    tactics: detail?.tactics ?? '',
    sameAs,
  };
}

export function getSpectacleBracket(score: number): SpectacleBracket {
  const normalized = Math.max(1, Math.min(6, score));
  return SPECTACLE_BRACKETS.find((bracket) => normalized >= bracket.scoreRange[0] && normalized <= bracket.scoreRange[1]) ?? SPECTACLE_BRACKETS[0];
}

export function getBestiaryEntityByName(name: string): BestiaryEntity | undefined {
  return ARENA_BESTIARY.find((entity) => entity.name.toLowerCase() === name.toLowerCase());
}

export function getBestiaryEntityById(templateId: number): BestiaryEntity | undefined {
  return ARENA_BESTIARY.find((entity) => entity.id === templateId);
}
