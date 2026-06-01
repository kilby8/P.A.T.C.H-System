// ============================================================
// P.A.T.C.H. SYSTEM — Arena Encounter Generator
// ============================================================
import {
  ARENA_BESTIARY,
  BestiaryEntity,
  SpectacleBracket,
  getBestiaryEntityById,
  getSpectacleBracket,
} from '../models/ArenaBestiary';

export interface EncounterSpawn {
  id: string;
  templateId: number;
  name: string;
  role: string;
  description: string;
}

export interface GeneratedEncounter {
  spectacleScore: number;
  bracket: SpectacleBracket;
  spawns: EncounterSpawn[];
  modifiers: string[];
}

function expandForce(bracket: SpectacleBracket): BestiaryEntity[] {
  return bracket.force.flatMap((entry) => {
    const template = getBestiaryEntityById(entry.templateId);
    if (!template) {
      return [];
    }

    return Array.from({ length: entry.count }, () => template);
  });
}

export function generateEncounterFromSpectacle(score: number): GeneratedEncounter {
  const bracket = getSpectacleBracket(score);
  const templates = expandForce(bracket);

  return {
    spectacleScore: Math.max(1, Math.min(6, score)),
    bracket,
    spawns: templates.map((template, index) => ({
      id: `${template.name}-${index + 1}`,
      templateId: template.id,
      name: template.name,
      role: template.role,
      description: template.description,
    })),
    modifiers: bracket.modifiers,
  };
}

export function rollSpectacleEncounter(random: () => number = Math.random): GeneratedEncounter {
  const spectacleScore = Math.floor(random() * 6) + 1;
  return generateEncounterFromSpectacle(spectacleScore);
}

export { ARENA_BESTIARY };