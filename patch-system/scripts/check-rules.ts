// Model-level checks for the rules the app now enforces. Run: npx tsx scripts/check-rules.ts
import assert from 'node:assert/strict';
import { createCharacter, getDefense, getAPAfterTurnStart, getMaxBankedAP, hydrateCharacter, getStartingAP } from '../src/models/Character';
import { canUnlockNode, ARCHETYPE_NODES } from '../src/models/ArchetypeNodes';
import { getMobProfile } from '../src/models/ArenaBestiary';
import { applyCrashSaveRoll } from '../src/models/Conditions';

const avg = { POWER: 3, PING: 3, HARDWARE: 3, DATA: 3, SYSTEM: 3, CLOUT: 3 };
let n = 0;
const t = (name: string, fn: () => void) => { fn(); n += 1; console.log('ok', name); };

t('Hardened adds +5 max HW for inmates only', () => {
  assert.equal(createCharacter('a', 'a', avg, 2, 'enforcer').hardwareIntegrity.max, 25);
  assert.equal(createCharacter('b', 'b', avg, 2, 'media-star').hardwareIntegrity.max, 20);
  assert.equal(createCharacter('c', 'c', avg, 2, 'enforcer', { origin: 'offworlder' }).hardwareIntegrity.max, 20);
});
t('Off-Worlder: 120 fragments, no bonuses, no glitcher roll', () => {
  const c = createCharacter('c', 'c', avg, 2, 'glitched-ghost', { origin: 'offworlder' });
  assert.equal(c.origin, 'offworlder'); assert.equal(c.dataFragments, 120); assert.equal(c.engagement, 25); assert.equal(c.viewerCount, 300);
  assert.equal(c.aiPriorityMarked, false);
});
t('Background skills rank 2 plus extras', () => {
  const c = createCharacter('r', 'Rook', { POWER: 2, PING: 4, HARDWARE: 3, DATA: 2, SYSTEM: 4, CLOUT: 3 }, 2, 'neon-runner', { extraSkillRanks: { marksmanship: 2 } });
  assert.deepEqual(c.skills, { acrobatics: 2, survival: 2, marksmanship: 2 });
  assert.equal(getDefense(c), 15); assert.equal(c.advancementPoints, 2);
});
t('Old saves get skills/origin on hydrate', () => {
  const c = createCharacter('o', 'o', avg, 2, 'riot-breaker') as any;
  delete c.skills; delete c.origin; delete c.conditions; delete c.crashSaves;
  const h = hydrateCharacter(c);
  assert.equal(h.origin, 'inmate'); assert.deepEqual(h.skills, { endurance: 2, heavyWeapons: 2 }); assert.deepEqual(h.conditions, []);
});
t('AP banks to max + 1; stunned gains none; staggered one less', () => {
  const c = createCharacter('a', 'a', avg, 2, 'enforcer'); // AP 2
  assert.equal(getMaxBankedAP(c), 3);
  assert.equal(getAPAfterTurnStart({ ...c, currentAP: 2 }), 3);
  assert.equal(getAPAfterTurnStart({ ...c, currentAP: 1, conditions: ['stunned'] }), 1);
  assert.equal(getAPAfterTurnStart({ ...c, currentAP: 0, conditions: ['staggered'] }), 1);
  const low = createCharacter('l', 'l', { ...avg, SYSTEM: 1 }, 2, 'enforcer');
  assert.equal(getStartingAP(low), 1); assert.equal(getAPAfterTurnStart({ ...low, currentAP: 1 }), 2);
});
t('Titan Chassis: +5 HW and 35% shock threshold', () => {
  const c = createCharacter('t', 't', avg, 2, 'media-star');
  const h = hydrateCharacter({ ...c, unlockedSubSkills: ['B5-SUB-1', 'B5-SUB-2'], hardwareIntegrity: { max: 20, current: 9 } });
  assert.equal(h.hardwareIntegrity.max, 25); assert.equal(h.neuralShock, false);
});
t('Node prerequisites', () => {
  assert.equal(canUnlockNode('B1', []), true);
  assert.equal(canUnlockNode('B4', []), false);
  assert.equal(canUnlockNode('B4', ['B1']), true);
  assert.equal(canUnlockNode('B7', ['B1']), false);
  assert.equal(canUnlockNode('B7', ['B1', 'B4']), true);
  assert.equal(canUnlockNode('BG1', ['B1']), false);
  assert.equal(canUnlockNode('BG1', ['B1', 'G1']), true);
  assert.equal(canUnlockNode('BG3', ['B1', 'G1']), false);
  assert.equal(ARCHETYPE_NODES.length, 39);
});
t('Mob profiles carry tier stats and tier save targets', () => {
  const overlord = getMobProfile(48)!;
  assert.equal(overlord.tier, 'Boss'); assert.equal(overlord.defense, 20); assert.equal(overlord.attack, '6d6');
  assert.match(overlord.abilities[0].text, /SYSTEM save \(17\)/);
  assert.equal(getMobProfile(24)!.sameAs, 16);
  assert.equal(getMobProfile(28)!.name, 'Mainframe-Guardian (Monolith)');
  assert.equal(getMobProfile(32)!.ap, 2);
});
t('Crash saves count doubles', () => {
  assert.deepEqual(applyCrashSaveRoll({ successes: 0, failures: 0 }, 6), { successes: 2, failures: 0 });
  assert.deepEqual(applyCrashSaveRoll({ successes: 0, failures: 2 }, 1), { successes: 0, failures: 3 });
});
console.log(`${n} rule checks passed`);
