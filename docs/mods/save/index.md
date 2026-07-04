# Save System

The game uses a serialization-based save/load system. Save files capture the complete game state: party roster, inventory, quests, skills, time, and scene position.

## Save file structure

Each save file is a snapshot of `SaveData`, serialized as JSON:

| Field | Type | Description |
|---|---|---|
| `Time` | `long` | In-game clock tick (minutes elapsed) |
| `LampRadius` | `float` | Player lamp light radius |
| `LampInfluence` | `float` | Player lamp influence (0.0–1.0) |
| `Characters` | `CharacterInfoData[]` | Recruited character snapshots |
| `Quests` | `QuestBase[]` | Quest instances with progress + tags |
| `Recruits` | `Recruit[]` | Recruiting entries |
| `BattleSet` | `string[]` | Active battle party character IDs |
| `Inventory` | `CItem[]` | Inventory item stacks |
| `Recipes` | `string[]` | Unlocked recipe IDs |
| `CurrentSceneName` | `string` | Active scene identifier |
| `SaveDateTime` | `DateTime` | UTC timestamp of the save |
| `GameTime` | `long` | Duplicate of Time for UI display |
| `CharacterCount` | `int` | Denormalized party size |
| `ActionPool` | `string[]` | Persistent action card pool IDs |
| `CompletedScenarioIds` | `string[]` | One-shot scenario IDs that have already executed |

## Character snapshot (CharacterInfoData)

Each saved character entry contains:

| Field | Description |
|---|---|
| `ID` | Instance GUID |
| `CharacterType` | Template character ID |
| `Level` | Current level |
| `Exp` | Experience points |
| `Attributes` | `CharacterAttributes` — Health, Defence, Attack, Strength, Magic, Point, Fullness, Depravity, Discipline |
| `ActionSlots` | Equipped action IDs |
| `ActionCooldowns` | Cooldown timers per action |

## Save service (SaveService)

The `SaveService` singleton handles all save/load operations:

- `Save(slot)` — Serialize current `RuntimeData` to a save file
- `Load(slot)` — Deserialize and restore game state
- `Delete(slot)` — Remove a save file
- `GetSaveSlots()` — List available save slots with metadata

## Save slots

Save slots are identified by number. Each slot stores:
- The `SaveData` JSON file
- A screenshot thumbnail for the save/load menu

## One-shot scenarios

Scenarios with `is_one_run: true` in their metadata are tracked in `CompletedScenarioIds`. Once executed, they will not run again for that save. This is used for tutorial scenes and one-time events.

## Adding custom data to saves

Mods can extend save data by subscribing to save/load events through the mod system. Character properties stored in `PropertyData` bags (e.g. recruit `Properties`) are automatically included in snapshots.
