# Characters

JSON-defined characters — both player-controlled and enemies — with attributes, actions, skills, and loot tables.

## JSON structure

```json
{
  "Id":          "unique_id",
  "Name":        "locale_key",
  "Image":       "avatars_path",
  "Behaviour":   "base" | "boss" | ...,

  "Level":       1,
  "Point":       1,
  "Health":      2000,
  "Defence":     0,
  "Attack":      500,
  "Strength":    10,
  "Magic":       5,
  "Fullness":    100,
  "Exp":         5,
  "RecruitmentChance": 0,

  "Depravity":   5,
  "Discipline":  -10,

  "Actions":     "physics/attack,physics/defence",
  "Loot": [
    {
      "ItemId":      "food/wolf_meat",
      "MinCount":    1,
      "MaxCount":    1,
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
| `Actions` | string | Comma-separated action IDs (e.g. `"physics/attack,physics/defence"`) |
| `Loot` | array | Item drops with `ItemId`, `MinCount`, `MaxCount`, `Probability` |

## Real examples

### Player character — `core/characters/player/marao.json`

```json
{
  "Id": "Marao",
  "Name": "characters/player/marao",
  "Image": "characters/player/marao",
  "Level": 1,
  "Point": 1,
  "Health": 2000,
  "Defence": 0,
  "Attack": 500,
  "Actions": "physics/attack,physics/defence"
}
```

### Enemy — `core/characters/enemies/wolf_1.json`

```json
{
  "Id": "wolf_1",
  "Name": "characters/enemies/wolf",
  "Image": "characters/enemies/wolf_1",
  "Behaviour": "base",
  "Level": 1,
  "Point": 1,
  "Health": 15,
  "Defence": 0,
  "Attack": 4,
  "Exp": 5,
  "RecruitmentChance": 0,
  "Actions": "physics/attack,physics/defence",
  "Loot": [
    { "ItemId": "food/wolf_meat", "MinCount": 1, "MaxCount": 1, "Probability": 100 },
    { "ItemId": "resource/branches", "MinCount": 1, "MaxCount": 1, "Probability": 100 }
  ]
}
```

### Boss enemy — `core/characters/enemies/werewolf_girl_1.json`

```json
{
  "Id": "werewolf_girl_1",
  "Name": "characters/enemies/werewolf_girl",
  "Level": 1,
  "Health": 25,
  "Attack": 8,
  "Exp": 50,
  "Depravity": 5,
  "Discipline": -10,
  "RecruitmentChance": 50,
  "Actions": "physics/attack,physics/defence",
  "Loot": [
    { "ItemId": "food/wolf_meat", "MinCount": 2, "MaxCount": 2, "Probability": 100 }
  ]
}
```

## Character index files

The root `characters.json` registers characters using a `$ref` syntax:

```json
{
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
