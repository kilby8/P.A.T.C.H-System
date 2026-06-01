// How to edit rules:
// 1) Edit or add section files in assets/docs/rules/.
// 2) Keep each section as { title, rules[] }.
// 3) Export and include sections in RULES_SECTIONS below.

import { AI_COLLAB_RULES_SECTION } from './rules/ai-collaboration';
import { CORPORATE_INDUCTION_SECTION } from './rules/corporate-induction';
import { CORE_RULES_SECTION } from './rules/core';
import { RulesSection } from './rules/types';

export type { RulesSection } from './rules/types';

export const RULES_SECTIONS: RulesSection[] = [
  CORPORATE_INDUCTION_SECTION,
  CORE_RULES_SECTION,
  AI_COLLAB_RULES_SECTION,
];