# Sounds — Sound Effects

One-shot sound effect files (`.ogg`) organized by category, referenced from scenarios via the `sound` command.

## Directory structure

```
sounds/
├── battle/           # combat sounds
│   ├── hit.ogg
│   ├── damage.ogg
│   └── stun.ogg
├── locations/        # ambient location sounds
│   ├── door_open.ogg
│   └── fire_crackle.ogg
├── ui/               # interface feedback
│   ├── click.ogg
│   ├── hover.ogg
│   └── notification.ogg
└── record_scratch.ogg
```

## File format

- `.ogg` — Vorbis-compressed, any bitrate
- Short duration (0.1–5 seconds) recommended for one-shot effects
- Referenced by path without extension: `ui/click`, `battle/hit`

## Real example — `core/sounds/`

From `mods/core/sounds/`:

```
sounds/
├── record_scratch.ogg         # comedic timing effect
├── battle/
│   ├── physics_damage.ogg
│   ├── physics_defence.ogg
│   ├── death.ogg
│   └── stun_apply.ogg
├── locations/
│   ├── door_creak.ogg
│   └── wind_ambient.ogg
└── ui/
    ├── button_click.ogg
    ├── notification_chime.ogg
    └── quest_update.ogg
```

## Real example — `card_battle/sounds/`

From `mods/card_battle/sounds/`:

```
sounds/
├── card_pick.ogg              # picking up a card
├── card_drop.ogg              # placing a card on target
├── card_damage.ogg            # damage number appears
├── card_stun.ogg              # stun effect applied
├── card_death.ogg             # card death dissolve
├── turn_start.ogg             # new turn
└── turn_end.ogg               # end turn button
```

## Usage in scenarios

```scenario
sound ui/click
text "- ..." key=dialogue_line
sound battle/hit
delay 0.5
sound ui/notification_chime
```

- `sound` plays immediately and does not block script execution
- Multiple sounds can play simultaneously
- The engine manages audio channels and prevents clipping

## Usage from C#

```csharp
SoundService.Play("ui/click");
SoundService.Play("battle/hit", volume: 0.8f, pitch: 1.2f);
```

Optional parameters:
- `volume` — 0.0 to 1.0
- `pitch` — playback speed / pitch shift (0.5 = half speed, 2.0 = double speed)
- `pan` — stereo panning (-1.0 left to 1.0 right)

## Adding a new sound

1. Place the `.ogg` file in `sounds/{category}/`
2. Reference in scenario: `sound category/filename` (no `.ogg`)
3. No config or registration needed — the engine discovers `.ogg` files at load time

## Sound categories

Categories are organizational, not enforced. Use whatever folder structure fits your mod:

| Category | Typical use |
|---|---|
| `battle/` | Combat sounds: hits, blocks, stuns, death |
| `locations/` | Environmental: doors, water, wind, fire |
| `ui/` | Interface feedback: clicks, hovers, notifications |
| `music/` | Note: music tracks go in `music/`, not `sounds/` |

For music / ambient tracks, use `music/` and the `music`/`music_play`/`music_pause` scenario commands instead. See `musics/` documentation.
