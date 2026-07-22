# GDScript in Mods

Mods can include `.gd` (GDScript) files alongside or instead of C# source code. GDScript files are compiled by Godot's built-in GDScript engine and can implement scenario actions, custom conditions, battle action executors, item actions, and mod initializers — all without Roslyn or a C# toolchain.

## How it works

1. Mod manifest declares `"gd_sources": ["scripts/*.gd"]`
2. On mod load, the kernel finds `.gd` files, compiles them via `GDScript.Reload()`, instantiates, and inspects methods
3. If the GDScript has known method patterns, it is auto-registered into the corresponding subsystem
4. No manual registration code needed — the kernel does it automatically

## manifest.json — gd_sources field

```json
{
  "id": "my_mod",
  "name": "My GDScript Mod",
  "version": "1.0.0",
  "gd_sources": ["scripts/*.gd"],
  "depends": ["core"]
}
```

| Field | Description |
|---|---|
| `gd_sources` | Glob patterns for `.gd` files. Supports `*` for one-level deep, no recursive `**` |

A single `.gd` file can implement multiple interfaces simultaneously — the kernel checks all known patterns on each script.

## Pages

- [Scenario Actions](actions.md) — actions + GDActionContext + service APIs
- [Custom Conditions](conditions.md) — condition leaf parsers
- [Battle Action Executors](battle.md) — custom battle logic
- [Item Actions](items.md) — item usage handlers
- [Mod Lifecycle](lifecycle.md) — initializers, event bus, publishing events

## Auto-detection summary

| GDScript methods | Registered as | Subsystem |
|---|---|---|
| `get_name()` + `run(ctx)` | `IScenarioAction` | Scenario action factory |
| `get_condition_name()` + `evaluate(flags, args)` | `ILeafParser` | Condition parser registry (priority over QuestParser) |
| `get_action_id()` + `execute(action, user, target)` | `IActionExecutor` | Battle action executor hub (global) |
| `get_item_action_id()` + `use(item)` | `IItemAction` | Item action factory |
| `on_mod_loaded(modId)` / `on_mod_resources_ready()` | `IModInitializer` | Mod initializer registry |
| `on_mod_event_*` | String event subscriber | Global event bus |

A single `.gd` file can implement multiple patterns simultaneously.

## Order among C# and GDScript

1. C# assemblies are compiled and loaded first (via Roslyn or precompiled DLLs)
2. GDScript files are loaded second
3. All registrations happen during the same load phase

GDScript **conditions** use `RegisterFirst` — they are inserted at the front of the leaf parser list, taking priority over the built-in `QuestParser`. This means `gds.is_rain` resolves before the parser tries to interpret `gds` as a quest ID.
