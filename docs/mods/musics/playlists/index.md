# Playlists — JSON Reference

Detailed schema for music playlist configuration JSON files.

## Full schema

```json
{
  "Scene": "playlist_identifier",
  "Musics": [
    {
      "MusicType": "Ambient | Combat | Boss | Menu",
      "MusicNames": ["track1", "track2", "..."],
      "Shuffle": true,
      "Volume": 0.8,
      "FadeInSeconds": 2.0,
      "FadeOutSeconds": 1.5
    }
  ]
}
```

## Field details

| Field | Type | Default | Description |
|---|---|---|---|
| `Scene` | string | *(required)* | Unique playlist ID. Referenced in scene JSONs (`defaultAmbient`) and scenario commands (`music playlists/{id}`) |
| `MusicType` | string | *(required)* | Category tag. The engine uses this to switch between playlists when game state changes (e.g. `Ambient` → `Combat` on battle start) |
| `MusicNames` | string[] | *(required)* | Track filenames without extension. Must match `.ogg` files in `music/` |
| `Shuffle` | bool | `true` | Whether to randomize playback order |
| `Volume` | float | `0.8` | Playback volume, 0.0 to 1.0 |
| `FadeInSeconds` | float | `1.0` | Cross-fade duration when switching TO this playlist |
| `FadeOutSeconds` | float | `1.0` | Cross-fade duration when switching FROM this playlist |

## Real example — default playlist

```json
{
  "Scene": "default",
  "Musics": [
    {
      "MusicType": "Ambient",
      "MusicNames": [
        "Abyssal Void", "Airborne Melody", "Binary Prelude",
        "Cinders of Dawn", "Melancholic Journey",
        "Nebula Pulse Echoes", "Quantum Archive", "Twilight Interlude"
      ]
    },
    {
      "MusicType": "Combat",
      "MusicNames": [
        "Aura of Decay", "Circuit Dreams II", "Crimson Echoes",
        "Crimson Horizon", "Glass Symphony", "Hex Doom Cart",
        "Iron Resonance", "Iron Resonance II", "Luminous Twilight",
        "Rusty Frequencies", "Skull Resonance", "Venom's Embrace"
      ]
    }
  ]
}
```

## Multiple playlists example

A scene can reference different playlists for different states:

```json
// music/playlists/tavern.json
{
  "Scene": "tavern",
  "Musics": [
    { "MusicType": "Ambient", "MusicNames": ["Tavern_Day", "Tavern_Night"] },
    { "MusicType": "Combat", "MusicNames": ["Tavern_Fight_01", "Tavern_Fight_02"] }
  ]
}
```

## Scene integration

In scene JSON:

```json
{
  "name": "town_tavern",
  "defaultAmbient": "playlists/tavern"
}
```

In scenario DSL:

```scenario
music playlists/tavern
```

## How the engine switches playlists

1. Scene loads → checks `defaultAmbient` → starts playing `Ambient` tracks
2. Battle starts → engine switches to `Combat` tracks from the same playlist
3. Battle ends → switches back to `Ambient`
4. Scene changes → new scene's `defaultAmbient` takes over, with fade
5. `music playlists/{id}` command → manual override, forces switch regardless of game state
