# Battle System

The battle engine is a pluggable, mod-driven system. Each battle ruleset is implemented as a mod (e.g. `card_battle`, `ff_battle`) following the `IBattleCore` interface. Battles are initiated from scenario scripts via `action battle.init`.

## Architecture overview

```
Scenario DSL        Core/Actions        Core/Battle             Mod (e.g. card_battle)
──────────────      ────────────        ───────────             ──────────────────────
action battle.init  BattleInitAction    BattleData              IBattleCore.Init()
  ├─ scene=           ├─ ctx.GetParam     ├─ Scene               ├─ Character panels
  ├─ enemies=         ├─ ctx.Battle.Init  ├─ EnemiesCards        ├─ Action executors
  ├─ quest_id=        └─ Log event        ├─ Quest/NewTag        ├─ UI widgets
  └─ new_tag=                             ├─ Background/Lighting └─ Status effects
                                          └─ ActiveBattleCore
```

## Key interfaces

### `IBattleCore` — Combat ruleset

Every battle system mod defines a class implementing `IBattleCore`:

| Member | Description |
|---|---|
| `Id` | Unique string ID used by `battle.set_core` |
| `ActionProvider` | Returns `IActionProvider` for registering custom scenario actions |
| `Init(BattleData data)` | Called when battle starts — sets up UI, spawns enemies |
| `Start()` | Called after Init — begins the battle loop |

### `IActionExecutor` — Ability resolution

Each battle action type (attack, defence, stun, item, etc.) has an executor:

| Member | Description |
|---|---|
| `ActionId` | Unique action identifier |
| `Execute(action, user, target)` | Resolves the action against target |

Executors are registered through `ActionExecutorHub`, which routes actions by ID at runtime.

### `IBattleContext` — Battle state

Provides read access to current battle participants, turn order, and active effects.

## Battle initialization flow

1. Scenario runs `action battle.set_core core=CardBattle` — selects ruleset
2. Scenario runs `action battle.init scene=... enemies=... quest_id=... new_tag=...`
3. `BattleInitAction` reads dialog variables, calls `BattleService.Init()`
4. `BattleData` captures current background and lighting state
5. `ModManager` resolves enemy character IDs to `Character` instances
6. Active `IBattleCore.Init()` is called — mod sets up its UI panels
7. `IBattleCore.Start()` begins the battle loop

**Important**: `battle.init` must run *after* the background has been set in the scenario, otherwise the battle gets a null backdrop.

## Status effects

Status effects (buff, debuff, stun) are applied during battle via the `StatusEffectQueue` on each character. Effects have a duration in turns and expire automatically.

See [Status Effects](../status_effects/) for the JSON definition format.

## Creating a custom battle system mod

1. Create a new mod with `manifest.json`:
   ```json
   {
     "name": "MyBattle",
     "description": "Custom battle system",
     "sources": ["src/**/*.cs"],
     "depends": ["core"]
   }
   ```

2. Implement `IBattleCore`:
   ```csharp
   public class MyBattleCore : IBattleCore
   {
       public string Id => "MyBattle";
       public IActionProvider ActionProvider => new MyActionProvider();

       public void Init(BattleData data)
       {
           // Create enemy panels, character widgets, action buttons
       }

       public void Start()
       {
           // Begin turn loop
       }
   }
   ```

3. Implement `IActionProvider` to register your action executors:
   ```csharp
   public class MyActionProvider : IActionProvider
   {
       public void Register(ActionRegistry reg)
       {
           reg.Add("mybattle.attack", () => new MyAttackExecutor());
           reg.Add("mybattle.defend", () => new MyDefendExecutor());
       }
   }
   ```

4. In scenarios, select your core before initiating battle:
   ```scenario
   action battle.set_core core=MyBattle
   action battle.init scene=town_entry enemies=wolf_1
   ```

## Battle-related Godot scenes

| Path | Purpose |
|---|---|
| `scenes/battle/battle.tscn` | Main battle scene container |
| `scenes/battle/winground.tscn` | Victory screen overlay |
| `scenes/battle/deadground.tscn` | Defeat screen overlay |
| `scenes/battle/exp_report_card.tscn` | Experience/loot report |
