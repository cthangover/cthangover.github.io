# Recruiting

The recruiting system manages character recruitment after battles. When a character is defeated with a non-zero `RecruitmentChance`, the game may offer to recruit them into the player's party.

## Data structures

### `Recruit`

| Property | Type | Description |
|---|---|---|
| `ID` | `string` | Unique instance ID (auto-generated Guid) |
| `CharacterID` | `string` | Template character ID (references a character definition) |
| `Properties` | `PropertyData` | Mutable state bag — stores per-recruit custom data |

`Properties` is a free-form key-value bag. The conventional key `"Health"` stores the recruit's current HP.

### `RecruitingData`

| Method/Property | Description |
|---|---|
| `Data` | `List<Recruit>` — current roster |
| `HasID(id)` | Check if a recruit exists |
| `GetByID(id)` | Look up a recruit by instance ID |
| `Add(id, characterID)` | Create a new recruit (auto-generates unique ID, initialises Health=10) |
| `Remove(id)` | Remove a recruit from the roster |

### `RecruitBehaviourRegistry`

Registry for recruit lifecycle hooks. When a recruit is added, all registered `IRecruitBehaviour` instances are configured on the new recruit.

### `RecruitTickController`

Periodic tick handler that processes recruit-related updates (e.g. hunger depletion, status regeneration). Runs on a timer.

## Recruitment flow

1. Character is defeated in battle
2. Engine checks the enemy's `RecruitmentChance` (0–100)
3. If the roll succeeds, a recruitment prompt is shown
4. On acceptance: `character.add_to_party` action fires → `CharacterData.AddCharacterToParty()` → creates `CharacterInfoData` entry
5. Character joins the battle set and becomes controllable

## Scenario integration

Use `character.add_to_party` to recruit directly from a scenario:

```scenario
action character.add_to_party type=Murakami
```

Show a notification without roster changes:

```scenario
action character.send_notification type=Murakami
```

## Custom recruit behaviour

Implement `IRecruitBehaviour` to add custom logic on recruit lifecycle events:

```csharp
public class MyRecruitBehaviour : IRecruitBehaviour
{
    public void Configure(Recruit recruit)
    {
        // Set initial properties, register hooks
        recruit.Properties.Set("loyalty", 50);
    }
}
```

## Relationship to skills

Recruited characters can acquire skills. The `SkillData` singleton tracks which skills are unlocked across all characters. Skills are not tied to individual recruits — they are a global unlock pool.
