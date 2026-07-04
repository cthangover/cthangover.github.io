# Effects

Visual effect sprites used in battles, scene transitions, and interactive feedback. Managed via the `effect` command in the Scenario DSL.

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

## Adding a new effect

1. Create `effects/{name}.png` in your mod
2. If the effect is animated, use a spritesheet and register frame count via the C# `IEffect` interface (see `src/` docs)
3. Use in scenarios: `effect my_effect at center`

## Effect types available in the engine

The C# `IEffect` interface supports these built-in types:

| Type | Description |
|---|---|
| `SplashEffect` | Single-frame burst at a position, fades out |
| `ParticleEffect` | Multi-particle emitter with configurable spread, velocity, lifetime |
| `ScreenShake` | Screen shake with intensity + duration |
| `FlashEffect` | Full-screen color flash (e.g. white flash on hit) |
| `DeathDissolve` | Shader-based dissolve on character death |

## Example — spawning an effect from C#

Mentioned here for completeness; see `src/` for full C# integration:

```csharp
var effect = EffectFactory.Create("splash", new Vector2(0.5f, 0.5f));
effect.Play();
```

The `effect` scenario command wraps this factory call — no C# needed for basic usage.
