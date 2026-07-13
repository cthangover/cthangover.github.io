# Mod Load Order

The mod load order determines which mod's assets and data take priority when two or more
mods define the same resource. The system combines automatic dependency-based ordering with optional manual
user overrides.

## How ordering works

The game builds the final load order from three inputs, applied in strict priority:

```
1. depends (manifest.declared) → 2. Manual order (user preference) → 3. Alphabetical (deterministic fallback)
```

### Layer 1: `depends` — mandatory

Every mod may declare dependencies in `manifest.json`:

```json
{
  "id": "cooking",
  "depends": ["core"]
}
```

The mod that depends on another **always loads after** its dependency.
Dependencies are transitive: if `cooking` depends on `core`, and `hunting` depends on `cooking`,
then `core` → `cooking` → `hunting`.

This layer is **mandatory** — manual reordering cannot violate dependency constraints.

### Layer 2: Manual order — user preference

In the **Mods** menu (accessed from the main menu), each mod row has **▲▼** buttons.
Moving a mod up increases its priority (its files override mods below it);
moving a mod down decreases priority.

The manual order is saved per device in `user://mod_load_order.json` — it does **not**
transfer between devices or affect other players.

Move buttons are **disabled** when the move would violate a dependency:
you cannot move a mod above its own dependency, or below a mod that depends on it.

### Layer 3: Alphabetical — deterministic fallback

When two mods have no dependency relationship and no manual order preference,
they are sorted alphabetically by their mod ID. This guarantees the same result
on every device and operating system.

## Conflict resolution strategy

The game uses **"last wins"** — the mod later in the load order overrides earlier mods:

| Asset type | Resolution |
|---|---|
| **Textures** | Same-name texture from a later mod overrides the earlier one |
| **JSON data** (characters, items, recipes, quests, interactives) | Same `ID` entry from a later mod overrides the earlier one |
| **Files** (audio, prefabs, etc.) | Same-path file from a later mod overrides the earlier one |
| **Shaders** | Same-name shader from a later mod overrides the earlier one |
| **Locale strings** | Same key from a later translation file overrides the earlier one |
| **Scene definitions** | Multiple mods can contribute to the same scene — they accumulate |
| **Scenario definitions** | Accumulated and sorted by their own `priority` and `after` metadata |

When a resource is overridden, a `Warning` is logged so you can inspect the conflict.

## UI overview

The **Mods** menu shows:

- **Order number** — position in the load order (leftmost column)
- **Mod name, version, thumbnail**
- **Enable/disable toggle** — disable cascades to dependents
- **▲▼ buttons** — move mod up/down in load order
- **State** — button is greyed out when movement is blocked by dependency constraints

## Storage

Manual load order is saved to `user://mod_load_order.json` as a JSON array of mod IDs:

```json
["core", "cooking", "hunting", "ui_overhaul"]
```

New mods (not yet in the saved order) are placed alphabetically within their
dependency level — no manual position is assigned until the user explicitly reorders them.

Removed mods are cleaned up automatically on the next game launch.

## For mod creators

You don't need to change anything. The existing `depends` field in `manifest.json`
is the only mechanism the system needs to build the automatic order:

```json
{
  "id": "my_mod",
  "depends": ["core"],
  "version": "1.0.0"
}
```

No new manifest fields are required. Dependencies declared through `depends`
guarantee your mod loads after the mods it needs — automatically,
on every device, without user intervention.
