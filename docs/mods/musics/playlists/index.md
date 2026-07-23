# Playlists — JSON Reference

Detailed schema for music playlist configuration JSON files.

## Full schema

```jsonc
{
  "Scene": "playlist_identifier",       // Unique playlist ID (referenced in scene JSONs and scenario commands)
  "Musics": [
    {
      "MusicType": "Force | Combat | Ambient",  // Category: Ambient (explore), Combat (battle), Force (transient)
      "MusicNames": ["track1", "track2", "..."],  // Track filenames without .ogg extension
      "Shuffle": true,                    // Randomize playback order (default: true)
      "Volume": 0.8,                      // Playback volume 0.0–1.0 (default: 0.8)
      "FadeInSeconds": 2.0,               // Cross-fade duration when switching TO this playlist
      "FadeOutSeconds": 1.5               // Cross-fade duration when switching FROM this playlist
    }
  ]
}
```

## Field details

| Field | Type | Default | Description |
|---|---|---|---|
| `Scene` | string | *(required)* | Unique playlist ID. Referenced in scene JSONs (`defaultAmbient`) and scenario commands (`music playlists/{id}`) |
| `MusicType` | string | *(required)* | Category: `Ambient` (exploration), `Combat` (battle), `Force` (transient, normalised to `Ambient`). Engine auto-switches `Ambient` ↔ `Combat` on battle state changes |
| `MusicNames` | string[] | *(required)* | Track filenames without extension. Must match `.ogg` files in `music/` |
| `Shuffle` | bool | `true` | Whether to randomize playback order |
| `Volume` | float | `0.8` | Playback volume, 0.0 to 1.0 |
| `FadeInSeconds` | float | `1.0` | Cross-fade duration when switching TO this playlist |
| `FadeOutSeconds` | float | `1.0` | Cross-fade duration when switching FROM this playlist |

## Real example — default playlist

```jsonc
{
  "Scene": "default",               // Playlist ID
  "Musics": [
    {
      "MusicType": "Ambient",       // Exploration music
      "MusicNames": [
        "Abyssal Void", "Airborne Melody", "Binary Prelude",
        "Cinders of Dawn", "Melancholic Journey",
        "Nebula Pulse Echoes", "Quantum Archive", "Twilight Interlude"
      ]
    },
    {
      "MusicType": "Combat",        // Battle music — auto-switched by engine
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

```jsonc
// music/playlists/tavern.json
{
  "Scene": "tavern",              // Playlist ID; referenced via "playlists/tavern"
  "Musics": [
    { "MusicType": "Ambient", "MusicNames": ["Tavern_Day", "Tavern_Night"] },
    { "MusicType": "Combat", "MusicNames": ["Tavern_Fight_01", "Tavern_Fight_02"] }
  ]
}
```

## Scene integration

In scene JSON:

```jsonc
{
  "name": "town_tavern",                  // Scene ID
  "defaultAmbient": "playlists/tavern"    // References the tavern playlist by path
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
