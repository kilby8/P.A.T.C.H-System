// ============================================================
// P.A.T.C.H. SYSTEM — Character + Session + Encounter Store
// ============================================================
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Character,
  VitalLayer,
  createCharacter,
  hydrateCharacter,
  getStartingAP,
} from '../models/Character';
import {
  BlueprintMarket,
  BlueprintTradeLogEntry,
  GearCategory,
  GearTheme,
  createDefaultBlueprintMarket,
  getBlueprintById,
  getGearItemById,
  getSponsorBlueprints,
  getThemeEngagementRequirement,
  isSponsorBlueprint,
} from '../models/Gear';
import {
  GeneratedEncounter,
  EncounterSpawn,
  generateEncounterFromSpectacle,
  rollSpectacleEncounter,
} from '../utils/encounterGenerator';
import { generateEncounterFragmentDrop } from '../utils/lootEconomy';
import { SectorDifficulty, rollSectorBlueprint } from '../utils/sectorLoot';
import { publishRemoteSession, RemoteEnvelope, subscribeToRemoteSession } from '../lib/remoteSession';
import { isSupabaseConfigured } from '../lib/supabase';

export const GM_ACCESS_CODE = 'PATCH-GM';

export type SessionRole = 'guest' | 'player' | 'gm';

export interface SessionState {
  role: SessionRole;
  actorName: string;
  playerCharacterId?: string;
}

export type SyncStatus = 'local-only' | 'connecting' | 'connected' | 'error';

export interface ActiveMob extends EncounterSpawn {
  maxIntegrity: number;
  currentIntegrity: number;
  maxAP: number;
  currentAP: number;
  defeated: boolean;
}

export interface ActiveEncounter {
  spectacleScore: number;
  bracketLabel: string;
  modifiers: string[];
  mobs: ActiveMob[];
  lootClaimed: boolean;
}

interface CharacterStoreState {
  party: Character[];
  selectedCharacterId: string;
  session: SessionState;
  encounter: ActiveEncounter | null;
  remoteSessionCode: string;
  sectorDifficulty: SectorDifficulty;
  blueprintMarket: BlueprintMarket;
  tradeLog: BlueprintTradeLogEntry[];
  lastLootBlueprintId: string | null;
}

type Action =
  | { type: 'HYDRATE_STORE'; payload: CharacterStoreState }
  | { type: 'HYDRATE_REMOTE_STATE'; payload: Pick<CharacterStoreState, 'party' | 'selectedCharacterId' | 'encounter' | 'sectorDifficulty' | 'blueprintMarket' | 'tradeLog' | 'lastLootBlueprintId'> }
  | { type: 'LOAD_CHARACTER'; payload: Character }
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'SET_REMOTE_SESSION_CODE'; sessionCode: string }
  | { type: 'SET_SELECTED_CHARACTER'; characterId: string }
  | { type: 'LOGIN_PLAYER'; characterId: string }
  | { type: 'LOGIN_GM' }
  | { type: 'LOGOUT' }
  | { type: 'SPEND_AP'; amount: number }
  | { type: 'RESTORE_AP' }
  | { type: 'APPLY_DAMAGE_OVERSHIELD'; amount: number }
  | { type: 'APPLY_DAMAGE_HARDWARE'; amount: number }
  | { type: 'HEAL_HARDWARE'; amount: number }
  | { type: 'RESTORE_OVERSHIELD'; amount: number }
  | { type: 'UNLOCK_NODE'; nodeId: string }
  | { type: 'UNLOCK_SUB_SKILL'; nodeId: string; subSkillId: string; cost: number }
  | { type: 'REFUND_SUB_SKILL'; subSkillId: string; refund: number }
  | { type: 'SET_ENCOUNTER'; payload: GeneratedEncounter }
  | { type: 'CLEAR_ENCOUNTER' }
  | { type: 'DAMAGE_MOB'; mobId: string; amount: number }
  | { type: 'HEAL_MOB'; mobId: string; amount: number }
  | { type: 'SPEND_MOB_AP'; mobId: string; amount: number }
  | { type: 'RESTORE_MOB_AP'; mobId: string }
  | { type: 'REMOVE_MOB'; mobId: string }
  | { type: 'INSTALL_BLUEPRINT'; category: GearCategory; hardpointIndex: number; blueprintId: string }
  | { type: 'TRANSFER_BLUEPRINT'; fromCharacterId: string; toCharacterId: string; blueprintId: string; amount: number }
  | { type: 'INJECT_BLUEPRINT'; toCharacterId: string; blueprintId: string; amount: number }
  | { type: 'SET_BLUEPRINT_PRICE'; blueprintId: string; price: number }
  | { type: 'SET_BLUEPRINT_AVAILABILITY'; blueprintId: string; amount: number }
  | { type: 'SET_BLUEPRINT_WEIGHT_MULTIPLIER'; blueprintId: string; multiplier: number }
  | { type: 'SET_BLUEPRINT_LOOT_ENABLED'; blueprintId: string; enabled: boolean }
  | { type: 'SET_THEME_GATE'; theme: GearTheme; unlocked: boolean }
  | { type: 'SET_SECTOR_DIFFICULTY'; difficulty: SectorDifficulty }
  | { type: 'ROLL_SECTOR_LOOT' }
  | { type: 'SPONSOR_DROP'; toCharacterId: string }
  | { type: 'LOOT_OVERRIDE'; toCharacterId: string; blueprintId: string }
  | { type: 'PURCHASE_BLUEPRINT'; blueprintId: string; amount: number }
  | { type: 'CLAIM_ENCOUNTER_LOOT' }
  | { type: 'AWARD_FRAGMENTS'; toCharacterId: string; amount: number; note?: string };

const STORAGE_KEY = 'patch-system/session-store/v1';

function clampVital(vital: VitalLayer, delta: number): VitalLayer {
  return {
    ...vital,
    current: Math.min(vital.max, Math.max(0, vital.current + delta)),
  };
}

function getMobBaseIntegrity(role: string): number {
  if (role.includes('Boss')) return 28;
  if (role.includes('Tank')) return 18;
  if (role.includes('Elite')) return 16;
  if (role.includes('Fodder') || role.includes('Low-HP Hunter') || role.includes('Garnish')) return 6;
  if (role.includes('Support') || role.includes('Healer') || role.includes('Sapper')) return 8;
  return 10;
}

function getMobBaseAP(role: string): number {
  if (role.includes('Boss')) return 4;
  if (role.includes('Elite') || role.includes('Tank')) return 3;
  if (role.includes('Fodder') || role.includes('Garnish')) return 1;
  return 2;
}

function hydrateEncounter(encounter: GeneratedEncounter): ActiveEncounter {
  return {
    spectacleScore: encounter.spectacleScore,
    bracketLabel: encounter.bracket.label,
    modifiers: encounter.modifiers,
    lootClaimed: false,
    mobs: encounter.spawns.map((spawn) => {
      const maxIntegrity = getMobBaseIntegrity(spawn.role);
      const maxAP = getMobBaseAP(spawn.role);
      return {
        ...spawn,
        maxIntegrity,
        currentIntegrity: maxIntegrity,
        maxAP,
        currentAP: maxAP,
        defeated: false,
      };
    }),
  };
}

function createDefaultState(initialCharacters?: Character[]): CharacterStoreState {
  const hydratedParty = (initialCharacters && initialCharacters.length > 0
    ? initialCharacters
    : [createCharacter('default', 'Unknown Operator', { POWER: 10, PING: 10, HARDWARE: 10, DATA: 10, SYSTEM: 10, CLOUT: 10 })]
  ).map(hydrateCharacter);

  return {
    party: hydratedParty,
    selectedCharacterId: hydratedParty[0].id,
    session: {
      role: 'guest',
      actorName: 'UNAUTHENTICATED USER',
    },
    encounter: null,
    remoteSessionCode: '',
    sectorDifficulty: 1,
    blueprintMarket: createDefaultBlueprintMarket(),
    tradeLog: [],
    lastLootBlueprintId: null,
  };
}

function sanitizeEncounter(encounter: ActiveEncounter | null | undefined): ActiveEncounter | null {
  if (!encounter) return null;

  return {
    spectacleScore: encounter.spectacleScore,
    bracketLabel: encounter.bracketLabel,
    modifiers: encounter.modifiers ?? [],
    lootClaimed: encounter.lootClaimed ?? false,
    mobs: (encounter.mobs ?? []).map((mob) => ({
      ...mob,
      maxIntegrity: Math.max(1, mob.maxIntegrity),
      currentIntegrity: Math.max(0, Math.min(mob.currentIntegrity, mob.maxIntegrity)),
      maxAP: Math.max(1, mob.maxAP),
      currentAP: Math.max(0, Math.min(mob.currentAP, mob.maxAP)),
      defeated: mob.defeated || mob.currentIntegrity <= 0,
    })),
  };
}

function sanitizeBlueprintMarket(market: BlueprintMarket | undefined): BlueprintMarket {
  const fallback = createDefaultBlueprintMarket();
  if (!market) return fallback;

  return {
    prices: {
      ...fallback.prices,
      ...(market.prices ?? {}),
    },
    availability: {
      ...fallback.availability,
      ...(market.availability ?? {}),
    },
    themeGates: {
      ...fallback.themeGates,
      ...(market.themeGates ?? {}),
    },
    lootEnabled: {
      ...fallback.lootEnabled,
      ...(market.lootEnabled ?? {}),
    },
    weightMultipliers: {
      ...fallback.weightMultipliers,
      ...(market.weightMultipliers ?? {}),
    },
  };
}

function hydrateStoreSnapshot(snapshot: CharacterStoreState, fallbackState: CharacterStoreState): CharacterStoreState {
  const party = (snapshot.party?.length ? snapshot.party : fallbackState.party).map(hydrateCharacter);
  const selectedCharacterId = party.some((character) => character.id === snapshot.selectedCharacterId)
    ? snapshot.selectedCharacterId
    : party[0].id;

  return {
    party,
    selectedCharacterId,
    session: snapshot.session ?? fallbackState.session,
    encounter: sanitizeEncounter(snapshot.encounter),
    remoteSessionCode: snapshot.remoteSessionCode ?? '',
    sectorDifficulty: snapshot.sectorDifficulty ?? fallbackState.sectorDifficulty,
    blueprintMarket: sanitizeBlueprintMarket(snapshot.blueprintMarket ?? fallbackState.blueprintMarket),
    tradeLog: snapshot.tradeLog ?? [],
    lastLootBlueprintId: snapshot.lastLootBlueprintId ?? null,
  };
}

interface RemoteSharedState {
  party: Character[];
  selectedCharacterId: string;
  encounter: ActiveEncounter | null;
  sectorDifficulty: SectorDifficulty;
  blueprintMarket: BlueprintMarket;
  tradeLog: BlueprintTradeLogEntry[];
  lastLootBlueprintId: string | null;
}

function hydrateRemoteSharedState(
  payload: RemoteSharedState,
  fallbackState: CharacterStoreState,
): Pick<CharacterStoreState, 'party' | 'selectedCharacterId' | 'encounter' | 'sectorDifficulty' | 'blueprintMarket' | 'tradeLog' | 'lastLootBlueprintId'> {
  const party = (payload.party?.length ? payload.party : fallbackState.party).map(hydrateCharacter);
  const selectedCharacterId = party.some((character) => character.id === payload.selectedCharacterId)
    ? payload.selectedCharacterId
    : party[0].id;

  return {
    party,
    selectedCharacterId,
    encounter: sanitizeEncounter(payload.encounter),
    sectorDifficulty: payload.sectorDifficulty ?? fallbackState.sectorDifficulty,
    blueprintMarket: sanitizeBlueprintMarket(payload.blueprintMarket ?? fallbackState.blueprintMarket),
    tradeLog: payload.tradeLog ?? [],
    lastLootBlueprintId: payload.lastLootBlueprintId ?? null,
  };
}

function getSelectedCharacter(state: CharacterStoreState): Character {
  return state.party.find((character) => character.id === state.selectedCharacterId) ?? state.party[0];
}

function syncVitalsAndAP(previous: Character, next: Character): Character {
  const hydrated = hydrateCharacter({
    ...next,
    currentAP: previous.currentAP,
  });
  const previousMaxAP = getStartingAP(previous);
  const nextMaxAP = getStartingAP(hydrated);

  if (hydrated.neuralShock === previous.neuralShock) {
    return {
      ...hydrated,
      currentAP: Math.min(previous.currentAP, nextMaxAP),
    };
  }

  const delta = nextMaxAP - previousMaxAP;
  return {
    ...hydrated,
    currentAP: Math.max(0, Math.min(nextMaxAP, previous.currentAP + delta)),
  };
}

function updateSelectedCharacter(
  state: CharacterStoreState,
  updater: (character: Character) => Character,
): CharacterStoreState {
  return {
    ...state,
    party: state.party.map((character) => (
      character.id === state.selectedCharacterId ? updater(character) : character
    )),
  };
}

function canAccessCharacter(state: CharacterStoreState, characterId: string): boolean {
  if (state.session.role === 'gm') return true;
  return state.session.playerCharacterId === characterId;
}

function pushTradeLog(state: CharacterStoreState, entry: Omit<BlueprintTradeLogEntry, 'id' | 'at'>): BlueprintTradeLogEntry[] {
  const nextEntry: BlueprintTradeLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  };
  return [nextEntry, ...state.tradeLog].slice(0, 120);
}

function adjustBlueprintCount(character: Character, blueprintId: string, delta: number): Character {
  const next = Math.max(0, (character.blueprintInventory[blueprintId] ?? 0) + delta);
  return {
    ...character,
    blueprintInventory: {
      ...character.blueprintInventory,
      [blueprintId]: next,
    },
  };
}

function adjustDataFragments(character: Character, delta: number): Character {
  return {
    ...character,
    dataFragments: Math.max(0, character.dataFragments + delta),
  };
}

function adjustBroadcastState(
  character: Character,
  engagementDelta: number,
  viewerDelta: number,
): Character {
  return {
    ...character,
    engagement: Math.max(0, Math.min(100, character.engagement + engagementDelta)),
    viewerCount: Math.max(0, character.viewerCount + viewerDelta),
  };
}

function enqueueSponsorInbox(character: Character, blueprintId: string): Character {
  if (!isSponsorBlueprint(blueprintId)) {
    return character;
  }

  return {
    ...character,
    sponsorInbox: [blueprintId, ...character.sponsorInbox.filter((entry) => entry !== blueprintId)].slice(0, 12),
  };
}

function rewardBlueprint(character: Character, blueprintId: string, amount: number): Character {
  let nextCharacter = setBlueprintTradable(
    adjustBlueprintCount(character, blueprintId, amount),
    blueprintId,
    true,
  );

  if (isSponsorBlueprint(blueprintId)) {
    nextCharacter = enqueueSponsorInbox(nextCharacter, blueprintId);
    nextCharacter = adjustBroadcastState(nextCharacter, 12 * amount, 450 * amount);
  } else {
    nextCharacter = adjustBroadcastState(nextCharacter, 3 * amount, 60 * amount);
  }

  return nextCharacter;
}

function getEngagementPayoutMultiplier(engagement: number): number {
  return 1 + Math.floor(engagement / 20) * 0.05;
}

function setBlueprintTradable(character: Character, blueprintId: string, tradable: boolean): Character {
  return {
    ...character,
    blueprintTradable: {
      ...character.blueprintTradable,
      [blueprintId]: tradable,
    },
  };
}

function characterReducer(state: CharacterStoreState, action: Action): CharacterStoreState {
  switch (action.type) {
    case 'HYDRATE_STORE':
      return action.payload;

    case 'HYDRATE_REMOTE_STATE':
      return {
        ...state,
        ...action.payload,
      };

    case 'SET_REMOTE_SESSION_CODE':
      return {
        ...state,
        remoteSessionCode: action.sessionCode.trim().toUpperCase(),
      };

    case 'LOAD_CHARACTER':
      return updateSelectedCharacter(state, () => hydrateCharacter(action.payload));

    case 'ADD_CHARACTER': {
      const newParty = [...state.party, hydrateCharacter(action.payload)];
      return {
        ...state,
        party: newParty,
        selectedCharacterId: action.payload.id,
      };
    }

    case 'SET_SELECTED_CHARACTER': {
      if (!state.party.some((character) => character.id === action.characterId)) return state;
      if (!canAccessCharacter(state, action.characterId)) return state;
      return {
        ...state,
        selectedCharacterId: action.characterId,
      };
    }

    case 'LOGIN_PLAYER': {
      const character = state.party.find((entry) => entry.id === action.characterId);
      if (!character) return state;
      return {
        ...state,
        selectedCharacterId: character.id,
        session: {
          role: 'player',
          actorName: character.name,
          playerCharacterId: character.id,
        },
      };
    }

    case 'LOGIN_GM':
      return {
        ...state,
        session: {
          role: 'gm',
          actorName: 'ARENA GM',
        },
      };

    case 'LOGOUT':
      return {
        ...state,
        selectedCharacterId: state.party[0].id,
        session: {
          role: 'guest',
          actorName: 'UNAUTHENTICATED USER',
        },
      };

    case 'SPEND_AP':
      return updateSelectedCharacter(state, (character) => adjustBroadcastState({
        ...character,
        currentAP: Math.max(0, character.currentAP - action.amount),
      }, action.amount, action.amount * 12));

    case 'RESTORE_AP':
      return updateSelectedCharacter(state, (character) => ({
        ...character,
        currentAP: getStartingAP(character),
      }));

    case 'APPLY_DAMAGE_OVERSHIELD':
      if (state.session.role !== 'gm') return state;
      return updateSelectedCharacter(state, (character) => adjustBroadcastState(hydrateCharacter({
        ...character,
        overshield: clampVital(character.overshield, -action.amount),
      }), action.amount, action.amount * 18));

    case 'APPLY_DAMAGE_HARDWARE':
      if (state.session.role !== 'gm') return state;
      return updateSelectedCharacter(state, (character) => adjustBroadcastState(syncVitalsAndAP(character, {
        ...character,
        hardwareIntegrity: clampVital(character.hardwareIntegrity, -action.amount),
      }), action.amount * 2, action.amount * 35));

    case 'HEAL_HARDWARE':
      return updateSelectedCharacter(state, (character) => syncVitalsAndAP(character, {
        ...character,
        hardwareIntegrity: clampVital(character.hardwareIntegrity, action.amount),
      }));

    case 'RESTORE_OVERSHIELD':
      return updateSelectedCharacter(state, (character) => hydrateCharacter({
        ...character,
        overshield: clampVital(character.overshield, action.amount),
      }));

    case 'UNLOCK_NODE':
      return updateSelectedCharacter(state, (character) => {
        if (character.advancementPoints <= 0) return character;
        if (character.unlockedNodes.includes(action.nodeId)) return character;
        return {
          ...character,
          advancementPoints: character.advancementPoints - 1,
          unlockedNodes: [...character.unlockedNodes, action.nodeId],
        };
      });

    case 'UNLOCK_SUB_SKILL':
      return updateSelectedCharacter(state, (character) => {
        if (!character.unlockedNodes.includes(action.nodeId)) return character;
        if (character.unlockedSubSkills.includes(action.subSkillId)) return character;
        if (character.advancementPoints < action.cost) return character;
        return {
          ...character,
          advancementPoints: character.advancementPoints - action.cost,
          unlockedSubSkills: [...character.unlockedSubSkills, action.subSkillId],
        };
      });

    case 'REFUND_SUB_SKILL':
      return updateSelectedCharacter(state, (character) => {
        if (!character.unlockedSubSkills.includes(action.subSkillId)) return character;
        return {
          ...character,
          advancementPoints: character.advancementPoints + action.refund,
          unlockedSubSkills: character.unlockedSubSkills.filter((id) => id !== action.subSkillId),
        };
      });

    case 'SET_ENCOUNTER':
      return {
        ...state,
        encounter: hydrateEncounter(action.payload),
      };

    case 'CLEAR_ENCOUNTER':
      return {
        ...state,
        encounter: null,
      };

    case 'DAMAGE_MOB':
      if (state.session.role !== 'gm') return state;
      return {
        ...state,
        encounter: state.encounter
          ? {
              ...state.encounter,
              mobs: state.encounter.mobs.map((mob) => {
                if (mob.id !== action.mobId) return mob;
                const currentIntegrity = Math.max(0, mob.currentIntegrity - action.amount);
                return {
                  ...mob,
                  currentIntegrity,
                  defeated: currentIntegrity === 0,
                };
              }),
            }
          : null,
      };

    case 'HEAL_MOB':
      if (state.session.role !== 'gm') return state;
      return {
        ...state,
        encounter: state.encounter
          ? {
              ...state.encounter,
              mobs: state.encounter.mobs.map((mob) => (
                mob.id !== action.mobId
                  ? mob
                  : {
                      ...mob,
                      currentIntegrity: Math.min(mob.maxIntegrity, mob.currentIntegrity + action.amount),
                      defeated: false,
                    }
              )),
            }
          : null,
      };

    case 'SPEND_MOB_AP':
      if (state.session.role !== 'gm') return state;
      return {
        ...state,
        encounter: state.encounter
          ? {
              ...state.encounter,
              mobs: state.encounter.mobs.map((mob) => (
                mob.id !== action.mobId
                  ? mob
                  : { ...mob, currentAP: Math.max(0, mob.currentAP - action.amount) }
              )),
            }
          : null,
      };

    case 'RESTORE_MOB_AP':
      if (state.session.role !== 'gm') return state;
      return {
        ...state,
        encounter: state.encounter
          ? {
              ...state.encounter,
              mobs: state.encounter.mobs.map((mob) => (
                mob.id !== action.mobId ? mob : { ...mob, currentAP: mob.maxAP }
              )),
            }
          : null,
      };

    case 'REMOVE_MOB':
      if (state.session.role !== 'gm') return state;
      return {
        ...state,
        encounter: state.encounter
          ? {
              ...state.encounter,
              mobs: state.encounter.mobs.filter((mob) => mob.id !== action.mobId),
            }
          : null,
      };

    case 'INSTALL_BLUEPRINT':
      {
        let didInstall = false;
        const nextParty = state.party.map((character) => {
          if (character.id !== state.selectedCharacterId) return character;

          const equipped = character.gearLoadout[action.category];
          if (!equipped) return character;

          const item = getGearItemById(equipped.itemId);
          const blueprint = getBlueprintById(action.blueprintId);
          if (!item || !blueprint) return character;
          if (!blueprint.compatibleCategories.includes(action.category)) return character;
          if (!state.blueprintMarket.themeGates[blueprint.theme]) return character;
          if (action.hardpointIndex < 0 || action.hardpointIndex >= item.hardpoints) return character;
          if ((character.blueprintInventory[action.blueprintId] ?? 0) <= 0) return character;

          const nextHardpoints = [...equipped.hardpoints];
          nextHardpoints[action.hardpointIndex] = action.blueprintId;

          const nextCharacter = adjustBlueprintCount(character, action.blueprintId, -1);
          didInstall = true;
          return adjustBroadcastState({
            ...nextCharacter,
            gearLoadout: {
              ...nextCharacter.gearLoadout,
              [action.category]: {
                ...equipped,
                hardpoints: nextHardpoints,
              },
            },
          }, isSponsorBlueprint(action.blueprintId) ? 14 : 5, isSponsorBlueprint(action.blueprintId) ? 320 : 80);
        });

        if (!didInstall) {
          return state;
        }

        return {
        ...state,
          party: nextParty,
          tradeLog: pushTradeLog(state, {
            type: 'install',
            blueprintId: action.blueprintId,
            amount: 1,
            toCharacterId: state.selectedCharacterId,
            note: `${action.category} hardpoint ${action.hardpointIndex + 1}`,
          }),
        };
      }

    case 'TRANSFER_BLUEPRINT': {
      if (action.amount <= 0) return state;
      const fromCharacter = state.party.find((character) => character.id === action.fromCharacterId);
      const toCharacter = state.party.find((character) => character.id === action.toCharacterId);
      if (!fromCharacter || !toCharacter) return state;
      if ((fromCharacter.blueprintInventory[action.blueprintId] ?? 0) < action.amount) return state;
      if (!fromCharacter.blueprintTradable[action.blueprintId]) return state;

      return {
        ...state,
        party: state.party.map((character) => {
          if (character.id === action.fromCharacterId) {
            return adjustBlueprintCount(character, action.blueprintId, -action.amount);
          }
          if (character.id === action.toCharacterId) {
            return adjustBlueprintCount(character, action.blueprintId, action.amount);
          }
          return character;
        }),
        tradeLog: pushTradeLog(state, {
          type: 'trade',
          blueprintId: action.blueprintId,
          amount: action.amount,
          fromCharacterId: action.fromCharacterId,
          toCharacterId: action.toCharacterId,
        }),
      };
    }

    case 'INJECT_BLUEPRINT': {
      if (action.amount <= 0) return state;
      if (!state.party.some((character) => character.id === action.toCharacterId)) return state;
      return {
        ...state,
        party: state.party.map((character) => (
          character.id === action.toCharacterId
            ? rewardBlueprint(character, action.blueprintId, action.amount)
            : character
        )),
        tradeLog: pushTradeLog(state, {
          type: 'inject',
          blueprintId: action.blueprintId,
          amount: action.amount,
          toCharacterId: action.toCharacterId,
        }),
      };
    }

    case 'SET_BLUEPRINT_PRICE':
      return {
        ...state,
        blueprintMarket: {
          ...state.blueprintMarket,
          prices: {
            ...state.blueprintMarket.prices,
            [action.blueprintId]: Math.max(0, Math.floor(action.price)),
          },
        },
      };

    case 'SET_BLUEPRINT_AVAILABILITY':
      return {
        ...state,
        blueprintMarket: {
          ...state.blueprintMarket,
          availability: {
            ...state.blueprintMarket.availability,
            [action.blueprintId]: Math.max(0, Math.floor(action.amount)),
          },
        },
      };

    case 'SET_BLUEPRINT_WEIGHT_MULTIPLIER':
      return {
        ...state,
        blueprintMarket: {
          ...state.blueprintMarket,
          weightMultipliers: {
            ...state.blueprintMarket.weightMultipliers,
            [action.blueprintId]: Math.max(0.05, Math.min(5, Number(action.multiplier.toFixed(2)))),
          },
        },
      };

    case 'SET_BLUEPRINT_LOOT_ENABLED':
      return {
        ...state,
        blueprintMarket: {
          ...state.blueprintMarket,
          lootEnabled: {
            ...state.blueprintMarket.lootEnabled,
            [action.blueprintId]: action.enabled,
          },
        },
      };

    case 'SET_THEME_GATE':
      return {
        ...state,
        blueprintMarket: {
          ...state.blueprintMarket,
          themeGates: {
            ...state.blueprintMarket.themeGates,
            [action.theme]: action.unlocked,
          },
        },
      };

    case 'SET_SECTOR_DIFFICULTY':
      return {
        ...state,
        sectorDifficulty: Math.max(1, Math.min(5, action.difficulty)) as SectorDifficulty,
      };

    case 'ROLL_SECTOR_LOOT': {
      const dropped = rollSectorBlueprint(state.sectorDifficulty, state.blueprintMarket);
      if (!dropped) return state;

      return {
        ...state,
        party: state.party.map((character) => (
          character.id === state.selectedCharacterId
            ? rewardBlueprint(character, dropped.blueprint.id, 1)
            : character
        )),
        blueprintMarket: {
          ...state.blueprintMarket,
          availability: {
            ...state.blueprintMarket.availability,
            [dropped.blueprint.id]: Math.max(0, (state.blueprintMarket.availability[dropped.blueprint.id] ?? 0) - 1),
          },
        },
        lastLootBlueprintId: dropped.blueprint.id,
        tradeLog: pushTradeLog(state, {
          type: 'loot',
          blueprintId: dropped.blueprint.id,
          amount: 1,
          toCharacterId: state.selectedCharacterId,
          note: `sector ${state.sectorDifficulty} roll ${dropped.roll} (${dropped.theme})`,
        }),
      };
    }

    case 'SPONSOR_DROP': {
      const target = state.party.find((character) => character.id === action.toCharacterId);
      if (!target) return state;
      if (target.engagement < 60) return state;

      const sponsorPool = getSponsorBlueprints();
      if (sponsorPool.length === 0) return state;

      const blueprint = sponsorPool[Math.floor(Math.random() * sponsorPool.length)];
      if (!blueprint) return state;

      return {
        ...state,
        party: state.party.map((character) => (
          character.id === action.toCharacterId
            ? rewardBlueprint(character, blueprint.id, 1)
            : character
        )),
        lastLootBlueprintId: blueprint.id,
        tradeLog: pushTradeLog(state, {
          type: 'override',
          blueprintId: blueprint.id,
          amount: 1,
          toCharacterId: action.toCharacterId,
          note: 'producer sponsor drop',
        }),
      };
    }

    case 'LOOT_OVERRIDE': {
      const blueprint = getBlueprintById(action.blueprintId);
      if (!blueprint) return state;
      if (!state.party.some((character) => character.id === action.toCharacterId)) return state;

      return {
        ...state,
        party: state.party.map((character) => (
          character.id === action.toCharacterId
            ? rewardBlueprint(character, action.blueprintId, 1)
            : character
        )),
        lastLootBlueprintId: action.blueprintId,
        tradeLog: pushTradeLog(state, {
          type: 'override',
          blueprintId: action.blueprintId,
          amount: 1,
          toCharacterId: action.toCharacterId,
          note: 'gm loot override',
        }),
      };
    }

    case 'PURCHASE_BLUEPRINT': {
      const amount = Math.max(1, Math.floor(action.amount));
      const blueprint = getBlueprintById(action.blueprintId);
      if (!blueprint) return state;
      if (!state.blueprintMarket.themeGates[blueprint.theme]) return state;

      const price = Math.max(0, Math.floor(state.blueprintMarket.prices[action.blueprintId] ?? 0));
      const stock = Math.max(0, Math.floor(state.blueprintMarket.availability[action.blueprintId] ?? 0));
      if (stock < amount) return state;

      const selected = state.party.find((character) => character.id === state.selectedCharacterId);
      if (!selected) return state;
      if (selected.engagement < getThemeEngagementRequirement(blueprint.theme)) return state;

      const totalCost = price * amount;
      if (selected.dataFragments < totalCost) return state;

      return {
        ...state,
        party: state.party.map((character) => {
          if (character.id !== state.selectedCharacterId) return character;
          const withBlueprint = rewardBlueprint(character, action.blueprintId, amount);
          return adjustDataFragments(withBlueprint, -totalCost);
        }),
        blueprintMarket: {
          ...state.blueprintMarket,
          availability: {
            ...state.blueprintMarket.availability,
            [action.blueprintId]: stock - amount,
          },
        },
        tradeLog: pushTradeLog(state, {
          type: 'purchase',
          blueprintId: action.blueprintId,
          amount,
          toCharacterId: state.selectedCharacterId,
          fragmentDelta: -totalCost,
          note: `purchase @ ${price} each`,
        }),
      };
    }

    case 'CLAIM_ENCOUNTER_LOOT': {
      if (!state.encounter || state.encounter.lootClaimed) return state;
      const encounter = state.encounter;

      const totalMobs = encounter.mobs.length;
      const defeatedMobs = encounter.mobs.filter((mob) => mob.defeated || mob.currentIntegrity <= 0).length;
      const drop = generateEncounterFragmentDrop({
        spectacleScore: encounter.spectacleScore,
        totalMobs,
        defeatedMobs,
      });
      const selected = state.party.find((character) => character.id === state.selectedCharacterId);
      if (!selected) return state;
      const payout = Math.max(0, Math.round(drop.total * getEngagementPayoutMultiplier(selected.engagement)));

      return {
        ...state,
        party: state.party.map((character) => (
          character.id === state.selectedCharacterId
            ? adjustBroadcastState(adjustDataFragments(character, payout), Math.max(4, encounter.spectacleScore * 3), payout * 6)
            : character
        )),
        encounter: {
          ...encounter,
          lootClaimed: true,
        },
        tradeLog: pushTradeLog(state, {
          type: 'loot',
          amount: 1,
          toCharacterId: state.selectedCharacterId,
          fragmentDelta: payout,
          note: `spectacle ${encounter.spectacleScore} / defeated ${defeatedMobs}/${totalMobs} / feed x${getEngagementPayoutMultiplier(selected.engagement).toFixed(2)}`,
        }),
      };
    }

    case 'AWARD_FRAGMENTS': {
      const amount = Math.max(1, Math.floor(action.amount));
      if (!state.party.some((character) => character.id === action.toCharacterId)) return state;
      return {
        ...state,
        party: state.party.map((character) => (
          character.id === action.toCharacterId
            ? adjustBroadcastState(adjustDataFragments(character, amount), action.note?.includes('ad-read') ? 8 : 2, amount * 4)
            : character
        )),
        tradeLog: pushTradeLog(state, {
          type: 'award',
          amount: 1,
          toCharacterId: action.toCharacterId,
          fragmentDelta: amount,
          note: action.note ?? 'gm award',
        }),
      };
    }

    default:
      return state;
  }
}

interface CharacterContextValue {
  character: Character;
  party: Character[];
  selectedCharacterId: string;
  session: SessionState;
  encounter: ActiveEncounter | null;
  sectorDifficulty: SectorDifficulty;
  lastLootBlueprintId: string | null;
  remoteSessionCode: string;
  syncStatus: SyncStatus;
  remoteSyncAvailable: boolean;
  blueprintMarket: BlueprintMarket;
  tradeLog: BlueprintTradeLogEntry[];
  loadCharacter: (c: Character) => void;
  createNewCharacter: (c: Character) => Promise<void>;
  setRemoteSessionCode: (sessionCode: string) => void;
  loginAsPlayer: (characterId: string) => void;
  loginAsGM: (accessCode: string) => boolean;
  logout: () => void;
  selectCharacter: (characterId: string) => void;
  spendAP: (amount?: number) => void;
  restoreAP: () => void;
  applyDamageOvershield: (amount: number) => void;
  applyDamageHardware: (amount: number) => void;
  healHardware: (amount: number) => void;
  restoreOvershield: (amount: number) => void;
  unlockNode: (nodeId: string) => void;
  unlockSubSkill: (nodeId: string, subSkillId: string, cost: number) => void;
  refundSubSkill: (subSkillId: string, refund?: number) => void;
  generateEncounter: (spectacleScore: number) => void;
  rollEncounter: () => void;
  clearEncounter: () => void;
  damageMob: (mobId: string, amount: number) => void;
  healMob: (mobId: string, amount: number) => void;
  spendMobAP: (mobId: string, amount?: number) => void;
  restoreMobAP: (mobId: string) => void;
  removeMob: (mobId: string) => void;
  installBlueprint: (category: GearCategory, hardpointIndex: number, blueprintId: string) => void;
  transferBlueprint: (toCharacterId: string, blueprintId: string, amount?: number) => void;
  injectBlueprint: (toCharacterId: string, blueprintId: string, amount?: number) => void;
  setBlueprintPrice: (blueprintId: string, price: number) => void;
  setBlueprintAvailability: (blueprintId: string, amount: number) => void;
  setBlueprintWeightMultiplier: (blueprintId: string, multiplier: number) => void;
  setBlueprintLootEnabled: (blueprintId: string, enabled: boolean) => void;
  setThemeGate: (theme: GearTheme, unlocked: boolean) => void;
  setSectorDifficulty: (difficulty: SectorDifficulty) => void;
  rollSectorLoot: () => void;
  sponsorDrop: (toCharacterId: string) => void;
  lootOverride: (toCharacterId: string, blueprintId: string) => void;
  purchaseBlueprint: (blueprintId: string, amount?: number) => void;
  claimEncounterLoot: () => void;
  awardFragments: (toCharacterId: string, amount: number, note?: string) => void;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

export function CharacterProvider({
  children,
  initial,
  initialCharacters,
}: {
  children: ReactNode;
  initial?: Character;
  initialCharacters?: Character[];
}) {
  const seedCharacters = initialCharacters ?? (initial ? [initial] : undefined);
  const initialState = useMemo(() => createDefaultState(seedCharacters), [initial, initialCharacters]);
  const [state, dispatch] = useReducer(characterReducer, initialState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local-only');
  const character = getSelectedCharacter(state);
  const remoteSyncAvailable = isSupabaseConfigured();
  const clientId = useRef(`client-${Math.random().toString(36).slice(2, 10)}`).current;
  const lastRemoteAuthorRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPersistedState() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          if (isMounted) setHasHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as CharacterStoreState;
        if (isMounted) {
          dispatch({ type: 'HYDRATE_STORE', payload: hydrateStoreSnapshot(parsed, initialState) });
        }
      } catch {
        // Fall back to seeded state if persistence is unavailable or corrupted.
      } finally {
        if (isMounted) setHasHydrated(true);
      }
    }

    void loadPersistedState();

    return () => {
      isMounted = false;
    };
  }, [initialState]);

  useEffect(() => {
    if (!hasHydrated) return;

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hasHydrated, state]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!remoteSyncAvailable || !state.remoteSessionCode) {
      setSyncStatus('local-only');
      return;
    }

    setSyncStatus('connecting');

    const unsubscribe = subscribeToRemoteSession<RemoteSharedState>(
      state.remoteSessionCode,
      (envelope) => {
        if (envelope.updatedBy === clientId) {
          setSyncStatus('connected');
          return;
        }

        lastRemoteAuthorRef.current = envelope.updatedBy;
        dispatch({
          type: 'HYDRATE_REMOTE_STATE',
          payload: hydrateRemoteSharedState(envelope.payload, initialState),
        });
        setSyncStatus('connected');
      },
      () => setSyncStatus('error'),
    );

    if (!unsubscribe) {
      setSyncStatus('error');
      return;
    }

    setSyncStatus('connected');
    return unsubscribe;
  }, [clientId, hasHydrated, initialState, remoteSyncAvailable, state.remoteSessionCode]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!remoteSyncAvailable || !state.remoteSessionCode) return;
    if (lastRemoteAuthorRef.current && lastRemoteAuthorRef.current !== clientId) {
      lastRemoteAuthorRef.current = null;
      return;
    }

    const envelope: RemoteEnvelope<RemoteSharedState> = {
      sessionCode: state.remoteSessionCode,
      updatedAt: new Date().toISOString(),
      updatedBy: clientId,
      payload: {
        party: state.party,
        selectedCharacterId: state.selectedCharacterId,
        encounter: state.encounter,
        sectorDifficulty: state.sectorDifficulty,
        blueprintMarket: state.blueprintMarket,
        tradeLog: state.tradeLog,
        lastLootBlueprintId: state.lastLootBlueprintId,
      },
    };

    void publishRemoteSession(state.remoteSessionCode, envelope)
      .then(() => setSyncStatus('connected'))
      .catch(() => setSyncStatus('error'));
  }, [clientId, hasHydrated, remoteSyncAvailable, state.blueprintMarket, state.encounter, state.lastLootBlueprintId, state.party, state.remoteSessionCode, state.sectorDifficulty, state.selectedCharacterId, state.tradeLog]);

   const loadCharacter = useCallback((c: Character) => dispatch({ type: 'LOAD_CHARACTER', payload: c }), []);
   const createNewCharacter = useCallback(async (c: Character) => {
     dispatch({ type: 'ADD_CHARACTER', payload: c });
   }, []);
   const setRemoteSessionCode = useCallback((sessionCode: string) => dispatch({ type: 'SET_REMOTE_SESSION_CODE', sessionCode }), []);
   const loginAsPlayer = useCallback((characterId: string) => dispatch({ type: 'LOGIN_PLAYER', characterId }), []);
  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
  const selectCharacter = useCallback((characterId: string) => dispatch({ type: 'SET_SELECTED_CHARACTER', characterId }), []);
  const spendAP = useCallback((amount = 1) => dispatch({ type: 'SPEND_AP', amount }), []);
  const restoreAP = useCallback(() => dispatch({ type: 'RESTORE_AP' }), []);
  const applyDamageOvershield = useCallback((amount: number) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'APPLY_DAMAGE_OVERSHIELD', amount });
  }, [state.session.role]);
  const applyDamageHardware = useCallback((amount: number) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'APPLY_DAMAGE_HARDWARE', amount });
  }, [state.session.role]);
  const healHardware = useCallback((amount: number) => dispatch({ type: 'HEAL_HARDWARE', amount }), []);
  const restoreOvershield = useCallback((amount: number) => dispatch({ type: 'RESTORE_OVERSHIELD', amount }), []);
  const unlockNode = useCallback((nodeId: string) => dispatch({ type: 'UNLOCK_NODE', nodeId }), []);
  const unlockSubSkill = useCallback((nodeId: string, subSkillId: string, cost: number) => dispatch({ type: 'UNLOCK_SUB_SKILL', nodeId, subSkillId, cost }), []);
  const refundSubSkill = useCallback((subSkillId: string, refund = 1) => dispatch({ type: 'REFUND_SUB_SKILL', subSkillId, refund }), []);
  const generateEncounter = useCallback((spectacleScore: number) => dispatch({ type: 'SET_ENCOUNTER', payload: generateEncounterFromSpectacle(spectacleScore) }), []);
  const rollEncounter = useCallback(() => dispatch({ type: 'SET_ENCOUNTER', payload: rollSpectacleEncounter() }), []);
  const clearEncounter = useCallback(() => dispatch({ type: 'CLEAR_ENCOUNTER' }), []);
  const damageMob = useCallback((mobId: string, amount: number) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'DAMAGE_MOB', mobId, amount });
  }, [state.session.role]);
  const healMob = useCallback((mobId: string, amount: number) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'HEAL_MOB', mobId, amount });
  }, [state.session.role]);
  const spendMobAP = useCallback((mobId: string, amount = 1) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'SPEND_MOB_AP', mobId, amount });
  }, [state.session.role]);
  const restoreMobAP = useCallback((mobId: string) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'RESTORE_MOB_AP', mobId });
  }, [state.session.role]);
  const removeMob = useCallback((mobId: string) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'REMOVE_MOB', mobId });
  }, [state.session.role]);
  const installBlueprint = useCallback((category: GearCategory, hardpointIndex: number, blueprintId: string) => (
    dispatch({ type: 'INSTALL_BLUEPRINT', category, hardpointIndex, blueprintId })
  ), []);
  const transferBlueprint = useCallback((toCharacterId: string, blueprintId: string, amount = 1) => {
    dispatch({
      type: 'TRANSFER_BLUEPRINT',
      fromCharacterId: state.selectedCharacterId,
      toCharacterId,
      blueprintId,
      amount,
    });
  }, [state.selectedCharacterId]);
  const injectBlueprint = useCallback((toCharacterId: string, blueprintId: string, amount = 1) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'INJECT_BLUEPRINT', toCharacterId, blueprintId, amount });
  }, [state.session.role]);
  const setBlueprintPrice = useCallback((blueprintId: string, price: number) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'SET_BLUEPRINT_PRICE', blueprintId, price });
  }, [state.session.role]);
  const setBlueprintAvailability = useCallback((blueprintId: string, amount: number) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'SET_BLUEPRINT_AVAILABILITY', blueprintId, amount });
  }, [state.session.role]);
  const setBlueprintWeightMultiplier = useCallback((blueprintId: string, multiplier: number) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'SET_BLUEPRINT_WEIGHT_MULTIPLIER', blueprintId, multiplier });
  }, [state.session.role]);
  const setBlueprintLootEnabled = useCallback((blueprintId: string, enabled: boolean) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'SET_BLUEPRINT_LOOT_ENABLED', blueprintId, enabled });
  }, [state.session.role]);
  const setThemeGate = useCallback((theme: GearTheme, unlocked: boolean) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'SET_THEME_GATE', theme, unlocked });
  }, [state.session.role]);
  const setSectorDifficulty = useCallback((difficulty: SectorDifficulty) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'SET_SECTOR_DIFFICULTY', difficulty });
  }, [state.session.role]);
  const rollSectorLoot = useCallback(() => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'ROLL_SECTOR_LOOT' });
  }, [state.session.role]);
  const sponsorDrop = useCallback((toCharacterId: string) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'SPONSOR_DROP', toCharacterId });
  }, [state.session.role]);
  const lootOverride = useCallback((toCharacterId: string, blueprintId: string) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'LOOT_OVERRIDE', toCharacterId, blueprintId });
  }, [state.session.role]);
  const purchaseBlueprint = useCallback((blueprintId: string, amount = 1) => {
    dispatch({ type: 'PURCHASE_BLUEPRINT', blueprintId, amount });
  }, []);
  const claimEncounterLoot = useCallback(() => {
    dispatch({ type: 'CLAIM_ENCOUNTER_LOOT' });
  }, []);
  const awardFragments = useCallback((toCharacterId: string, amount: number, note?: string) => {
    if (state.session.role !== 'gm') return;
    dispatch({ type: 'AWARD_FRAGMENTS', toCharacterId, amount, note });
  }, [state.session.role]);

  const loginAsGM = useCallback((accessCode: string) => {
    const normalizedCode = accessCode.trim().toUpperCase();
    if (normalizedCode !== GM_ACCESS_CODE) {
      return false;
    }
    dispatch({ type: 'LOGIN_GM' });
    return true;
  }, []);

  if (!hasHydrated) {
    return null;
  }

  return (
    <CharacterContext.Provider
      value={{
        character,
        party: state.party,
        selectedCharacterId: state.selectedCharacterId,
        session: state.session,
        encounter: state.encounter,
        sectorDifficulty: state.sectorDifficulty,
        lastLootBlueprintId: state.lastLootBlueprintId,
        remoteSessionCode: state.remoteSessionCode,
        syncStatus,
        remoteSyncAvailable,
        blueprintMarket: state.blueprintMarket,
        tradeLog: state.tradeLog,
        loadCharacter,
        createNewCharacter,
        setRemoteSessionCode,
        loginAsPlayer,
        loginAsGM,
        logout,
        selectCharacter,
        spendAP,
        restoreAP,
        applyDamageOvershield,
        applyDamageHardware,
        healHardware,
        restoreOvershield,
        unlockNode,
        unlockSubSkill,
        refundSubSkill,
        generateEncounter,
        rollEncounter,
        clearEncounter,
        damageMob,
        healMob,
        spendMobAP,
        restoreMobAP,
        removeMob,
        installBlueprint,
        transferBlueprint,
        injectBlueprint,
        setBlueprintPrice,
        setBlueprintAvailability,
        setBlueprintWeightMultiplier,
        setBlueprintLootEnabled,
        setThemeGate,
        setSectorDifficulty,
        rollSectorLoot,
        sponsorDrop,
        lootOverride,
        purchaseBlueprint,
        claimEncounterLoot,
        awardFragments,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter(): CharacterContextValue {
  const ctx = useContext(CharacterContext);
  if (!ctx) throw new Error('useCharacter must be used inside <CharacterProvider>');
  return ctx;
}
