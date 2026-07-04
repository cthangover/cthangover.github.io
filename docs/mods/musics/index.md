# Music & Playlists

Background music tracks (`.ogg`) organized into playlists with ambient/combat categorization. The engine switches between playlist categories based on game state (exploration vs battle).

## Directory structure

```
music/
├── track_name_1.ogg
├── track_name_2.ogg
└── playlists/
    ├── default.json
    ├── battle.json
    └── town_entry.json
```

## File format

- `.ogg` — Vorbis-compressed audio, any bitrate
- Files are referenced by name (without extension) in playlists

## Real example — `core/music/playlists/default.json`

```json
{
  "Scene": "default",
  "Musics": [
    {
      "MusicType": "Ambient",
      "MusicNames": [
        "Abyssal Void",
        "Airborne Melody",
        "Binary Prelude",
        "Cinders of Dawn",
        "Melancholic Journey",
        "Nebula Pulse Echoes",
        "Quantum Archive",
        "Twilight Interlude"
      ]
    },
    {
      "MusicType": "Combat",
      "MusicNames": [
        "Aura of Decay",
        "Circuit Dreams II",
        "Crimson Echoes",
        "Crimson Horizon",
        "Glass Symphony",
        "Hex Doom Cart",
        "Iron Resonance",
        "Iron Resonance II",
        "Luminous Twilight",
        "Rusty Frequencies",
        "Skull Resonance",
        "Venom's Embrace"
      ]
    }
  ]
}
```

8 ambient tracks for exploration, 12 combat tracks for battles — 20 total.

## Playlist JSON schema

```json
{
  "Scene": "playlist_id",
  "Musics": [
    {
      "MusicType": "Force | Combat | Ambient",
      "MusicNames": ["track_1", "track_2", "..."],
      "Shuffle": true,
      "Volume": 0.8,
      "FadeInSeconds": 2.0,
      "FadeOutSeconds": 1.5
    }
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `Scene` | Yes | Playlist ID (referenced in scene definitions) |
| `MusicType` | Yes | Category: `Ambient`, `Combat`, `Force`. `Force` is transient — normalised to `Ambient` |
| `MusicNames` | Yes | List of track filenames (no extension, no path) |
| `Shuffle` | No | Randomize playback order (default: `true`) |
| `Volume` | No | Playback volume 0.0–1.0 (default: `0.8`) |
| `FadeInSeconds` | No | Cross-fade duration on start |
| `FadeOutSeconds` | No | Cross-fade duration on stop |

## Usage in scenarios

The `music`, `music_play`, and `music_pause` commands control the music system:

```scenario
# Switch to a specific playlist
music playlists/tavern

text "A bard strums a melancholy tune..."

# Pause everything
music_pause

# Resume
music_play
```

## Scene default playlists

Scene definitions can specify a default playlist:

```json
{
  "name": "town_entry",
  "defaultBackground": "town/entry",
  "defaultAmbient": "playlists/town_entry",
  "defaultScenario": "scenarios/town/town_entry_default.scenario"
}
```

## Adding a new track

1. Place the `.ogg` file in `music/`
2. Add its name (without `.ogg`) to the desired playlist's `MusicNames` array
3. Restart the game — tracks are loaded at startup

## Creating a new playlist

1. Create `music/playlists/my_scene.json`
2. Define `Scene`, `MusicType`, and `MusicNames`
3. Reference it: `music playlists/my_scene` in a scenario, or set as `defaultAmbient` in a scene JSON
