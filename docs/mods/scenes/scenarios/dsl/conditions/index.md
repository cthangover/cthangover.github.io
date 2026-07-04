# Conditions — Quest Expression Language

The `condition:` metadata field uses a simple expression language to control which scenarios execute based on quest state, inventory, and scene flags.

## Syntax

```
condition: QuestId.method("arg") [&& || ! QuestId.method("arg") ...]
```

## Available methods

| Method | Description |
|---|---|
| `hasTag("tag")` | True if the quest has the specified tag |
| `notHasTag("tag")` | True if the quest does NOT have the tag |
| `status >= N` | True if quest status is N or higher |
| `status == N` | True if quest status equals N |
| `status < N` | True if quest status is less than N |

## Operators

| Operator | Description |
|---|---|
| `&&` | Logical AND — both sides must be true |
| `\|\|` | Logical OR — at least one side must be true |
| `!` | Logical NOT — negates the following expression |
| `()` | Grouping for precedence |

## Real example — Murakami quest chain

```scenario
scene: town_entry
priority: 20
condition: MeetingMurakamiQuest.hasTag("wolf_battle") && MeetingMurakamiQuest.notHasTag("boss_battle")
---
background "town/meetingmurakami/00002-1920617752"
text "[Wolf tracks lead straight to the doorstep]" key=meeting/after_wolf/tracks
# ... scenario continues ...
```

This scenario only fires **after** the player fought the wolf but **before** they fought the boss. It's the middle chapter of a three-part quest.

## More complex examples

### Multiple quest dependencies

```scenario
condition: PrologQuest.hasTag("met_marao") && MeetingMurakamiQuest.hasTag("recruited") && PlayerInventory.hasItem("key")
```

All three conditions must be met.

### Either/or branching

```scenario
condition: PrologQuest.hasTag("found_book") || PrologQuest.hasTag("found_map")
```

Runs if the player found either the book OR the map.

### Negation with OR

```scenario
condition: !PrologQuest.hasTag("tutorial_done") && (PrologQuest.hasTag("woke_up") || PrologQuest.hasTag("in_alley"))
```

The tutorial hasn't been done yet, but the player has woken up or is in the alley.

### Status-based progression

```scenario
condition: PrologQuest.status >= 2
```

Runs when PrologQuest reaches status 2 or higher.

## Scene flag conditions

Scene flags are boolean values set via `action scene.set_flag`:

```scenario
condition: scene.hasFlag("door_unlocked")
```

Set from another scenario:

```scenario
action scene.set_flag flag=door_unlocked value=true
```

## Inventory conditions

Check if the player has specific items:

```scenario
condition: PlayerInventory.hasItem("food/ration", 3)
condition: PlayerInventory.hasItem("weapon/iron_sword")
```

The optional second argument is the minimum count (default: 1).

## Party conditions

Check if a character is in the party:

```scenario
condition: PlayerParty.hasMember("Murakami")
condition: PlayerParty.notHasMember("Murakami")
```

## Condition evaluation order

1. Engine collects all scenarios for the current scene
2. Sorts by `priority` (ascending)
3. Evaluates each scenario's `condition:` in order
4. First scenario with a passing condition executes
5. If no condition passes, the lowest-priority scenario **without** a condition runs

This means:
- Put restrictive conditions on high-priority (low number) scenarios
- Put fallback scenarios at priority 10+ with no condition

```
priority: 5   condition: hasTag("secret_found")  → secret path
priority: 8   condition: hasTag("chapter_2")     → chapter 2 path
priority: 10  condition: none                     → default path (always runs if nothing else matches)
```
