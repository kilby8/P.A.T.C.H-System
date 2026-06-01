# P.A.T.C.H. SYSTEM — Agent Instructions

## Expo SDK version — read the right docs

This project uses **Expo SDK 56** (`"expo": "~56.0.8"`), React 19, React Native 0.85, TypeScript 6.
Before writing any Expo or RN API code read the exact versioned docs:
<https://docs.expo.dev/versions/v56.0.0/>

Do **not** reference SDK 50/51/52/53/54/55 APIs, hooks, or config keys — they may have moved or been removed.

---

## Where to work

All application source lives under `patch-system/`. Do **not** touch the Android native shell (`app/`, `build.gradle`, etc.) unless you are explicitly asked to work on the native layer.

Key paths:
| Path | Purpose |
|---|---|
| `src/models/` | Pure data models & factories (`Character`, `Gear`, `ArenaBestiary`, …) |
| `src/store/CharacterContext.tsx` | Single global store — `useReducer` + React Context + AsyncStorage + Supabase real-time sync |
| `src/components/` | All UI. Tab layout driven by `AppNavigator.tsx` |
| `src/utils/` | Stateless game-logic helpers (`encounterGenerator`, `lootEconomy`, `sectorLoot`) |
| `src/lib/` | External integrations (`supabase.ts`, `remoteSession.ts`) |
| `src/theme/theme.ts` | Design tokens — always import `Colors`, `Typography`, `Spacing` from here |
| `assets/docs/rules/` | Game rule source-of-truth TypeScript files |

---

## Architecture rules

### Store
- **One store, one context.** All mutable state lives in `CharacterContext`. Do not create additional contexts or Zustand/Redux stores.
- Add new state by extending `CharacterStoreState`, adding an `Action` variant, and handling it in `characterReducer`.
- Persist-worthy state is auto-saved to `AsyncStorage` under `patch-system/session-store/v1` on every state change (after hydration).
- Remote sync via Supabase publishes `RemoteSharedState` on every state change — keep that type in sync when you add party-level fields.

### GM authority
- **Only the GM role can mutate combat state.** The reducer enforces this with `if (state.session.role !== 'gm') return state` guards on: `APPLY_DAMAGE_OVERSHIELD`, `APPLY_DAMAGE_HARDWARE`, `DAMAGE_MOB`, `HEAL_MOB`, `SPEND_MOB_AP`, `RESTORE_MOB_AP`, `REMOVE_MOB`, `INJECT_BLUEPRINT`, `SET_BLUEPRINT_*`, `SET_THEME_GATE`, `SET_SECTOR_DIFFICULTY`, `ROLL_SECTOR_LOOT`, `SPONSOR_DROP`, `AWARD_FRAGMENTS`.
- The same guard is duplicated in the `useCallback` wrappers exposed on the context. Keep both in sync.
- GM access code is the constant `GM_ACCESS_CODE = 'PATCH-GM'` — do not hard-code the string elsewhere.

### Sessions / roles
Three roles: `'guest'` → `LoginTerminal` shown, `'player'` → player tabs, `'gm'` → GM tabs (extra GM tab).
Tab sets are defined in `AppNavigator.tsx` as `PLAYER_TABS` and `GM_TABS` — add new screens there.

---

## Models

### Character (`src/models/Character.ts`)
Call `hydrateCharacter()` after any structural change to a character object to recompute derived vitals (overshield max, hardwareIntegrity max, AP). Never write derived values by hand.

### Bestiary (`src/models/ArenaBestiary.ts`)
- Mobs are identified by a `templateId` string field.
- **Do not add portrait images** — the UI currently has no portrait rendering path.
- Mob stats (Integrity, AP) are derived at encounter-hydration time in `CharacterContext` via `getMobBaseIntegrity` / `getMobBaseAP` keyed on `role` string (e.g. `'Boss'`, `'Elite'`, `'Fodder'`). If you add a new role keyword make sure both functions handle it.

### Gear (`src/models/Gear.ts`)
Blueprints must declare `compatibleCategories: GearCategory[]` and a `theme: GearTheme`. The market's `themeGates` map controls availability — new themes need a default gate entry in `createDefaultBlueprintMarket`.

---

## Supabase / remote sync

`isSupabaseConfigured()` returns false when env vars are absent — the app works offline without them.
Do not add any Supabase calls outside `src/lib/`. Remote session data flows through `publishRemoteSession` / `subscribeToRemoteSession` only.

---

## Styling

- Use `StyleSheet.create` for all styles.
- Import design tokens from `src/theme/theme.ts` — no raw colour hex strings in component files.
- The aesthetic is monochrome terminal / cyberpunk. Prefer `Colors.cyan` as the accent, `Colors.amber` for warnings/logout, `Typography.mono` for all label text.

---

## Validation commands

Run from the `patch-system/` directory:

```powershell
# Type-check (no emit)
npx tsc --noEmit

# Start dev server (Expo Go or web)
npx expo start --web
```

There is no Jest config in this project — do not add test files unless asked.

---

## Hygiene

- Do not commit `node_modules/`, `.expo/`, or any `*.jks` / `*.keystore` files.
- `local.properties` (Android SDK path) lives at the repo root — do not edit it.
- Keep `package.json` dependency versions pinned to what is already there unless the task explicitly requires a version change.
