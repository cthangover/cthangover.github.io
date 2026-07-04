# Scenario Actions

The `action` command bridges the DSL to C# game systems. It invokes named actions registered via the `IActionProvider` interface.

## Syntax

```scenario
action namespace.action_name param1=value1 param2=value2 ...
```

Parameters use `key=value` syntax (no spaces around `=`).

## Real examples

### Character actions

```scenario
action character.add_to_party type=Murakami
```

Adds the character `Murakami` to the player's party. `type=` matches the character's `Id` field in their JSON definition.

```scenario
action character.send_notification type=Murakami
```

Triggers the "new party member" UI notification for character `Murakami`.

### Battle initiation

```scenario
action battle.init scene=town_entry enemies=wolf_2,werewolf_girl_1 quest_id=MeetingMurakamiQuest new_tag=boss_battle
```

| Parameter | Description |
|---|---|
| `scene` | Scene to return to after battle |
| `enemies` | Comma-separated list of enemy character IDs |
| `quest_id` | Quest to update on battle outcome |
| `new_tag` | Tag to set on the quest when the battle starts |

### Cooking workbench

```scenario
action toggle_cooking_workbench
```

Toggles the cooking UI panel. No parameters — the action name alone is enough.

## Available action namespaces

### `character.*`

| Action | Parameters | Description |
|---|---|---|
| `character.add_to_party` | `type=CharId` | Add character to player's party |
| `character.remove_from_party` | `type=CharId` | Remove character from party |
| `character.send_notification` | `type=CharId` | Show "new member" notification |
| `character.set_stat` | `type=CharId stat=Health value=100` | Modify a character attribute |

### `battle.*`

| Action | Parameters | Description |
|---|---|---|
| `battle.init` | `scene`, `enemies`, `quest_id`, `new_tag` | Start a battle |
| `battle.end` | *(none)* | Force-end current battle |
| `battle.set_type` | `type=card_battle | ff_battle` | Switch battle system |

### `quest.*`

| Action | Parameters | Description |
|---|---|---|
| `quest.set_status` | `quest_id=Q status=2` | Set quest to a specific status |
| `quest.add_tag` | `quest_id=Q tag=T` | Add a tag to a quest |
| `quest.remove_tag` | `quest_id=Q tag=T` | Remove a tag |
| `quest.complete` | `quest_id=Q` | Mark quest as finished |

### `inventory.*`

| Action | Parameters | Description |
|---|---|---|
| `inventory.add` | `item=food/ration count=3` | Add items to inventory |
| `inventory.remove` | `item=food/wolf_meat count=1` | Remove items |
| `inventory.has` | `item=food/ration` | Check if item is present (used in conditions) |

### `scene.*`

| Action | Parameters | Description |
|---|---|---|
| `scene.set_flag` | `flag=met_marao value=true` | Set a scene-level flag |
| `scene.get_flag` | `flag=met_marao` | Read a flag (for conditions) |

## Adding a custom action from C#

Define an action class in your mod's `src/`:

```csharp
public class OpenTreasureChestAction : IScenarioAction
{
    public string Name => "treasure.open";

    public void Execute(ActionContext ctx)
    {
        var item = ctx.GetParam("item");
        var count = ctx.GetParamInt("count");
        InventoryService.Add(item, count);
        GameLogger.Log("SCENARIO", $"Gave player {count}x {item}");
    }
}
```

Register it in the action factory:

```csharp
public class MyActionProvider : IActionProvider
{
    public void Register(ActionRegistry reg)
    {
        reg.Add("treasure.open", () => new OpenTreasureChestAction());
    }
}
```

Then use in scenarios:

```scenario
action treasure.open item=food/ration count=5
```
