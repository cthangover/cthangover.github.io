# Array Operations & Identity Keys

## Array Operations

When a patch modifies a JSON **array** property (e.g. `Skills`, `Perks`, `Tags`), the suffix on the key determines how the arrays are merged:

| Key suffix | Behaviour |
|---|---|
| *(no suffix)* | **Overwrite** — replaces the entire array. Same semantics as scalar properties. |
| `$add` | **Add** — appends incoming elements to the existing array. If the property doesn't exist yet, creates it. |
| `$remove` | **Remove** — removes incoming elements from the existing array. If the property doesn't exist, no-op. |
| `$set` | **Overwrite** — explicit form, same as bare key. |

### Examples

**Base character definition** (in `characters/player/marao.json`):
```json
{ "Id": "Marao", "Skills": ["slash", "block"] }
```

**Add elements** — a cooking mod extends skills:
```json
// patches/characters.json
{ "Items": [{ "Id": "Marao", "Skills$add": ["cook"] }] }
```
Result: `["slash", "block", "cook"]`

**Remove elements** — a balance patch removes a skill:
```json
{ "Items": [{ "Id": "Marao", "Skills$remove": ["block"] }] }
```
Result: `["slash", "cook"]`

**Replace entirely** — a weapon overhaul resets skills:
```json
{ "Items": [{ "Id": "Marao", "Skills$set": ["sword", "shield_bash"] }] }
```
Result: `["sword", "shield_bash"]`

**Overwrite (bare key)** — equivalent to `$set`:
```json
{ "Items": [{ "Id": "Marao", "Skills": ["slash", "block"] }] }
```
Result: `["slash", "block"]` (previous values are discarded)

### Multi-layer example

All three operations can be combined across mod layers. Processing order follows the standard property pipeline (entity → wildcard `*` → specific `Id`):

```json
// Entity base: ["slash", "block"]

// Wildcard patch:
{ "Items": [{ "Id": "*", "Skills$add": ["dodge"] }] }
// → ["slash", "block", "dodge"]

// Specific patch:
{ "Items": [{ "Id": "Marao", "Skills$remove": ["slash"] }] }
// → ["block", "dodge"]
```

**No deduplication** is performed — if the same element is added twice, it appears twice.

### Universality

This system applies to **any** array property on any entity type — characters, items, and any mod-defined extras. There is no special-casing for specific property names.

```json
// Works for any array property:
{ "Items": [{ "Id": "sword/iron", "CraftingMaterials$add": ["steel_ingot"] }] }
{ "Items": [{ "Id": "*", "Tags$add": ["undead"] }] }
```

Scalar properties (int, float, bool, string) still use **last-wins** semantics — the suffix convention only affects JSON array values.

---

## Object Arrays with Identity Keys

> ⚠ **IMPORTANT CONVENTION: the identity field MUST be named `Id` (or end in `Id`, like `ItemId`, `QuestId`, `ActionId`).**
>
> The system **automatically detects** this field. No registration, no config, no C# code needed.

For arrays of **objects** (e.g. `Loot`, `Rewards`, `Drops`), the system matches elements by an **identity field** instead of raw JSON text. This enables **per-field merge**: a patch can update a single property of an existing object without repeating all its fields.

### How identity detection works

| Array element type | Detection | Identity field |
|---|---|---|
| `{"Id": "gold", ...}` | First field named `Id` → detected | `Id` |
| `{"ItemId": "sword", ...}` | No `Id`, but field ending in `Id` → detected | `ItemId` |
| `{"QuestId": "q1", ...}` | Same logic | `QuestId` |
| `{"Name": "test"}` | Nothing matches → no identity | Raw text compare |
| `"string"` or `42` | Not an object → no identity | Raw text compare |

**The system prioritises exact `"Id"` over suffix matches.** If your object has both `Id` and `ItemId`, `Id` wins.

### Per-field merge example

```json
// Base entity:
{ "Loot": [
    {"ItemId": "food/wolf_meat", "MinCount": 1, "MaxCount": 1, "Probability": 100},
    {"ItemId": "resource/branches", "MinCount": 1, "MaxCount": 1, "Probability": 100}
]}

// Balance patch:
{ "Items": [{ "Id": "wolf_1",
    "Loot$add": [{"ItemId": "food/ration", "Probability": 50}],
    "Loot$remove": [{"ItemId": "resource/branches"}]
}]}

// Result:
// → food/wolf_meat: unchanged
// → resource/branches: removed (matched by ItemId)
// → food/ration: added as new entry
```

### Per-field property overwrite

When `$add` finds an existing element with the same identity value, the patch **overwrites only the specified properties**, preserving unmentioned fields from the base:

```json
// Base: {"ItemId": "food/bread", "MinCount": 1, "MaxCount": 2, "Probability": 50}
// Patch: {"Loot$add": [{"ItemId": "food/bread", "Probability": 80}]}
// Result: {"ItemId": "food/bread", "MinCount": 1, "MaxCount": 2, "Probability": 80}
//         (Probability overridden, MinCount/MaxCount preserved from base)
```

### Removing with identity key

The `$remove` operation only needs the identity field — other fields in the remove object are ignored:

```json
{ "Items": [{ "Id": "wolf_1", "Loot$remove": [{"ItemId": "food/wolf_meat"}] }] }
```

### Mod-defined arrays — no config needed

Any mod can introduce a new array of objects in a character or item JSON, and patches immediately work with per-field merge — as long as objects have an `Id` or `*Id` field:

```json
// Mod A defines a quest with rewards:
{
  "Id": "daily_hunt",
  "Name": "Daily Hunt",
  "Rewards": [
    {"Id": "gold", "Count": 100},
    {"Id": "exp", "Count": 50}
  ]
}

// Mod B patches the rewards without knowing Mod A's internals:
{ "Items": [{ "Id": "daily_hunt",
    "Rewards$add": [{"Id": "gold", "Count": 200}],   // overwrites Count, preserves Id
    "Rewards$remove": [{"Id": "exp"}]                 // removes entire exp entry
}]}

// Result Rewards: [{"Id": "gold", "Count": 200}]
```

**No C# code, no interface, no registration.** The convention `Id` / `*Id` is all that's needed.
