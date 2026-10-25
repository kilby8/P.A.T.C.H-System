# P.A.T.C.H. — Unreal Engine game

Real-time third-person squad shooter built on the P.A.T.C.H. System tabletop rules (`../../rulebook`).
Unreal Engine **5.8**, C++, Gameplay Ability System. Everything here is code and config: no binary
assets are needed to play, so placeholder shapes stand in for characters until art exists.

## Play it

1. Install **Unreal Engine 5.8** (Epic Games Launcher) and **Visual Studio 2022** with the
   "Game development with C++" workload.
2. Right-click `PatchGame.uproject` → **Generate Visual Studio project files**, then double-click
   `PatchGame.uproject`. Say **Yes** when it asks to build the `PatchGame` module.
   (Other 5.x versions should work: right-click the .uproject → Switch Unreal Engine version.)
3. In the editor: **File → New Level → Basic**, then **File → Save Current Level As…**
   `Content/Maps/L_Arena_Test`. This is the startup map the config points at.
4. Optional: drop a **Nav Mesh Bounds Volume** over the arena so enemies path around cover.
   Without one they still come straight at you.
5. Press **Play**. A grey-box arena spawns around the PlayerStart and the first wave goes live.

| Input | Keyboard / mouse | Gamepad |
| --- | --- | --- |
| Move / look | WASD / mouse | Sticks |
| Fire | Left mouse | Right trigger |
| Reload | R | X / Square |
| Sprint | Shift (hold) | Left stick click |
| Jump | Space | A / Cross |
| Reboot Shield (2 AP) | Q | Left bumper |
| Switch build (at full vitals) | 1 Ghost · 2 Specialist · 3 Brute | — |

## How the tabletop rules map to real time

All numbers come from `Content/Data/rules.json`, a copy of `rulebook/data/rules.json`.
After changing the rulebook, run `python game/PatchGame/Tools/sync_rules.py`.

| Tabletop rule | In the game |
| --- | --- |
| Overshield soaks damage first, then Hardware Integrity | `UPatchAttributeSet` splits every hit the same way |
| Hardware < 50% = Neural Shock (−1 AP) | Hardware bar turns orange, next AP refill is 1 short |
| Hardware 0 = Flatlined | Operator goes down; whole squad down = wipe, round restarts, build resets |
| Round = 6 s, AP refills each turn | AP refills every 6 s (`RoundSeconds`) |
| Reboot Shield (2 AP): 1d6 + SYSTEM Overshield | `UPatchGA_RebootShield`, a GAS ability on Q |
| Engagement: +1 per Overshield dmg, +2 per Hardware dmg, +1 per AP spent, payout +3 × Spectacle (min 4), 0–100 | Same, shown top right |
| Encounter end resets Overshields | Clearing a wave refills Overshields |
| Bestiary stat blocks | Enemies use Integrity, AP, Defense, attack pool, damage dice and move from their block |
| Enemy attack: roll pool vs your Defense | Each enemy shot rolls its pool (e.g. 4d6+1) against your Defense |
| Enemies act AP times per round | Attack cooldown = 6 s ÷ AP |
| Spectacle tiers (Dull Broadcast, Active Engagement, Prime-Time Surge) | The three waves of a round, with their exact force lists; Prime-Time Surge doubles enemy damage |
| Gear damage dice and range | The carbine rolls 2d6 per hit out to 60 m (`i-tactical-carbine`) |
| 1 m | 100 Unreal units |

Builds (`APatchPlayerCharacter::BuildProfiles`) are a first pass at the archetype zones:
GHOST (HARDWARE 2, SYSTEM 4, 19 Overshield, fast), SPECIALIST (3/3, 25), BRUTE (5/2, 31, slow).
Max Hardware and AP come from the rules' `derived` table.

## Code map

```
Source/PatchGame/
  Core/        module, native gameplay tags, GameMode (wave loop), GameState
  Rules/       FPatchDice ("4d6+1"), UPatchRulesSubsystem (loads rules.json), data structs
  Abilities/   attribute set (vitals), damage effect, combat helpers, Reboot Shield ability
  Characters/  shared base (ASC, round clock), player operator, bestiary enemy
  Weapons/     hitscan weapon driven by a gear entry (client aims, server traces)
  AI/          simple enemy brain (chase, hold range, attack)
  UI/          canvas HUD
  World/       grey-box arena generator
```

Networking is server-authoritative from the start (replicated attributes, server-side hits), so co-op
can be switched on later without a rewrite.

## Not done yet

Real character art and animation, weapon VFX/SFX, destructible environments, the broadcast/game-show
presentation, more weapons and abilities from the archetype tree, Behavior Trees per bestiary tactics,
the Condo screen, and the actual Sector 1 "Data Heist" map.

## Editor MCP bridge (optional)

To drive the editor from Claude, copy the `ue_mcp_bridge` plugin folder into `Plugins/` (it is
gitignored). The project lists it as optional, so machines without it still open fine.
