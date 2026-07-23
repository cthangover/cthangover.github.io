# C# Source Code in Mods

Mods can include C# source files that are compiled at runtime via Roslyn. This allows mods to add new game mechanics, UI, battle systems, and scenario actions without modifying the kernel.

## How it works

1. Kernel discovers `.cs` files via `manifest.json` → `"sources": ["src/**/*.cs"]`
2. Files are loaded as text, compiled via Roslyn into a separate assembly
3. The assembly is loaded into the running game
4. Types implementing known interfaces (`IMod`, `IBattleCore`, `ISubscriptionHandler`, etc.) are auto-discovered

## Required interface — `IModInitializer`

Every mod with C# code implements this:

```csharp
public interface IModInitializer
{
    void OnModLoaded(string modId);
    void OnModResourcesReady();
}
```

## Real example — Card Battle Core

From `mods/card_battle/src/CardBattleCore.cs` (excerpt):

```csharp
namespace Cthangover.CardBattle
{
    public class CardBattleCore : IBattleCore
    {
        public string Id => "card_battle";

        public IActionExecutorProvider ActionProvider { get; }
            = new Actions.CardBattleActionProvider();

        public void Init(Character[] playerChars, Character[] enemyChars,
                         IBattleContext ctx)
        {
            _playerChars = playerChars;
            _ctx = ctx;

            // Deep-copy enemies so defeats are per-instance
            _enemyChars = new Character[enemyChars.Length];
            for (int i = 0; i < enemyChars.Length; i++)
                _enemyChars[i] = enemyChars[i]?.Copy() ?? enemyChars[i];

            ActionExecutorHub.Instance.SetActiveProvider(ActionProvider);

            var root = ctx.RootNode as Node;
            var panel = root.GetNodeOrNull<Control>("Panel") ?? root;

            _playerPanel = new BattleCardPanel { Name = "PlayerPanel" };
            panel.AddChild(_playerPanel);

            _enemyPanel = new BattleCardPanel
                { Name = "EnemyPanel", AlignType = "Right" };
            _enemyPanel.MouseFilter = Control.MouseFilterEnum.Ignore;
            panel.AddChild(_enemyPanel);

            _endTurnButton = new EndTurnButton { Name = "EndTurnButton" };
            _endTurnButton.OnPressed += OnEndTurnPressed;
            panel.AddChild(_endTurnButton);

            _cardController = new CardController { Name = "CardController" };
            panel.AddChild(_cardController);
        }

        public void Start()
        {
            // Position panels, calculate card scale, spawn character cards
            // ...
            StartPlayerTurn();
        }
    }
}
```

Key patterns visible here:
- **Deep copy** enemies to avoid shared state across battles
- **Godot node construction** via `new` + `AddChild` — the Roslyn assembly is separate from Godot's source generators, so `AddChild` must happen before setting `GlobalPosition`
- **Event subscriptions** via C# events (`OnPressed +=`, `OnCardDead +=`)
- **Async battle flow** via `async void` and `await ToSignal`

## Minimal mod from scratch

`mods/my_mod/src/MyMod.cs`:

```csharp
using Cthangover.Core.Mods;
using Cthangover.Core.Utils;
using Godot;

namespace Cthangover.MyMod
{
    public class MyMod : IModInitializer
    {
        public void OnModLoaded(string modId) { }

        public void OnModResourcesReady()
        {
            GameLogger.Log("MY_MOD", "Мой мод загружен!", LogLevel.Message);
        }
    }
}
```

`mods/my_mod/manifest.json`:

```jsonc
{
    "name": "My First Mod",                                // Human-readable mod name
    "author": "you",                                       // Author credit
    "description": "Learning how to write C# mods",        // Short description
    "sources": ["src/MyMod.cs"]                            // Glob patterns for C# source files to compile via Roslyn
}
```

## Key APIs available to mods

| Namespace / Class | Purpose |
|---|---|
| `Cthangover.Core.Mods.IModInitializer` | Mod entry point: `OnModLoaded(string)` + `OnModResourcesReady()` |
| `Cthangover.Core.Utils.GameLogger` | Structured logging: `GameLogger.Log(module, msg, level)` |
| `Cthangover.Core.Battle.IBattleCore` | Implement to create a battle system |
| `Cthangover.Core.Scenarios.IScenarioAction` | Implement to add `action` commands to the DSL |
| `Cthangover.Core.Scenes.ISubscriptionHandler` | Implement `OnEnter`/`OnExit` to hook into scenes |
| `Cthangover.Core.Mods.IModSettings` | Implement to expose settings in the in-game menu |
| `Cthangover.Core.Characters.Character` | Character data model — use `Copy()` for battles |
| `Cthangover.Core.Characters.Attributes` | Stats container: `Health`, `Point`, `Defence`, `Attack` |
| `Godot.Control` / `Godot.Node2D` | Standard Godot API — all available in mods |

## Logging

Always use `GameLogger` instead of `GD.Print`:

```csharp
GameLogger.Log("MY_MOD", "This is debug info", LogLevel.Debug);
GameLogger.Log("MY_MOD", "Something happened", LogLevel.Message);
GameLogger.Log("MY_MOD", "This might be a problem", LogLevel.Warning);
```

## Important: Godot input in mods

Because mod code compiles into a separate assembly (not processed by Godot's source generators), two rules apply:

1. **`AddChild` BEFORE `GlobalPosition`**: If you set `GlobalPosition` before `AddChild`, the node has no parent canvas transform and the position will be misinterpreted.

```csharp
// CORRECT
parent.AddChild(handle);
handle.GlobalPosition = target;

// WRONG
handle.GlobalPosition = target;
parent.AddChild(handle);
```

2. **Use `GuiInput` event instead of `_GuiInput` override**: Due to Godot dispatch quirks between assemblies, subscribe to the C# event rather than overriding the virtual method:

```csharp
public class MyHandle : ColorRect
{
    public MyHandle()
    {
        MouseFilter = Control.MouseFilterEnum.Stop;
        GuiInput += OnGuiInput;
    }

    private void OnGuiInput(InputEvent @event)
    {
        if (@event is InputEventMouseButton mb && mb.Pressed)
        {
            // handle click
            AcceptEvent();
        }
    }
}
```

## Compilation errors

Roslyn compilation errors appear in the game log. Common issues:
- Missing `using` directives — check namespace imports
- Reference to non-existent APIs — verify the kernel version supports the method
- Syntax errors — standard C# issues

The game will still run even if a mod's C# fails to compile. Non-C# assets (scenarios, items, etc.) from the same mod remain functional.
