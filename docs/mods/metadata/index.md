# Scene Event Metadata

The `[SceneEvent]` attribute allows mod C# code to hook into scene lifecycle events declaratively, without needing manifest subscriptions.

## `[SceneEvent]` attribute

Place the attribute on a static method in a mod assembly to register it for automatic execution:

```csharp
using Cthangover.Core.Scenes;

public static class MySceneHooks
{
    [SceneEvent("home_kitchen", Priority = 5)]
    public static void OnKitchenInit(SceneContext ctx)
    {
        // Runs when home_kitchen scene loads, before subscriptions
    }

    [SceneEvent("town_entry", After = "other_handler")]
    public static void OnTownEnter(SceneContext ctx)
    {
        // Runs after the handler named "other_handler"
    }
}
```

## Attribute parameters

| Parameter | Type | Description |
|---|---|---|
| `SceneName` | string | *(positional, required)* Target scene name |
| `Priority` | int | Execution order (lower = earlier). Default 0 |
| `After` | string | Name of another handler this should run after |
| `Condition` | string | Condition expression — handler only runs if expression is true |

## Registration

`SceneEventRegistry` uses reflection at assembly load time to discover all methods decorated with `[SceneEvent]`. No manual registration is needed — the attribute itself serves as registration.

## Execution order

1. Scene's default scenario runs
2. `on_enter` manifest subscriptions fire (by `priority`)
3. `[SceneEvent]` handlers fire (by `priority`)

On scene exit:
1. `on_exit` manifest subscriptions fire (by `priority`)

## vs Manifest subscriptions

| Feature | `[SceneEvent]` attribute | Manifest `subscriptions` |
|---|---|---|
| Registration | Attribute on method | JSON entry in `manifest.json` |
| Execution timing | After scenario, before/after subscriptions | On enter/exit trigger |
| UI injection | No | Yes (via `template` and wrappers) |
| Condition support | Yes (`Condition` param) | No |
| Priority ordering | Yes | Yes |
| Dependencies (`After`) | Yes | No |

Use `[SceneEvent]` for game-logic hooks. Use manifest `subscriptions` when you need UI injection through wrapper templates.
