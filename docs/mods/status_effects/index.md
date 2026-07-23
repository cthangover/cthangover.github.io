# Status Effects

Status effects are temporary buffs, debuffs, or crowd-control effects applied to characters during battle. Defined as JSON data and managed through `StatusEffectQueue` on each character.

## JSON structure

```jsonc
{
  // Unique status effect identifier — used to look up and apply effects
  "Id": "stun",
  // Locale key for the effect's display name in tooltips and the status panel
  "Name": "status/stun/name",
  // Locale key explaining what the effect does
  "Description": "status/stun/desc",
  // Effect category: "Buff" (positive), "Debuff" (negative), or "Stun" (skip turn)
  "Type": "Stun",
  // Number of turns the effect lasts before expiring
  "Duration": 2,
  // Behaviour set ID — resolved via StatusEffectActionFactory into IStatusActions
  "Actions": "stun",
  // Icon filename loaded from the characters mod group
  "Icon": "stun"
}
```

## Field reference

| Field | Type | Description |
|---|---|---|
| `Id` | string | Unique effect identifier |
| `Name` | string | Locale key for display name (shown in tooltips and status panel) |
| `Description` | string | Locale key explaining what the effect does |
| `Type` | string | `"Buff"`, `"Debuff"`, or `"Stun"` |
| `Duration` | int | Number of turns the effect lasts before expiring |
| `Actions` | string | Behaviour set ID, resolved via `StatusEffectActionFactory` into an `IStatusActions` instance |
| `Icon` | string | Icon filename loaded from the `characters` mod group |

## Status effect types

| Type | Description |
|---|---|
| `Buff` | Positive effect that benefits the bearer (e.g. stat boost, regeneration). Rendered with a friendly tint in the UI |
| `Debuff` | Negative effect that harms the bearer (e.g. damage over time, stat reduction). Rendered with a hostile tint |
| `Stun` | Crowd-control — causes the bearer to skip their turn. Checked by the battle engine via `StatusEffectQueue.HasStun()` |

## Status effect index file

Status effects are registered via an index file:

```jsonc
{
  // $ref entries — ${stun} expands to status_effects/stun.json with its contents merged in
  "Items": [
    "${stun}"
  ]
}
```

## Runtime behaviour

- Each character has a `StatusEffectQueue` — an ordered list of active status effects
- Effects tick down duration at the start of each turn; they expire when duration reaches 0
- The battle engine checks `HasStun()` to skip a stunned character's turn
- Effect behaviour callbacks are provided by `IStatusActions`, resolved from the `Actions` field via the factory

## Implementing custom status effect behaviour

Create an `IStatusActions` implementation and register it via `IStatusActionsProvider`:

```csharp
public class PoisonStatusActions : IStatusActions
{
    public void OnApply(Character target) { /* called when effect is applied */ }
    public void OnTick(Character target) { /* called each turn */ }
    public void OnExpire(Character target) { /* called when duration reaches 0 */ }
}
```

## Locale keys

```properties
status/stun/name = Stunned
status/stun/desc = Character skips their next turn
```
