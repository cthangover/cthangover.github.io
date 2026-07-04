# Scenarios — DSL Reference

`.scenario` files are the heart of the game's narrative system. Each file contains a metadata header, a `---` separator, and a script body written in a custom domain-specific language (DSL).

## File structure

```scenario
scene: target_scene_name
priority: 10
condition: QuestId.hasTag("tag_name")
save_allowed: true
is_one_run: false
light_use_time: true
---
# Script body starts after ---
background "path/to/bg"
text "- Hello, traveller." key=locale_key first=marao/normal
select "[What do you do?]" key=choice_key
option "Ask about the town" key=opt_1 -> :town
option "Leave" key=opt_2 -> :exit
:exit
switch_scene home_outside
end
```

## Metadata fields (before `---`)

| Field | Type | Default | Description |
|---|---|---|---|
| `scene` | string | *(required)* | Scene this scenario targets. Multiple scenario files can target the same scene |
| `priority` | int | `10` | Execution order — **lower runs first**. Mod scenarios use low numbers to override defaults |
| `condition` | expression | *(none)* | Quest-condition expression. Scenario only runs if true. See `dsl/conditions/` |
| `save_allowed` | bool | `false` | Whether the player can save the game from this scene |
| `is_one_run` | bool | `false` | If true, the scenario runs only once per playthrough. After execution, it's skipped forever |
| `light_use_time` | bool | `false` | If true, the lighting system uses the in-game time-of-day for light colors/angles |

## Real examples

### Default kitchen scenario (core)

```scenario
scene: home_kitchen
priority: 10
---
light_set [{"x":0.43,"y":0.58,"radius":500,"influence":1,"color":"#ffff00"},{"x":0.10,"y":0.27,"radius":500,"influence":1,"color":"#ffff00"}]
select "A room equipped as a kitchen" key=rooms/kitchen/prompt
option "Leave" key=rooms/kitchen/opt_exit -> :exit

:exit
switch_scene home_vestibule
end
```

### Cooking mod override (higher priority = runs first)

```scenario
scene: home_kitchen
priority: 5
---
light_set [{"x":0.43,"y":0.58,"radius":500,"influence":1,"color":"#ffff00"}]
select "A room equipped as a kitchen" key=rooms/kitchen/prompt
option "Leave" key=rooms/kitchen/opt_exit -> :exit
option "Cook" key=rooms/kitchen/opt_cook -> :cook

:exit
switch_scene home_vestibule
end

:cook
action toggle_cooking_workbench
end
```

Because `priority: 5 < 10`, the cooking scenario runs **instead of** the default. It adds a "Cook" option without modifying core files.

### Bedroom with save_allowed (core)

```scenario
scene: home_bedroom
save_allowed: true
priority: 10
---
select "Your bedroom. You can rest here." key=rooms/bedroom/prompt
option "Leave" key=rooms/bedroom/opt_exit -> :exit

:exit
switch_scene home_vestibule
end
```

### One-run event (test_interactives)

```scenario
scene: start_scene
priority: 10
is_one_run: true
---
text "test"
interactive_add kitchen_lamp
text "wait"
end
```

The interactive lamp is added once, on first visit. Subsequent visits skip this scenario.

## How the engine selects scenarios

1. Player enters `scene: home_kitchen`
2. Engine collects all `.scenario` files targeting `home_kitchen` across all mods
3. Sorts by `priority` (ascending)
4. For each scenario, evaluates `condition:` (if present)
5. First scenario with a passing condition runs
6. If no condition matches, the lowest-priority scenario without a condition runs (fallback)
