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
  GeneratedEncounter,
  EncounterSpawn,
  generateEncounterFromSpectacle,
  rollSpectacleEncounter,
} from '../utils/encounterGenerator';
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
}

interface CharacterStoreState {
  party: Character[];
  selectedCharacterId: string;
  session: SessionState;
  encounter: ActiveEncounter | null;
  remoteSessionCode: string;
}

type Action =
  | { type: 'HYDRATE_STORE'; payload: CharacterStoreState }
  | { type: 'HYDRATE_REMOTE_STATE'; payload: Pick<CharacterStoreState, 'party' | 'selectedCharacterId' | 'encounter'> }
  | { type: 'LOAD_CHARACTER'; payload: Character }
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
  | { type: 'REMOVE_MOB'; mobId: string };

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
  };
}

function sanitizeEncounter(encounter: ActiveEncounter | null | undefined): ActiveEncounter | null {
  if (!encounter) return null;

  return {
    spectacleScore: encounter.spectacleScore,
    bracketLabel: encounter.bracketLabel,
    modifiers: encounter.modifiers ?? [],
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
  };
}

interface RemoteSharedState {
  party: Character[];
  selectedCharacterId: string;
  encounter: ActiveEncounter | null;
}

function hydrateRemoteSharedState(
  payload: RemoteSharedState,
  fallbackState: CharacterStoreState,
): Pick<CharacterStoreState, 'party' | 'selectedCharacterId' | 'encounter'> {
  const party = (payload.party?.length ? payload.party : fallbackState.party).map(hydrateCharacter);
  const selectedCharacterId = party.some((character) => character.id === payload.selectedCharacterId)
    ? payload.selectedCharacterId
    : party[0].id;

  return {
    party,
    selectedCharacterId,
    encounter: sanitizeEncounter(payload.encounter),
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
      return updateSelectedCharacter(state, (character) => ({
        ...character,
        currentAP: Math.max(0, character.currentAP - action.amount),
      }));

    case 'RESTORE_AP':
      return updateSelectedCharacter(state, (character) => ({
        ...character,
        currentAP: getStartingAP(character),
      }));

    case 'APPLY_DAMAGE_OVERSHIELD':
      return updateSelectedCharacter(state, (character) => hydrateCharacter({
        ...character,
        overshield: clampVital(character.overshield, -action.amount),
      }));

    case 'APPLY_DAMAGE_HARDWARE':
      return updateSelectedCharacter(state, (character) => syncVitalsAndAP(character, {
        ...character,
        hardwareIntegrity: clampVital(character.hardwareIntegrity, -action.amount),
      }));

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
      return {
        ...state,
        encounter: state.encounter
          ? {
              ...state.encounter,
              mobs: state.encounter.mobs.filter((mob) => mob.id !== action.mobId),
            }
          : null,
      };

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
  remoteSessionCode: string;
  syncStatus: SyncStatus;
  remoteSyncAvailable: boolean;
  loadCharacter: (c: Character) => void;
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
      },
    };

    void publishRemoteSession(state.remoteSessionCode, envelope)
      .then(() => setSyncStatus('connected'))
      .catch(() => setSyncStatus('error'));
  }, [clientId, hasHydrated, remoteSyncAvailable, state.encounter, state.party, state.remoteSessionCode, state.selectedCharacterId]);

  const loadCharacter = useCallback((c: Character) => dispatch({ type: 'LOAD_CHARACTER', payload: c }), []);
  const setRemoteSessionCode = useCallback((sessionCode: string) => dispatch({ type: 'SET_REMOTE_SESSION_CODE', sessionCode }), []);
  const loginAsPlayer = useCallback((characterId: string) => dispatch({ type: 'LOGIN_PLAYER', characterId }), []);
  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
  const selectCharacter = useCallback((characterId: string) => dispatch({ type: 'SET_SELECTED_CHARACTER', characterId }), []);
  const spendAP = useCallback((amount = 1) => dispatch({ type: 'SPEND_AP', amount }), []);
  const restoreAP = useCallback(() => dispatch({ type: 'RESTORE_AP' }), []);
  const applyDamageOvershield = useCallback((amount: number) => dispatch({ type: 'APPLY_DAMAGE_OVERSHIELD', amount }), []);
  const applyDamageHardware = useCallback((amount: number) => dispatch({ type: 'APPLY_DAMAGE_HARDWARE', amount }), []);
  const healHardware = useCallback((amount: number) => dispatch({ type: 'HEAL_HARDWARE', amount }), []);
  const restoreOvershield = useCallback((amount: number) => dispatch({ type: 'RESTORE_OVERSHIELD', amount }), []);
  const unlockNode = useCallback((nodeId: string) => dispatch({ type: 'UNLOCK_NODE', nodeId }), []);
  const unlockSubSkill = useCallback((nodeId: string, subSkillId: string, cost: number) => dispatch({ type: 'UNLOCK_SUB_SKILL', nodeId, subSkillId, cost }), []);
  const refundSubSkill = useCallback((subSkillId: string, refund = 1) => dispatch({ type: 'REFUND_SUB_SKILL', subSkillId, refund }), []);
  const generateEncounter = useCallback((spectacleScore: number) => dispatch({ type: 'SET_ENCOUNTER', payload: generateEncounterFromSpectacle(spectacleScore) }), []);
  const rollEncounter = useCallback(() => dispatch({ type: 'SET_ENCOUNTER', payload: rollSpectacleEncounter() }), []);
  const clearEncounter = useCallback(() => dispatch({ type: 'CLEAR_ENCOUNTER' }), []);
  const damageMob = useCallback((mobId: string, amount: number) => dispatch({ type: 'DAMAGE_MOB', mobId, amount }), []);
  const healMob = useCallback((mobId: string, amount: number) => dispatch({ type: 'HEAL_MOB', mobId, amount }), []);
  const spendMobAP = useCallback((mobId: string, amount = 1) => dispatch({ type: 'SPEND_MOB_AP', mobId, amount }), []);
  const restoreMobAP = useCallback((mobId: string) => dispatch({ type: 'RESTORE_MOB_AP', mobId }), []);
  const removeMob = useCallback((mobId: string) => dispatch({ type: 'REMOVE_MOB', mobId }), []);

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
        remoteSessionCode: state.remoteSessionCode,
        syncStatus,
        remoteSyncAvailable,
        loadCharacter,
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
