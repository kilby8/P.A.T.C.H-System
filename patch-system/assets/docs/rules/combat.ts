import { RulesSection } from './types';

export const COMBAT_RULES_SECTION: RulesSection = {
  title: 'Combat',
  rules: [
    'Initiative: roll your PING dice. Mobs act on their Init. Operators win ties.',
    'Start of turn: gain AP equal to your AP stat (-1 in Neural Shock). Unspent AP banks, up to your AP + 1. Stunned or Surprised: gain none, keep the bank.',
    'One free Move of 6 m per turn. Attack 1 AP, Dash 1, Hide 1, Help 1, Grapple 1, Stabilize 1, Shake it off 1, Reboot Shield 2 (1d6 + SYSTEM Overshield), Patch Up 2 (Medicine 15, heal 1d6 Hardware +1 per full 5 flair, once per target per encounter).',
    'Attack: weapon attribute + skill against Defense. Damage = weapon dice + attribute bonus (attribute - 3) + 1 per full 5 flair, minimum 1.',
    'Armor Counter: when a melee attack misses you, spend 1 AP to deal your armor\'s counter damage. One reaction per round.',
    'Spending AP on camera also feeds the broadcast: +1 Engagement per AP spent.',
  ],
};
