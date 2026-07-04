# Configs — manifest.json

Every mod needs a manifest and optionally a properties file. These define the mod's identity, dependencies, C# source compilation rules, and scene lifecycle hooks.

## `manifest.json` — full schema

```json
{
  "name": "MyMod",
  "author": "author_name",
  "description": "What this mod does",
  "sources": ["src/*.cs", "src/**/*.cs"],
  "depends": ["core", "interface"],
  "subscriptions": [
    {
      "scene": "home_kitchen",
      "template": "default",
      "code": "my_init_handler",
      "trigger": "on_enter",
      "priority": 10
    }
  ]
}
```

### Field reference

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Human-readable mod name |
| `author` | No | Author identifier |
| `description` | No | Short description |
| `sources` | No | Glob patterns for C# files to compile via Roslyn |
| `depends` | No | List of mod IDs that must be loaded before this mod |
| `subscriptions` | No | Scene lifecycle hooks (see below) |

### Sources — glob patterns

- `"src/*.cs"` — all `.cs` files in `src/`, one level deep
- `"src/**/*.cs"` — all `.cs` files recursively

### Dependencies

```json
"depends": ["core"]
```

The kernel resolves dependencies in topological order. Circular dependencies cause a load error. `core` is always loaded first.

### Subscriptions — scene lifecycle hooks

Subscriptions let mods run C# code when a scene loads or unloads:

```json
"subscriptions": [
  {
    "scene": "home_kitchen",
    "template": "default",
    "code": "cooking_panel_init",
    "trigger": "on_enter",
    "priority": 10
  },
  {
    "scene": "home_kitchen",
    "template": "default",
    "code": "dinner_tools_hide",
    "trigger": "on_exit",
    "priority": 10
  }
]
```

| Field | Description |
|---|---|
| `scene` | Scene name to hook into |
| `template` | UI template name (`"default"` for standard layout) |
| `code` | Handler class name registered via `ISubscriptionHandler` |
| `trigger` | `"on_enter"` or `"on_exit"` |
| `priority` | Execution order (lower = runs first). Multiple mods can subscribe to the same scene |

The corresponding C# class implements the subscription interface and is discovered at runtime:

```csharp
public class MySceneHandler : ISubscriptionHandler
{
    public void OnEnter(SceneContext ctx) { /* setup UI, spawn objects */ }
    public void OnExit(SceneContext ctx)  { /* cleanup */ }
}
```

## Real example — Cooking mod

From `mods/cooking/manifest.json`:

```json
{
  "name": "Cooking",
  "author": "ct",
  "description": "Cooking mechanic - full autonomous mod",
  "sources": ["src/*.cs"],
  "subscriptions": [
    { "scene": "home_kitchen", "template": "default", "code": "cooking_panel_init", "trigger": "on_enter", "priority": 10 },
    { "scene": "home_kitchen", "template": "default", "code": "dinner_tools_show", "trigger": "on_enter", "priority": 20 },
    { "scene": "home_kitchen", "template": "default", "code": "dinner_tools_hide", "trigger": "on_exit", "priority": 10 }
  ]
}
```

Three handlers run on the `home_kitchen` scene: `cooking_panel_init` (priority 10) runs before `dinner_tools_show` (priority 20). `dinner_tools_hide` runs when leaving the kitchen.

## Real example — Multiple dependencies

From `mods/test_interactives/manifest.json`:

```json
{
  "name": "Test Interactives",
  "author": "ct",
  "description": "Test mod demonstrating the interactive object system",
  "depends": ["core", "interface"]
}
```

## Creating a new mod — minimal manifest

```json
{
  "name": "MyFirstMod",
  "author": "you",
  "description": "Adds a custom item and a new scenario option"
}
```

Save as `mods/my_first_mod/manifest.json`. The mod is now loaded by the kernel. Even without `sources` or `subscriptions`, the mod's scenarios, items, and other data files are discovered automatically from their conventional locations.
