# GDScript in Mods

Mods can include `.gd` (GDScript) files alongside or instead of C# source code. GDScript files are compiled by Godot's built-in GDScript engine and can implement scenario actions, custom conditions, battle action executors, item actions, and mod initializers — all without Roslyn or a C# toolchain.

## How it works

1. Mod manifest declares `"gd_sources": ["scripts/*.gd"]`
2. On mod load, the kernel finds `.gd` files, compiles them via `GDScript.Reload()`, instantiates, and inspects methods
3. If the GDScript has known method patterns, it is auto-registered into the corresponding subsystem
4. No manual registration code needed — the kernel does it automatically

## manifest.json — gd_sources field

```json
{
  "id": "my_mod",
  "name": "My GDScript Mod",
  "version": "1.0.0",
  "gd_sources": ["scripts/*.gd"],
  "depends": ["core"]
}
```

| Field | Description |
|---|---|
| `gd_sources` | Glob patterns for `.gd` files. Supports `*` for one-level deep, no recursive `**` |

A single `.gd` file can implement multiple interfaces simultaneously — the kernel checks all known patterns on each script.

---

## 1. Scenario Actions

A GDScript that has both `get_name()` and `run(ctx)` is registered as a **scenario action**. The `ctx` parameter is a `GDActionContext` providing access to all game subsystems.

### Minimal action

`scripts/greet.gd`:
```gdscript
extends RefCounted

func get_name():
	return "my.hello"

func run(ctx):
	ctx.Log("EVENT", "Hello from GDScript!")
```

Usage in `.scenario`:
```scenario
action my.hello
```

### Action with parameters

```gdscript
extends RefCounted

func get_name():
	return "my.announce"

func run(ctx):
	var name = ctx.GetParam("name")
	var count = ctx.GetParam("count")
	if name == "":
		name = "Unknown"
	ctx.Log("EVENT", "Announcing: " + name + " x" + count)
```

```scenario
action my.announce name=Marao count=3
```

### Action context (GDActionContext) API

The `ctx` object provides these properties and methods:

| Member | Type | Description |
|---|---|---|
| `GetParam(name)` | `string` | Read a parameter passed via `key=value` in the DSL |
| `Log(category, msg)` | `void` | Debug-level log |
| `LogWarning(category, msg)` | `void` | Warning-level log |
| `Quests` | `GDQuestService` | Full quest subsystem API |
| `Character` | `GDCharacterService` | Character party management |
| `Battle` | `GDBattleService` | Battle initiation |
| `Lighting` | `GDLightingService` | Lighting/depth map control |
| `Scene` | `GDSceneNodeService` | Scene node instantiation/removal |
| `Inventory` | `GDInventoryService` | Player inventory queries and mutations |
| `ModRegistry` | `GDModRegistryService` | Loaded mod introspection |

### Service API reference

#### GDQuestService

| Method | Description |
|---|---|
| `Exists(id)` | Check if a quest is registered |
| `SetStatus(id, status)` | Set quest lifecycle state (e.g. `"Active"`, `"Completed"`) |
| `SetDataStatus(id, level)` | Set numeric progress counter |
| `AddTag(id, tag)` | Attach a tag for conditional logic |
| `RemoveTag(id, tag)` | Remove a tag |
| `SendNotification(id)` | Trigger "Quest Updated" UI popup |

```gdscript
func run(ctx):
	var qid = ctx.GetParam("quest_id")
	if ctx.Quests.Exists(qid):
		ctx.Quests.SetStatus(qid, "Active")
		ctx.Quests.AddTag(qid, "started_by_gd")
		ctx.Quests.SendNotification(qid)
```

#### GDCharacterService

| Method | Description |
|---|---|
| `AddToParty(type)` | Add a character to the player's party |
| `SendNotification(type)` | Show "new party member" UI popup |

#### GDBattleService

| Method | Description |
|---|---|
| `Init(sceneType, enemies, questId, newTag)` | Construct battle data and prepare encounter |

Pass empty strings `""` for `questId`/`newTag` to omit them.

#### GDLightingService

| Method | Description |
|---|---|
| `ClearDepthMap()` | Reset lighting depth/albedo maps |
| `SetUseTime(useTime)` | Enable/disable time-of-day lighting |

#### GDSceneNodeService

| Method | Description |
|---|---|
| `Instantiate(scenePath, nodeName)` | Load a PackedScene and add to scene tree |
| `Remove(nodeName)` | Remove and free a named node |

#### GDInventoryService

| Method | Description |
|---|---|
| `HasItem(id)` | Check if item exists in inventory |
| `CheckCount(id)` | Get stack count of an item |
| `Add(id, count)` | Add items (default count=1) |
| `Remove(id, count)` | Remove items (returns `true` on success) |

#### GDModRegistryService

| Method | Description |
|---|---|
| `IsLoaded(modId)` | Check if a mod is loaded |
| `GetOrderedModIds()` | Get ordered list of loaded mod IDs |

### Full action example

```gdscript
extends RefCounted

func get_name():
	return "my.quest_and_char"

func run(ctx):
	var quest = ctx.GetParam("quest_id")
	var hero = ctx.GetParam("hero")

	ctx.Quests.SetStatus(quest, "Active")
	ctx.Quests.AddTag(quest, "gds_managed")
	ctx.Quests.SendNotification(quest)

	ctx.Character.AddToParty(hero)
	ctx.Character.SendNotification(hero)

	if ctx.ModRegistry.IsLoaded("core"):
		ctx.Log("EVENT", "Core is loaded, all good")
```

---

## 2. Custom Conditions

A GDScript that has both `get_condition_name()` and `evaluate(flags, args)` is registered as a **custom condition leaf parser**. Conditions can be used in the `condition:` metadata field of `.scenario` files.

### Minimal condition

`scripts/weather_check.gd`:
```gdscript
extends RefCounted

func get_condition_name():
	return "gds.is_rain"

func evaluate(flags, args):
	return flags.get("weather", "") == "rain"
```

Usage:
```scenario
scene: town_entry
priority: 5
condition: gds.is_rain
---
text "It's pouring outside."
end
```

### Condition with arguments

Arguments passed in parentheses become integer-keyed entries in the `args` dictionary:

```gdscript
extends RefCounted

func get_condition_name():
	return "gds.flag_equals"

func evaluate(flags, args):
	var expected = args.get("0", "")
	if expected == "":
		return false
	return flags.get("custom_flag", "") == expected
```

```scenario
condition: gds.flag_equals("victory")
```

### Condition parameters

| Parameter | Type | Description |
|---|---|---|
| `flags` | `Dictionary` | Scene flag dictionary (string → string). Populated by `set` DSL commands and action code. |
| `args` | `Dictionary` | Positional arguments from condition call (string index → string value). Empty if no parentheses. |

---

## 3. Battle Action Executors

A GDScript that has both `get_action_id()` and `execute(action, user, target)` is registered as a **battle action executor**. The `action_id` must match an `ActionCharacter.ID` in the character's JSON data.

### Executor contract

```gdscript
extends RefCounted

func get_action_id():
	return "my.custom_attack"

func execute(action, user, target):
	var result = GDBattleResult.new()

	var damage = user.AttackValue * 2 - target.DefenceValue
	if damage < 1:
		damage = 1

	result.TargetDamage = damage
	result.TargetDefence = target.DefenceValue
	result.Result = true

	return result
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `action` | `GDActionCharacter` | The ActionCharacter definition (Id, Name, Description, Type) |
| `user` | `GDCharacter` | The character performing the action |
| `target` | `GDCharacter` | The character receiving the action |

### GDActionCharacter fields

| Field | Type |
|---|---|
| `Id` | `string` |
| `Name` | `string` |
| `Description` | `string` |
| `Type` | `int` |

### GDCharacter fields

| Field | Type | Description |
|---|---|---|
| `Id` | `string` | Character identifier |
| `Name` | `string` | Display name |
| `Level` | `int` | Current level |
| `Exp` | `int` | Experience points |
| `RecruitmentChance` | `int` | Recruitment chance (0-100) |
| `HealthValue` / `HealthMax` | `int` | Current / max health |
| `DefenceValue` / `DefenceMax` | `int` | Current / max defence |
| `AttackValue` / `AttackMax` | `int` | Current / max attack |
| `StrengthValue` / `StrengthMax` | `int` | Current / max strength |
| `MagicValue` / `MagicMax` | `int` | Current / max magic |
| `PointValue` / `PointMax` | `int` | Current / max action points |

### GDBattleResult fields

| Field | Type | Description |
|---|---|---|
| `SourceDamage` | `int` | Damage dealt by source |
| `SourceDefence` | `int` | Source defence value |
| `TargetDamage` | `int` | Damage dealt to target |
| `TargetDefence` | `int` | Target defence value |
| `Result` | `bool` | Whether the action succeeded (default `true`) |

---

## 4. Item Actions

A GDScript that has both `get_item_action_id()` and `use(item)` is registered as an **item action**. The ID must match an `ItemAction` field in the item's JSON definition.

```gdscript
extends RefCounted

func get_item_action_id():
	return "my.heal_potion"

func use(item):
	print("[ITEM] Using: " + item.Name + " (id=" + item.Id + ")")
	# Perform healing logic here
	return true
```

### GDItem fields

| Field | Type | Description |
|---|---|---|
| `Id` | `string` | Item identifier |
| `Name` | `string` | Display name |
| `Description` | `string` | Tooltip text |
| `Cost` | `int` | Purchase price |
| `ItemType` | `int` | Item category flags |

---

## 5. Mod Initializers

A GDScript with `on_mod_loaded(modId)` or `on_mod_resources_ready()` is registered as a **mod initializer**. The kernel calls these lifecycle hooks:

```gdscript
extends RefCounted

func on_mod_loaded(mod_id):
	print("[MY_MOD] on_mod_loaded: " + mod_id)

func on_mod_resources_ready():
	print("[MY_MOD] All mod resources are ready")
```

| Hook | Called when |
|---|---|
| `on_mod_loaded(modId)` | Another mod finishes loading. Called for every mod (including itself). |
| `on_mod_resources_ready()` | All mods and their JSON resources are fully loaded. Called once. |

---

## Auto-detection summary

| GDScript methods | Registered as | Subsystem |
|---|---|---|
| `get_name()` + `run(ctx)` | `IScenarioAction` | Scenario action factory |
| `get_condition_name()` + `evaluate(flags, args)` | `ILeafParser` | Condition parser registry (priority over QuestParser) |
| `get_action_id()` + `execute(action, user, target)` | `IActionExecutor` | Battle action executor hub (global) |
| `get_item_action_id()` + `use(item)` | `IItemAction` | Item action factory |
| `on_mod_loaded(modId)` / `on_mod_resources_ready()` | `IModInitializer` | Mod initializer registry |

A single `.gd` file can implement multiple patterns simultaneously.

---

## Order among C# and GDScript

1. C# assemblies are compiled and loaded first (via Roslyn or precompiled DLLs)
2. GDScript files are loaded second
3. All registrations happen during the same load phase

GDScript **conditions** use `RegisterFirst` — they are inserted at the front of the leaf parser list, taking priority over the built-in `QuestParser`. This means `gds.is_rain` resolves before the parser tries to interpret `gds` as a quest ID.
