# Effects

Visual effect textures used in battles, scene transitions, and interactive feedback. Managed via the `effect` command in the Scenario DSL.

## Directory structure

```
effects/{effect_name}.png   (or .spritesheet)
```

## Real example — Core effects

From `mods/core/effects/`:

```
effects/
├── cards/            # card battle animations
│   ├── attack.png
│   ├── defence.png
│   ├── stun.png
│   └── damage.png
├── splash.png        # splash effect on hit
├── stun.png          # stun indicator overlay
└── death.png         # death dissolve effect
```

## Usage in the Scenario DSL

The `effect` command triggers a visual effect on screen:

```scenario
effect splash at center
effect stun on enemy
effect death on current
```

| Parameter | Values |
|---|---|
| `effect` | Effect name (matches filename in `effects/`) |
| Position | `at center`, `at left`, `at right`, `at 0.5 0.3` (UV coords) |
| Target | `on player`, `on enemy`, `on current`, `on all` |

## Effect types

Effects are primarily **texture-based** — the engine loads a `.png` (or `.spritesheet` for animated effects) from the mod's `effects/` group and renders it at the requested position/target. There are no predefined C# effect class names — the effect behavior is determined by the visual asset and its shader.

The `IEffect` C# interface in `Core/UI/Animation/` provides the base for any custom effect logic.

## Adding a new effect

1. Create `effects/{name}.png` in your mod
2. If the effect is animated, use a spritesheet and register frame count via the C# `IEffect` interface (see `src/` docs)
3. Use in scenarios: `effect my_effect at center`

## Example — spawning an effect from C#

```csharp
var texture = EffectFactory.Get("splash");
// Use the texture in an EffectController or EffectAnimator
```

The `effect` scenario command wraps the factory call — no C# needed for basic usage.
