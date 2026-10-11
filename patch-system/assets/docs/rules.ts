// How to edit rules:
// 1) Edit or add section files in assets/docs/rules/.
// 2) Keep each section as { title, rules[] }.
// 3) Export and include sections in RULES_SECTIONS below.
// These are the short form of the rulebook PDFs; keep them in step with rulebook/.

import { COMBAT_RULES_SECTION } from './rules/combat';
import { CORPORATE_INDUCTION_SECTION } from './rules/corporate-induction';
import { CORE_RULES_SECTION } from './rules/core';
import { PROGRESSION_RULES_SECTION } from './rules/progression';
import { RESOLUTION_RULES_SECTION } from './rules/resolution';
import { VITALS_RULES_SECTION } from './rules/vitals';
import { RulesSection } from './rules/types';

export type { RulesSection } from './rules/types';

export const RULES_SECTIONS: RulesSection[] = [
  CORPORATE_INDUCTION_SECTION,
  CORE_RULES_SECTION,
  RESOLUTION_RULES_SECTION,
  COMBAT_RULES_SECTION,
  VITALS_RULES_SECTION,
  PROGRESSION_RULES_SECTION,
];
