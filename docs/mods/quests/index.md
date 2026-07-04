# Quests

Quest definitions with status-based progression and tag-based conditions that control which scenarios execute.

## JSON structure

```json
{
  "Items": [{
    "Id": "QuestId",
    "Name": "quest/locale/prefix",
    "StatusToDescription": {
      "0": "locale_key_for_status_0",
      "1": "locale_key_for_status_1",
      "2": "locale_key_for_status_2"
    }
  }]
}
```

## Field reference

| Field | Description |
|---|---|
| `Id` | Unique quest identifier (PascalCase). Used in scenario `condition:` expressions |
| `Name` | Locale key prefix for the quest's display name |
| `StatusToDescription` | Map of status integers to locale keys for the journal description at each stage |

## Real examples

### Prologue quest — `core/quests/quests.json`

```json
{
  "Items": [{
    "Id": "PrologQuest",
    "Name": "quest/prolog",
    "StatusToDescription": {
      "0": "quest/prolog/0",
      "1": "quest/prolog/1",
      "2": "quest/prolog/2"
    }
  }]
}
```

### Meeting Murakami quest — `murakami/quests/quests.json`

```json
{
  "Items": [{
    "Id": "MeetingMurakamiQuest",
    "Name": "quest/meeting/murakami",
    "StatusToDescription": {
      "0": "quest/meeting/murakami/0",
      "1": "quest/meeting/murakami/1",
      "2": "quest/meeting/murakami/2"
    }
  }]
}
```

## Quest tags

Quests use a tag system to track progress. Tags are set via scenario `action` commands:

```scenario
action battle.init scene=town_entry enemies=wolf_2,werewolf_girl_1 quest_id=MeetingMurakamiQuest new_tag=boss_battle
```

This sets the tag `boss_battle` on `MeetingMurakamiQuest` when the battle is initiated.

## Conditional scenarios

Scenarios use quest tags in their `condition:` metadata to decide whether they should run:

```scenario
scene: town_entry
priority: 20
condition: MeetingMurakamiQuest.hasTag("wolf_battle") && MeetingMurakamiQuest.notHasTag("boss_battle")
---
background "town/meetingmurakami/00002-1920617752"
text "[Wolf tracks lead to the door]" key=meeting/after_wolf/tracks
```

This scenario only executes if:
1. The player killed the wolf (`hasTag("wolf_battle")`)
2. The player has NOT yet fought the boss (`notHasTag("boss_battle")`)

## Quest status progression

Statuses are integers, typically 0→1→2... Each status can have its own journal description via `StatusToDescription`. The UI reads the current status and displays the corresponding locale key.

Status advancement happens via C# or scenario actions:

```scenario
action quest.set_status quest_id=PrologQuest status=1
```

## Locale keys

Quest names and descriptions are localizable:

```properties
quest/prolog = Prologue
quest/prolog/0 = It's cold, need to put something on...
quest/prolog/1 = I don't remember a thing... need to look around.
quest/prolog/2 = Found the recipe book. Need shelter before dark.

quest/meeting/murakami = The Girl at the Edge of Town
quest/meeting/murakami/0 = A wolf attacked a house on the outskirts. Investigate.
quest/meeting/murakami/1 = The girl inside needs help. Something's in the back room.
quest/meeting/murakami/2 = She's safe. Murakami joined the party.
```

## Adding a new quest

1. Create `quests/quests.json` in your mod
2. Define `Id`, `Name`, and `StatusToDescription`
3. Add locale keys for all status descriptions
4. Set tags via `action battle.init new_tag=X` or dedicated quest actions
5. Write scenarios with `condition:` that check quest state
6. Scenarios with higher `priority` take precedence when conditions match

## Quest conditions — full expression reference

See [Conditions](../scenes/scenarios/dsl/conditions/) for the complete condition expression language.
