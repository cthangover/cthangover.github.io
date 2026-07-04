# Interactive Objects

Interactive objects are clickable scene elements with hover effects and custom actions. They are added to scenes from scenario scripts via `interactive_add` and defined as JSON files.

## JSON structure

```json
{
  "Items": [{
    "id": "kitchen_door",
    "texture": "interactives/kitchen_door",
    "layer": "foreground",
    "zIndex": 10,
    "enabled": true,
    "visible": true,
    "cursor": "PointingHand",
    "hitArea": {
      "type": "rect",
      "x": 0.7,
      "y": 0.3,
      "width": 0.15,
      "height": 0.5
    },
    "highlight": {
      "color": "#FFFF0033",
      "scale": 1.02,
      "duration": 0.15
    },
    "actions": {
      "onClick": {
        "scenario": "scenarios/home/kitchen_door.scenario"
      },
      "onHoverEnter": "effect glow at center",
      "onHoverLeave": ""
    }
  }]
}
```

## Field reference

### Top-level fields

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | string | *(required)* | Unique identifier used in `interactive_add` / `interactive_remove` commands |
| `texture` | string | *(required)* | Texture key resolved via `ModManager.ResolveTexture`. Full-screen with alpha |
| `layer` | string | `"foreground"` | Visual layer: `"background"`, `"foreground"`, or `"ui"` |
| `zIndex` | int | 0 | Z-ordering within the layer (higher = on top) |
| `enabled` | bool | `true` | Whether the object responds to input |
| `visible` | bool | `true` | Whether the object is rendered |
| `cursor` | string | — | Mouse cursor override (Godot `CursorShape` enum name, e.g. `"PointingHand"`) |
| `hitArea` | object | `{ type: "rect" }` | Collider shape and position |
| `highlight` | object | — | Visual highlight settings on hover |
| `actions` | object | — | Actions triggered by pointer events |

### `hitArea` fields

Coordinates are in **normalised viewport coordinates (0..1)**, where `(0,0)` = top-left, `(1,1)` = bottom-right.

| Field | Type | Default | Description |
|---|---|---|---|
| `type` | string | `"rect"` | Shape type: `"rect"`, `"circle"`, or `"polygon"` |
| `x` | float | 0 | X position (top-left for rect, centre for circle) |
| `y` | float | 0 | Y position |
| `width` | float | 0.1 | Width for rect type |
| `height` | float | 0.1 | Height for rect type |
| `radius` | float | 0.05 | Radius for circle type |
| `vertices` | array | — | `[{x, y}, ...]` polygon vertices (normalised) |

### `highlight` fields

| Field | Type | Default | Description |
|---|---|---|---|
| `color` | string | `"#FFFF0033"` | Modulate colour as a hex string (e.g. `"#FF000044"`) |
| `scale` | float | 1.02 | Pulse scale multiplier on hover (e.g. 1.02 = 2% bigger) |
| `duration` | float | 0.15 | Animation duration in seconds for hover/unhover |

### `actions` fields

| Field | Description |
|---|---|
| `onClick` | `ClickAction` — path to `.scenario` and/or inline DSL commands |
| `onHoverEnter` | Inline DSL commands executed on mouse enter |
| `onHoverLeave` | Inline DSL commands executed on mouse leave |

### `onClick` sub-fields

| Field | Description |
|---|---|
| `scenario` | Path to a `.scenario` file to run on click |
| `commands` | Array of inline DSL command strings to execute on click |

## Scenario commands

| Command | Description |
|---|---|
| `interactive_add object_id` | Instantiate an interactive object by its definition ID |
| `interactive_remove object_id` | Remove an interactive object |
| `interactive_set object_id enabled=true\|false` | Enable or disable an object |
| `interactive_set object_id visible=true\|false` | Show or hide an object |
| `interactive_clear` | Remove all interactive objects from the scene |

## Directory structure

```
interactives/
├── interactives.json          # index file
├── kitchen_door.json
└── treasure_chest.json
```

## Adding a new interactive object

1. Create `interactives/{id}.json` with the full definition
2. Add it to the index: `"${id}"` in `interactives/interactives.json`
3. In a scenario, activate it: `interactive_add my_object`
