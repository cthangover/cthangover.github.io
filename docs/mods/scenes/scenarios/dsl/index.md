# DSL Command Reference

Complete reference to all 31 commands in the Scenario DSL, grouped by category.

---

## Flow Control

### `select`
Opens a choice menu. String is the prompt text (can be a locale key or literal).

```scenario
select "What now?" key=choice/prompt
option "Go home" key=choice/home -> :home
option "Explore" key=choice/explore -> :explore
```

- Must be followed by one or more `option` commands
- The `key=` parameter references a locale key for localization
- If no `key=`, the text itself is displayed

### `option`
Defines a choice within a `select` block.

```scenario
option "Leave" key=rooms/kitchen/opt_exit -> :exit
```

- Text can be a literal or a `key=` locale reference
- `->` points to a `:label` to jump to when chosen

### `:label`
Anchor point for jumps. Must start with `:` at the beginning of a line.

```scenario
:enter_room
background "town/meetingmurakami/00079"
text "[Marao stepped inside]" key=enter/room
```

Labels are local to the scenario file. They cannot be jumped to from other scenarios.

### `goto`
Unconditional jump to a label.

```scenario
goto :cleanup
```

Useful for skipping optional content or implementing complex branching without nested options.

### `end`
Terminates the scenario script. Required at the end of every execution path.

```scenario
end
```

---

## Scene & Visuals

### `background`
Sets or changes the background image.

```scenario
background "town/meetingmurakami/00002-1920617752"
```

Path is relative to the mod's `backgrounds/` folder. No `.png` extension.

### `background_color`
Sets a solid color background (overrides image).

```scenario
background_color "#1a1a2e"
```

Useful for transitions, flashbacks, or UI overlays.

### `background_show_hide`
Shows or hides the background layer.

```scenario
background_show_hide hide
background_show_hide show
```

### `switch_scene`
Transitions to a different scene.

```scenario
switch_scene home_vestibule
switch_scene Battle
```

The target is a scene name defined in `scenes/{name}.json`.

### `foreground`
Sets or clears the foreground layer image (rendered above characters).

```scenario
foreground "effects/rain"
foreground ""
```

---

## Text & Dialogue

### `text`
Displays a dialogue line with optional avatar portraits.

```scenario
text "- Dear lady!" key=meeting/greeting first=marao/think second=murakami/fear_1
```

| Parameter | Description |
|---|---|
| `key=` | Locale key for the text content |
| `first=` | Left-side avatar: `{character}/{expression}` |
| `second=` | Right-side avatar |
| (inline) | If no `key=`, the text is displayed literally |

### `p_text`
Displays text in first-person mode (no dialogue box, centered overlay).

```scenario
p_text "I should check what's making that noise..."
```

Used for internal monologue, narration, or atmospheric text.

### `title`
Displays a large centered title, often used for chapter/section headers.

```scenario
title "Chapter 1 — The Hangover"
```

---

## Audio

### `music`
Switches the background music playlist.

```scenario
music playlists/tavern
music playlists/battle
```

Target is a playlist file in `music/playlists/`.

### `music_play`
Resumes paused music.

```scenario
music_play
```

### `music_pause`
Pauses the current music track.

```scenario
music_pause
```

### `sound`
Plays a one-shot sound effect.

```scenario
sound ui/click
sound battle/hit
```

Path is relative to the mod's `sounds/` folder. No `.ogg` extension.

---

## Lighting

### `light_set`
Configures dynamic 2D light sources. Accepts a JSON array of light objects.

```scenario
light_set [{"x":0.43,"y":0.58,"radius":500,"influence":1,"color":"#ffff00"}]
```

| Field | Description |
|---|---|
| `x`, `y` | Normalized position (0.0–1.0, UV coordinates) |
| `radius` | Light radius in pixels |
| `influence` | Intensity multiplier (0.0–2.0) |
| `color` | Hex color with optional alpha (`#ffff00`, `#ffffff80`) |

Multiple lights in one array:

```scenario
light_set [
  {"x":0.84,"y":0.04,"radius":600,"influence":1,"color":"#ffff00"},
  {"x":0.29,"y":0.16,"radius":600,"influence":1,"color":"#ffff00"}
]
```

Call with no arguments to reset all lights:

```scenario
light_set
```

### `light_use_time`
Enables/disables time-of-day influence on light color and angle.

```scenario
light_use_time true
light_use_time false
```

When enabled, the shader system adjusts warm/cool tones based on in-game time.

---

## Effects & Animation

### `effect`
Triggers a visual effect at a position or on a target.

```scenario
effect splash at center
effect stun on enemy
effect shake intensity=0.5 duration=0.3
```

### `delay`
Pauses script execution for N seconds.

```scenario
delay 2.5
text "..."
delay 1.0
text "Oh."
```

### `animation`
Plays a named animation on a character or the scene.

```scenario
animation fade_in duration=1.0
animation marao/walk
```

---

## Interactive Objects

### `interactive_add`
Adds a clickable interactive object to the scene.

```scenario
interactive_add kitchen_lamp
```

The name references an interactive definition in `interactives/{name}.json`.

### `interactive_remove`
Removes a specific interactive object.

```scenario
interactive_remove kitchen_lamp
```

### `interactive_clear`
Removes all interactive objects from the current scene.

```scenario
interactive_clear
```

### `interactive_set`
Replaces all interactives with a new set.

```scenario
interactive_set lamp_1,lamp_2,cabinet_door
```

Comma-separated list of interactive names.

---

## Dialog Visibility

### `show_dialog`
Shows the dialogue box UI (if hidden).

```scenario
show_dialog
```

### `hide_dialog`
Hides the dialogue box UI without clearing text.

```scenario
hide_dialog
```

Used for cutscenes where you want the background visible without UI.

---

## Variables & Logic

### `set`
Sets a named variable for later use in conditions.

```scenario
set met_murakami = true
set door_locked = false
```

### `empty`
A no-op command. Useful as a placeholder during development.

```scenario
empty
```

---

## Notifications

### `notify`
Queues a notification banner in the top-left corner of the screen. Notifications appear one by one, stack vertically, and auto-dismiss after 10 seconds. Use for quest updates, item pickups, or any non-blocking informational messages.

```scenario
notify "Quest updated: Find the key"
```

```scenario
notify "Received: Health Potion"
```

| Parameter | Description |
|---|---|
| (inline) | The notification text to display |
| `key=` | Locale key for localization (takes priority over inline text) |

Notifications are queued in a buffer — they appear in order and will wait if the screen already has the maximum number of visible notifications (4). The 10-second timer starts only when the notification becomes visible, not when it is queued.

---

## Special Syntax

### `#` — Comments

```scenario
# This line is ignored by the parser
# Use comments to document complex branching
```

### `---` — Metadata Separator

Separates the YAML-like metadata header from the script body. Must appear on its own line.

### `->` — Jump Operator

Used exclusively within `option` commands to point to `:label` targets.

```scenario
option "Go inside" -> :enter
```
