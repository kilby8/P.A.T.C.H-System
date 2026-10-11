// ============================================================
// P.A.T.C.H. SYSTEM — Skills
// A check rolls attribute + skill ranks as d6. Each skill has a usual
// attribute; the GM may pair it with another when the fiction calls for it.
// ============================================================
import type { CoreAttribute } from './Backgrounds';

export type SkillId =
  | 'athletics' | 'intimidation' | 'melee'
  | 'acrobatics' | 'finesse' | 'marksmanship' | 'stealth'
  | 'endurance' | 'heavyWeapons' | 'mechanics'
  | 'hacking' | 'investigation' | 'salvage'
  | 'insight' | 'medicine' | 'perception' | 'survival'
  | 'deception' | 'performance' | 'persuasion';

export interface SkillDef {
  id: SkillId;
  name: string;
  attribute: CoreAttribute;
  use: string;
}

export const SKILL_DEFS: SkillDef[] = [
  { id: 'athletics', name: 'Athletics', attribute: 'POWER', use: 'Climb, jump, swim, grapple, shove, break' },
  { id: 'intimidation', name: 'Intimidation', attribute: 'POWER', use: 'Scare, coerce, dominate a room' },
  { id: 'melee', name: 'Melee', attribute: 'POWER', use: 'Attack with clubs, spears and fists' },
  { id: 'acrobatics', name: 'Acrobatics', attribute: 'PING', use: 'Balance, tumble, vault, parkour' },
  { id: 'finesse', name: 'Finesse', attribute: 'PING', use: 'Pick pockets, palm objects, delicate manual work' },
  { id: 'marksmanship', name: 'Marksmanship', attribute: 'PING', use: 'Attack with bows and firearms' },
  { id: 'stealth', name: 'Stealth', attribute: 'PING', use: 'Hide, sneak, move unseen' },
  { id: 'endurance', name: 'Endurance', attribute: 'HARDWARE', use: 'Push through pain, hazards, exhaustion' },
  { id: 'heavyWeapons', name: 'Heavy Weapons', attribute: 'HARDWARE', use: 'Attack with energy and heavy weapons' },
  { id: 'mechanics', name: 'Mechanics', attribute: 'HARDWARE', use: 'Repair, fabricate, judge structural integrity' },
  { id: 'hacking', name: 'Hacking', attribute: 'DATA', use: 'System override, security cracking, attacks with support gear' },
  { id: 'investigation', name: 'Investigation', attribute: 'DATA', use: 'Research, deduce, dig up corporate intel' },
  { id: 'salvage', name: 'Salvage', attribute: 'DATA', use: 'Scavenge tech, strip parts, identify blueprints' },
  { id: 'insight', name: 'Insight', attribute: 'SYSTEM', use: 'Read people, bots and animals; spot lies' },
  { id: 'medicine', name: 'Medicine', attribute: 'SYSTEM', use: 'Biometrics, first aid, stabilizing the Flatlined' },
  { id: 'perception', name: 'Perception', attribute: 'SYSTEM', use: 'Notice, search, track, spot the hidden' },
  { id: 'survival', name: 'Survival', attribute: 'SYSTEM', use: 'Navigate, endure environments, find routes' },
  { id: 'deception', name: 'Deception', attribute: 'CLOUT', use: 'Lie, disguise, forge, misdirect' },
  { id: 'performance', name: 'Performance', attribute: 'CLOUT', use: 'Crowd appeal, stunts, playing to the cameras' },
  { id: 'persuasion', name: 'Persuasion', attribute: 'CLOUT', use: 'Negotiate, charm, cut a deal with a sponsor' },
];

export type SkillRanks = Partial<Record<SkillId, number>>;

export const MAX_SKILL_RANK = 5;
export const CREATION_MAX_SKILL_RANK = 2;
export const BACKGROUND_SKILL_RANK = 2;
export const FREE_CREATION_SKILL_RANKS = 2;

/** Usual skills added to a save, by attribute ("attribute + best related skill"). */
export const SAVE_SKILLS: Record<CoreAttribute, SkillId[]> = {
  POWER: ['athletics'],
  PING: ['acrobatics'],
  HARDWARE: ['endurance'],
  DATA: ['hacking'],
  SYSTEM: ['insight', 'perception'],
  CLOUT: ['performance', 'persuasion'],
};

const skillMap = new Map(SKILL_DEFS.map((skill) => [skill.id, skill]));

export function getSkillById(id: SkillId): SkillDef | undefined {
  return skillMap.get(id);
}

export function isSkillId(value: string): value is SkillId {
  return skillMap.has(value as SkillId);
}

export function sanitizeSkillRanks(ranks: SkillRanks | undefined): SkillRanks {
  const out: SkillRanks = {};
  if (!ranks) return out;
  Object.entries(ranks).forEach(([id, rank]) => {
    if (!isSkillId(id)) return;
    const value = Math.max(0, Math.min(MAX_SKILL_RANK, Math.floor(Number(rank) || 0)));
    if (value > 0) out[id] = value;
  });
  return out;
}

export function getSkillRank(ranks: SkillRanks | undefined, id: SkillId): number {
  return ranks?.[id] ?? 0;
}

/** Best related skill rank for a save with the given attribute. */
export function getSaveSkillRank(ranks: SkillRanks | undefined, attribute: CoreAttribute): number {
  return Math.max(0, ...SAVE_SKILLS[attribute].map((id) => getSkillRank(ranks, id)));
}
