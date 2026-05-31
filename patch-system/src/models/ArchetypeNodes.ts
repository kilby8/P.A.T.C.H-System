// ============================================================
// P.A.T.C.H. SYSTEM — Archetype Node Definitions
// 30 nodes across 3 archetypes + 3 overlap zones
// ============================================================

export type ArchetypeZone =
  | 'BRUTE'       // PWR / HDW
  | 'GHOST'       // PNG / SYS
  | 'SPECIALIST'  // DAT / CLT
  | 'BRUTE_GHOST'
  | 'BRUTE_SPECIALIST'
  | 'GHOST_SPECIALIST';

export interface ArchetypeNode {
  id: string;
  name: string;
  zone: ArchetypeZone;
  tier: 1 | 2 | 3;
  description: string;
  subSkills: SubSkill[];
}

export interface SubSkill {
  id: string;
  name: string;
  description: string;
  apCost: number;
  creditCost: number;
  advancementCost: number;
  prerequisites?: string;
}

interface RawSubSkill {
  name: string;
  description: string;
  apCost?: number;
  creditCost?: number;
  advancementCost?: number;
  prerequisites?: string;
}

interface RawArchetypeNode extends Omit<ArchetypeNode, 'subSkills'> {
  subSkills: RawSubSkill[];
}

function createSubSkill(nodeId: string, tier: 1 | 2 | 3, index: number, subSkill: RawSubSkill): SubSkill {
  return {
    id: `${nodeId}-SUB-${index + 1}`,
    apCost: subSkill.apCost ?? tier + index,
    creditCost: subSkill.creditCost ?? tier * 250 + index * 150,
    advancementCost: subSkill.advancementCost ?? 1,
    ...subSkill,
  };
}

const RAW_ARCHETYPE_NODES: RawArchetypeNode[] = [
  // ── BRUTE (PWR / HDW) — 10 nodes ──────────────────────────
  { id: 'B1', name: 'Iron Frame', zone: 'BRUTE', tier: 1, description: 'Reinforce biological chassis for increased trauma resistance.', subSkills: [
    { name: 'Plated Dermis', description: 'Sub-dermal alloy weave reduces all incoming physical damage by 1.' },
    { name: 'Stress Hardening', description: 'Each hit suffered this encounter grants +1 damage resistance until end of round.' },
  ]},
  { id: 'B2', name: 'Kinetic Driver', zone: 'BRUTE', tier: 1, description: 'Hydraulic limb enhancement boosts melee output.', subSkills: [
    { name: 'Power Strike', description: 'Spend 1 extra AP on a melee attack to double its base damage die.' },
    { name: 'Ground Pound', description: 'Slam attack forces all adjacent targets to pass a HARDWARE check or fall prone.' },
  ]},
  { id: 'B3', name: 'Overclock Shell', zone: 'BRUTE', tier: 1, description: 'Short-burst physical overclock at cost of heat buildup.', subSkills: [
    { name: 'Burst Mode', description: 'Gain +2 AP this turn. Next turn start with -1 AP due to thermal cooldown.' },
    { name: 'Heat Vent', description: 'Release stored heat as a cone of scorching exhaust, dealing 1d4 to adjacent enemies.' },
  ]},
  { id: 'B4', name: 'Bulwark Protocol', zone: 'BRUTE', tier: 2, description: 'Active defensive stance that absorbs frontal damage.', subSkills: [
    { name: 'Shield Wall', description: 'Spend 1 AP to halve all incoming damage from a single frontal source this round.' },
    { name: 'Absorb and Counter', description: 'When damage is halved by Shield Wall, immediately deal 1d6 back to the attacker.' },
  ]},
  { id: 'B5', name: 'Titan Chassis', zone: 'BRUTE', tier: 2, description: 'Maximum Hardware Integrity cap increase.', subSkills: [
    { name: 'Reinforced Plating', description: 'Permanently increase maximum Hardware Integrity by 5.' },
    { name: 'Redundant Systems', description: 'Neural Shock threshold drops to 35% — you survive longer before throttling.' },
  ]},
  { id: 'B6', name: 'Seismic Slam', zone: 'BRUTE', tier: 2, description: 'Area-of-effect ground strike disrupts enemy positioning.', subSkills: [
    { name: 'Shockwave', description: 'Ground slam radiates 2m; enemies in range make a POWER save or lose 1 AP next turn.' },
    { name: 'Tremor Pulse', description: 'Shockwave also disables vehicle and drone movement for 1 round in the radius.' },
  ]},
  { id: 'B7', name: 'Neural Anchor', zone: 'BRUTE', tier: 3, description: 'Resist Neural Shock triggers at extreme damage thresholds.', subSkills: [
    { name: 'Shock Suppressor', description: 'Once per encounter, ignore a Neural Shock trigger entirely.' },
    { name: 'Pain Nullifier', description: 'While in Neural Shock, the -1 AP penalty is negated for 2 rounds.' },
  ]},
  { id: 'B8', name: 'War Engine', zone: 'BRUTE', tier: 3, description: 'Sustained combat mode — reduced AP cost for physical actions.', subSkills: [
    { name: 'Combat Flow', description: 'All melee attacks cost 1 less AP (minimum 1) while War Engine is active.' },
    { name: 'Momentum', description: 'Each consecutive melee hit in a turn grants +1 damage on the next.' },
  ]},
  { id: 'B9', name: 'Fortress Mode', zone: 'BRUTE', tier: 3, description: 'Locks movement in exchange for massive defense.', subSkills: [
    { name: 'Static Defense', description: 'While stationary, reduce all incoming damage by 3.' },
    { name: 'Turret Stance', description: 'Gain an extra reaction each round, usable only for defensive counters.' },
  ]},
  { id: 'B10', name: 'Apex Predator', zone: 'BRUTE', tier: 3, description: 'Execute weakened targets for immediate AP refund.', subSkills: [
    { name: 'Execution', description: 'Finishing blow on a target at or below 25% HW refunds 2 AP immediately.' },
    { name: 'Trophy Kill', description: 'Each execution this encounter grants +1 to all POWER checks until end of session.' },
  ]},

  // ── GHOST (PNG / SYS) — 10 nodes ──────────────────────────
  { id: 'G1', name: 'Stealth Protocol', zone: 'GHOST', tier: 1, description: 'Reduce electronic and optical detection signature.', subSkills: [
    { name: 'Optical Cloak', description: 'Bend light around your chassis for 1 round; enemies must pass a PING check to target you.' },
    { name: 'Ping Mask', description: 'Suppress all active radio and sonar pings emanating from your gear for 2 rounds.' },
  ]},
  { id: 'G2', name: 'Neural Reflex', zone: 'GHOST', tier: 1, description: 'Enhanced reaction time provides bonus dodge window.', subSkills: [
    { name: 'Reflex Dodge', description: 'Once per round, spend 1 AP as a free reaction to halve incoming ranged damage.' },
    { name: 'Counter-Frame', description: 'After a successful dodge, your next melee attack gains +2 dice.' },
  ]},
  { id: 'G3', name: 'Ghost Walk', zone: 'GHOST', tier: 1, description: 'Silent movement system nullifies footstep detection.', subSkills: [
    { name: 'Featherfall', description: 'Landing from any height produces zero acoustic signature.' },
    { name: 'No Signature', description: 'Movement through sensor zones does not trigger proximity alerts.' },
  ]},
  { id: 'G4', name: 'Firewall Veil', zone: 'GHOST', tier: 2, description: 'Instant reactive Overshield on trigger for 1 AP.', subSkills: [
    { name: 'Emergency Veil', description: 'Spend 1 AP as a reaction when hit to instantly restore 4 Overshield points.' },
    { name: 'Cascade Block', description: 'If the veil absorbs the full attack, the next incoming hit this round also costs +1 AP for the attacker.' },
  ]},
  { id: 'G5', name: 'Phase Shift', zone: 'GHOST', tier: 2, description: 'Briefly displace spatial signature — dodge one attack entirely.', subSkills: [
    { name: 'Blink', description: 'Teleport up to 3m as a reaction; the triggering attack misses automatically.' },
    { name: 'Void Step', description: 'After Blinking, remain untargetable for 1 additional AP worth of time.' },
  ]},
  { id: 'G6', name: 'Signal Jammer', zone: 'GHOST', tier: 2, description: 'Disrupt enemy communications for one round.', subSkills: [
    { name: 'Static Burst', description: 'All enemy coordination bonuses are nullified for 1 round in a 10m radius.' },
    { name: 'Comms Blackout', description: 'Enemies cannot call for reinforcements or share targeting data this round.' },
  ]},
  { id: 'G7', name: 'Shadow Network', zone: 'GHOST', tier: 3, description: 'Establish covert relay for persistent intel feed.', subSkills: [
    { name: 'Dark Web Tap', description: 'Passively intercept all encrypted enemy transmissions within 50m.' },
    { name: 'Persistent Ghost', description: 'Your stealth state no longer breaks when you attack with ranged weapons.' },
  ]},
  { id: 'G8', name: 'System Ghost', zone: 'GHOST', tier: 3, description: 'Remove character from all electronic tracking entirely.', subSkills: [
    { name: 'Off-Grid', description: 'Your biometric data disappears from all corporate databases for the session.' },
    { name: 'Null Identity', description: 'Any facial or gait recognition systems return a null result when scanning you.' },
  ]},
  { id: 'G9', name: 'Reflex Engine', zone: 'GHOST', tier: 3, description: 'Trigger two reactions in a single round.', subSkills: [
    { name: 'Double Dodge', description: 'Use Reflex Dodge twice per round instead of once.' },
    { name: 'Reactive Firewall', description: 'Trigger Emergency Veil and Reflex Dodge simultaneously for 2 AP.' },
  ]},
  { id: 'G10', name: 'Apex Phantom', zone: 'GHOST', tier: 3, description: 'Eliminate target without triggering any alert state.', subSkills: [
    { name: 'Clean Kill', description: 'Executing a target from stealth generates zero heat on the threat board.' },
    { name: 'No Trace', description: 'Bodies eliminated via Clean Kill are automatically concealed from enemy patrols.' },
  ]},

  // ── SPECIALIST (DAT / CLT) — 10 nodes ─────────────────────
  { id: 'S1', name: 'Data Tap', zone: 'SPECIALIST', tier: 1, description: 'Extract live intel from enemy networks during combat.', subSkills: [
    { name: 'Live Feed', description: 'Continuously stream enemy positions to your HUD — no action required.' },
    { name: 'Memory Rip', description: 'Download a defeated enemy\'s last 60 seconds of sensory memory for intel.' },
  ]},
  { id: 'S2', name: 'Crowd Control', zone: 'SPECIALIST', tier: 1, description: 'Broadcast disruptive signals to stagger multiple enemies.', subSkills: [
    { name: 'EMP Pulse', description: 'Spend 2 AP to disable all electronic devices in a 5m radius for 1 round.' },
    { name: 'Daze Field', description: 'Enemies affected by EMP Pulse lose 1 AP on their next turn.' },
  ]},
  { id: 'S3', name: 'Operator Clout', zone: 'SPECIALIST', tier: 1, description: 'Leverage corporate identity for resource access mid-field.', subSkills: [
    { name: 'Access Override', description: 'Spend 1 AP to unlock any standard corporate door or terminal without a key.' },
    { name: 'Corporate Bypass', description: 'Invoke a false corp identity to pause a hostile NPC for 1 round.' },
  ]},
  { id: 'S4', name: 'Tactical Upload', zone: 'SPECIALIST', tier: 2, description: 'Share targeting data with allies to boost hit accuracy.', subSkills: [
    { name: 'Shared Targeting', description: 'All allies gain +2 on attack rolls against any target you have Live Feed on.' },
    { name: 'Marked Threat', description: 'Designate one enemy as Priority Target; all damage against them is increased by 1 die.' },
  ]},
  { id: 'S5', name: 'Black Market Cache', zone: 'SPECIALIST', tier: 2, description: 'Access hidden gear drops from pre-planted stashes.', subSkills: [
    { name: 'Cache Access', description: 'Once per session, retrieve a concealed supply cache containing consumables or ammo.' },
    { name: 'Emergency Supply', description: 'Cache Access can be triggered as a reaction when HW Integrity drops below 30%.' },
  ]},
  { id: 'S6', name: 'Media Blackout', zone: 'SPECIALIST', tier: 2, description: 'Suppress live broadcast feeds — neutralize spectator scoring.', subSkills: [
    { name: 'Broadcast Jam', description: 'Disable arena scoring systems for 2 rounds — no points accrue for either side.' },
    { name: 'Score Wipe', description: 'After Broadcast Jam ends, erase the point record of the jammed rounds entirely.' },
  ]},
  { id: 'S7', name: 'Network Dominator', zone: 'SPECIALIST', tier: 3, description: 'Seize control of local network infrastructure.', subSkills: [
    { name: 'Node Capture', description: 'Take control of an enemy network node; redirect its effects to benefit your team.' },
    { name: 'Admin Override', description: 'Spend 3 AP to assume root access over any facility system in range.' },
  ]},
  { id: 'S8', name: 'Crowd Favorite', zone: 'SPECIALIST', tier: 3, description: 'Live crowd engagement restores AP via spectator votes.', subSkills: [
    { name: 'Fan Boost', description: 'When the audience votes for you, gain 1 AP immediately (GM adjudicates).' },
    { name: 'Viral Moment', description: 'Performing a spectacular action in view of cameras grants +2 CLOUT for the session.' },
  ]},
  { id: 'S9', name: 'Corps Insider', zone: 'SPECIALIST', tier: 3, description: 'Reveal hidden corporate objectives and faction motives.', subSkills: [
    { name: 'Intel Leak', description: 'Expose one hidden corporate objective at the start of a scene.' },
    { name: 'Agenda Exposed', description: 'Once exposed, allies gain advantage on all rolls related to that objective.' },
  ]},
  { id: 'S10', name: 'Apex Operator', zone: 'SPECIALIST', tier: 3, description: 'Deploy full-spectrum tactical superiority for one encounter.', subSkills: [
    { name: 'Command Mode', description: 'For 3 rounds, all allies act on your initiative and may spend your AP.' },
    { name: 'Total Control', description: 'While Command Mode is active, enemy reactions are reduced by 1 per round.' },
  ]},

  // ── BRUTE ∩ GHOST — Overlap ────────────────────────────────
  { id: 'BG1', name: 'Phantom Strike', zone: 'BRUTE_GHOST', tier: 2, description: 'Silent devastating melee attack that leaves no evidence.', subSkills: [
    { name: 'Unseen Blow', description: 'Melee attack from stealth deals +2 damage dice and does not break concealment.' },
    { name: 'Vanish After', description: 'Immediately re-enter stealth after Unseen Blow at no AP cost.' },
  ]},
  { id: 'BG2', name: 'Adaptive Armor', zone: 'BRUTE_GHOST', tier: 2, description: 'Armor morphs to match incoming damage type automatically.', subSkills: [
    { name: 'Thermal Weave', description: 'On the first heat or energy hit each round, reduce damage by 3.' },
    { name: 'Kinetic Absorb', description: 'On the first physical hit each round, reduce damage by 2 and store 1 AP.' },
  ]},
  { id: 'BG3', name: 'Ambush Engine', zone: 'BRUTE_GHOST', tier: 3, description: 'First strike from stealth deals double Hardware Integrity damage.', subSkills: [
    { name: 'Death Blow', description: 'Opening strike from full stealth bypasses Overshield and hits HW directly.' },
    { name: 'Opener', description: 'Death Blow also staggers the target, removing 1 AP from their next turn.' },
  ]},

  // ── BRUTE ∩ SPECIALIST — Overlap ──────────────────────────
  { id: 'BS1', name: 'Combat Broadcast', zone: 'BRUTE_SPECIALIST', tier: 2, description: 'Deal damage and stream it live for live-audience AP bonuses.', subSkills: [
    { name: 'Hype Kill', description: 'Eliminating an enemy while cameras are active restores 1 AP.' },
    { name: 'Live Execution', description: 'Performing an execution with Hype Kill active grants +1 CLOUT and 2 AP.' },
  ]},
  { id: 'BS2', name: 'Salvage Rig', zone: 'BRUTE_SPECIALIST', tier: 2, description: 'Rip components from defeated enemies for field repairs.', subSkills: [
    { name: 'Strip Salvage', description: 'After defeating an enemy, recover parts worth 1d6 Hardware Integrity (self).' },
    { name: 'Field Weld', description: 'Spend 2 AP to immediately apply salvaged parts, restoring 1d6+2 HW Integrity.' },
  ]},
  { id: 'BS3', name: 'Warboss Authority', zone: 'BRUTE_SPECIALIST', tier: 3, description: 'Impose fear through sheer presence — enemies lose 1 AP.', subSkills: [
    { name: 'Intimidate', description: 'Spend 1 AP to force one enemy to pass a CLOUT save or lose 1 AP this turn.' },
    { name: 'Dread Aura', description: 'All enemies within 5m of you begin their turn with a -1 morale penalty on saves.' },
  ]},

  // ── GHOST ∩ SPECIALIST — Overlap ──────────────────────────
  { id: 'GS1', name: 'Ghost Protocol', zone: 'GHOST_SPECIALIST', tier: 2, description: 'Wipe all electronic evidence of actions taken this round.', subSkills: [
    { name: 'Log Wipe', description: 'At end of round, purge all enemy sensor logs of your activity this turn.' },
    { name: 'Clean Slate', description: 'Log Wipe also removes any threat-level increases you triggered this round.' },
  ]},
  { id: 'GS2', name: 'Deep Cover', zone: 'GHOST_SPECIALIST', tier: 2, description: 'Maintain a false corporate identity for extended missions.', subSkills: [
    { name: 'False ID', description: 'Generate a convincing corporate credential that passes automated verification.' },
    { name: 'Legend Build', description: 'Your false identity accrues a positive reputation — NPCs start as Neutral rather than Hostile.' },
  ]},
  { id: 'GS3', name: 'Phantom Operator', zone: 'GHOST_SPECIALIST', tier: 3, description: 'Combine total electronic invisibility with network dominance.', subSkills: [
    { name: 'Null Node', description: 'Your presence on any network appears as background noise — undetectable.' },
    { name: 'Ghost Admin', description: 'Take administrative control of any network node without triggering security alerts.' },
  ]},
];

export const ARCHETYPE_NODES: ArchetypeNode[] = RAW_ARCHETYPE_NODES.map((node) => ({
  ...node,
  subSkills: node.subSkills.map((subSkill, index) => createSubSkill(node.id, node.tier, index, subSkill)),
}));
