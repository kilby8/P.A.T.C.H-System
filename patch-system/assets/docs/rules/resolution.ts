import { RulesSection } from './types';

export const RESOLUTION_RULES_SECTION: RulesSection = {
  title: 'Checks & Saves',
  rules: [
    'CPU Attributes run 1 to 5. 3 is an average operator.',
    'Dice pool = attribute + skill rank, rolled as d6. POWER 3 + Athletics 2 rolls 5d6. Untrained: attribute only.',
    'Total the dice against the target the GM sets: 10 routine, 15 tricky, 20 hard, 25 heroic, 30 legendary.',
    'Meet or beat the target to succeed. Every point over is flair: +1 damage per full 5 on attacks; 10+ on camera is a highlight (+1 Engagement).',
    'Advantage: roll one extra die and drop the lowest. Disadvantage: roll one extra and drop the highest. "+1 die" adds to the pool.',
    'Saves roll the attribute plus your best related skill against the save target: POWER/Athletics, PING/Acrobatics, HARDWARE/Endurance, DATA/Hacking, SYSTEM/Insight or Perception, CLOUT/Performance or Persuasion.',
    'Targets never scale with your pool. Growing the pool is how you get reliably better.',
  ],
};
