import { RulesSection } from './types';

export const VITALS_RULES_SECTION: RulesSection = {
  title: 'Damage, Death & Recovery',
  rules: [
    'Damage hits Overshield first, then Hardware Integrity. Overshield resets to full after every encounter.',
    'Neural Shock: Hardware below 50% of max (35% with Redundant Systems) costs 1 AP each turn.',
    'Flatlined at 0 Hardware: roll a crash save each turn (d6: 4-6 success, 6 counts twice; 1-3 failure, 1 counts twice). Three successes: stable. Three failures: the build is destroyed.',
    'Destroyed means the operator, nodes, installs and blueprints are erased. A replacement starts with AdvP equal to the lowest total a surviving squadmate has earned (minimum 2), +20 fragments per completed deployment (max 200) and one Foundation blueprint.',
    'Condo Phase: each Condo Hour heals 25% of max Hardware. A 15-minute table break is 3 Condo Hours.',
  ],
};
