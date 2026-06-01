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
