# Characters

JSON-defined characters — both player-controlled and enemies — with attributes, actions, skills, and loot tables.

## JSON structure

```jsonc
{
  // Unique character identifier — used in scenario conditions and battle init
  "Id":          "unique_id",
  // Locale key resolved from .properties files for the display name
  "Name":        "locale_key",
  // Path to avatar folder under avatars/
  "Image":       "avatars_path",
  // AI behaviour strategy: "base" for random actions, "boss" or any custom AI type
  "Behaviour":   "base",

  // Character level (determines scaling)
  "Level":       1,
  // Action points available per turn
  "Point":       1,
  // Maximum hit points
  "Health":      2000,
  // Base defence stat (reduces incoming damage)
  "Defence":     0,
  // Base attack stat (physical damage)
  "Attack":      500,
  // Physical damage modifier
  "Strength":    10,
  // Magical damage and healing modifier
  "Magic":       5,
  // Satiety stat — depletes over time, affects hunger system
  "Fullness":    100,
  // Experience points rewarded on defeat
  "Exp":         5,
  // % chance to recruit after defeating this character (0–100)
  "RecruitmentChance": 0,

  // Action IDs available to this character; supports $add, $remove, $set in patches
  "Actions":     ["physics/attack", "physics/defence"],
  // Loot table — items dropped on defeat; patches match by ItemId for per-field merge
  "Loot": [
    {
      // ID of the item to drop (references an item definition)
      "ItemId":      "food/wolf_meat",
      // Minimum number of this item to drop
      "MinCount":    1,
      // Maximum number of this item to drop
      "MaxCount":    1,
      // Drop probability (0–100)
      "Probability": 100
    }
  ]
}
```

## Field reference

| Field | Type | Description |
|---|---|---|
| `Id` | string | Unique character ID used in scenario conditions and battle init |
| `Name` | string | Locale key for display name (e.g. `characters/enemies/wolf`) |
| `Image` | string | Path to avatar folder under `avatars/` |
| `Behaviour` | string | AI behaviour class: `"base"` for random actions |
| `Level` | int | Character level |
| `Point` | int | Action points per turn |
| `Health` | int | Maximum HP |
| `Defence` | int | Base defence stat |
| `Attack` | int | Base attack stat |
| `Strength` | int | Physical damage modifier |
| `Magic` | int | Magical damage/heal modifier |
| `Fullness` | int | Satiety stat (depletes over time, affects hunger system) |
| `Exp` | int | XP reward on defeat |
| `RecruitmentChance` | int | % chance to recruit after defeat (0–100) |
| `Depravity` | int | Morality stat modifier |
| `Discipline` | int | Discipline stat modifier |
| `Actions` | array of string | Action IDs (e.g. `["physics/attack", "physics/defence"]`). Supports `$add`, `$remove`, `$set` in patches |
| `Loot` | array of objects | Item drops. Identity key: **`ItemId`** — patches match by this field for per-field merge |

## Real examples

### Player character — `core/characters/player/marao.json`

```jsonc
{
  // Player character ID — referenced throughout the game
  "Id": "Marao",
  // Locale key for the character's display name
  "Name": "characters/player/marao",
  // Path to the avatar folder for portraits
  "Image": "characters/player/marao",
  // Starting level
  "Level": 1,
  // Action points per turn
  "Point": 1,
  // Base health pool
  "Health": 16,
  // Base defence
  "Defence": 0,
  // Base attack damage
  "Attack": 5,
  // Available combat actions
  "Actions": ["physics/attack", "physics/defence"]
}
```

### Enemy — `core/characters/enemies/wolf_1.json`

```jsonc
{
  // Unique enemy ID for this wolf variant
  "Id": "wolf_1",
  // Locale key for the display name
  "Name": "characters/enemies/wolf",
  // Avatar folder path
  "Image": "characters/enemies/wolf_1",
  // AI behaviour: "base" picks random actions
  "Behaviour": "base",
  // Enemy level
  "Level": 1,
  // Action points per turn
  "Point": 1,
  // Hit points (low — this is a weak enemy)
  "Health": 15,
  // Base defence
  "Defence": 0,
  // Base attack damage
  "Attack": 4,
  // XP granted on defeat
  "Exp": 5,
  // Cannot be recruited
  "RecruitmentChance": 0,
  // Combat actions
  "Actions": ["physics/attack", "physics/defence"],
  // Loot table — drops wolf meat and branches
  "Loot": [
    { "ItemId": "food/wolf_meat", "MinCount": 1, "MaxCount": 1, "Probability": 100 },
    { "ItemId": "resource/branches", "MinCount": 1, "MaxCount": 1, "Probability": 100 }
  ]
}
```

### Boss enemy — `core/characters/enemies/werewolf_girl_1.json`

```jsonc
{
  // Unique boss ID
  "Id": "werewolf_girl_1",
  // Locale key for display name
  "Name": "characters/enemies/werewolf_girl",
  // Boss level
  "Level": 1,
  // Hit points (higher than regular enemies)
  "Health": 25,
  // Attack damage (stronger than regular enemies)
  "Attack": 8,
  // XP reward (significantly higher than regular enemies)
  "Exp": 50,
  // Morality stat modifier — recruiting this character increases depravity
  "Depravity": 5,
  // Discipline stat modifier — recruiting this character decreases discipline
  "Discipline": -10,
  // 50% chance to recruit after defeat
  "RecruitmentChance": 50,
  // Combat actions
  "Actions": ["physics/attack", "physics/defence"],
  // Loot table — drops 2 wolf meat at 100% probability
  "Loot": [
    { "ItemId": "food/wolf_meat", "MinCount": 2, "MaxCount": 2, "Probability": 100 }
  ]
}
```

## Character index files

The root `characters.json` registers characters using a `$ref` syntax:

```jsonc
{
  // $ref entries — each ${...} path expands to characters/{path}.json and its contents are merged in
  "Items": [
    "${player/marao}"
  ]
}
```

`${player/marao}` references `characters/player/marao.json` — its contents are merged in.

## Adding a new character from scratch

1. Create `characters/{type}/{id}.json` with all required fields
2. Add it to the index: `"${type/id}"` in `characters/characters.json`
3. Create avatar images under `avatars/{id}/`
4. Register locale keys for the name in `locale/en.properties`:
```
characters/{type}/{id} = My Character Name
```
5. Reference in battle init: `action battle.init enemies=my_char_id`
