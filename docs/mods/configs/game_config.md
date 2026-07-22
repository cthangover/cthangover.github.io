# Game Config — game_config.json

Default game configuration loaded from `config/game_config.json` at startup. Defines audio, display, language, and logging settings.

## File location

```filestree
config/
└── game_config.json
```

## Full schema

```json
{
  "audio": {
    "sounds_enabled": true,
    "musics_enabled": true,
    "ambient_enabled": true,
    "sounds_volume": 100,
    "musics_volume": 15,
    "ambient_volume": 100
  },
  "language": "en-en",
  "display": {
    "window_mode": 3,
    "resolution_width": 1920,
    "resolution_height": 1080,
    "current_screen": 0,
    "vsync_enabled": false,
    "scale": 1
  },
  "logging": {
    "enabled": true,
    "console_enabled": true,
    "minimum_level": "Debug",
    "enabled_categories": ["LOG_BATTLE_UI", "LOG_MODS", "..."]
  }
}
```

## `audio` section

| Field | Type | Description |
|---|---|---|
| `sounds_enabled` | bool | Master toggle for sound effects |
| `musics_enabled` | bool | Master toggle for music |
| `ambient_enabled` | bool | Master toggle for ambient sounds |
| `sounds_volume` | int | Sound effects volume (0–100) |
| `musics_volume` | int | Music volume (0–100) |
| `ambient_volume` | int | Ambient volume (0–100) |

## `display` section

| Field | Type | Values | Description |
|---|---|---|---|
| `window_mode` | int | 0=Windowed, 1=Min, 2=Max, 3=Fullscreen, 4=Exclusive | Window display mode (Godot `DisplayServer.WindowMode`) |
| `resolution_width` | int | pixels | Target screen width |
| `resolution_height` | int | pixels | Target screen height |
| `current_screen` | int | 0-indexed | Monitor/display index |
| `vsync_enabled` | bool | true/false | Vertical sync |
| `scale` | int | multiplier | UI/window scaling factor |

## `language` section

| Field | Type | Description |
|---|---|---|
| `language` | string | Locale code (e.g. `"en-en"`, `"ru-ru"`) |

## `logging` section

| Field | Type | Description |
|---|---|---|
| `enabled` | bool | Master logging toggle |
| `console_enabled` | bool | Write logs to console output |
| `minimum_level` | string | Minimum log level: `"Debug"`, `"Message"`, `"Warning"`, `"Error"` |
| `enabled_categories` | string[] | Active log channels (see below) |

### Available log categories

| Category | Covers |
|---|---|
| `LOG_BATTLE_UI` | Battle interface events |
| `LOG_MODS` | General mod loading |
| `LOG_MODS_ZIP` | ZIP mod provider |
| `LOG_MODS_COMPILE` | Roslyn C# compilation |
| `LOG_MODS_REGISTRY` | Mod registry operations |
| `LOG_AI` | AI decision-making |
| `LOG_AI_DEBUG` | AI debug tracing |
| `LOG_AUDIO` | Audio playback |
| `LOG_BATTLE` | Battle engine events |
| `LOG_CACHE` | Mod cache operations |
| `LOG_CARD` | Card battle actions |
| `LOG_CHAIN` | Event chain execution |
| `LOG_COND` | Condition evaluation |
| `LOG_CONFIG` | Configuration loading |
| `LOG_DIALOG` | Dialog system |
| `LOG_EVENT` | General events |
| `LOG_GAME` | Game lifecycle |
| `LOG_GD_PLUGIN` | Godot editor plugin |
| `LOG_ITEMS` | Item/inventory events |
| `LOG_LANG` | Localization loading |
| `LOG_LIGHT` | Lighting system |
| `LOG_QUEST` | Quest system |
| `LOG_SAVE` | Save/load operations |
| `LOG_SCENE` | Scene transitions |
| `LOG_SERIALIZE` | JSON serialization |
| `LOG_SHADER` | Shader operations |
| `LOG_STATUS` | Status effects |
| `LOG_TEST` | Test runner |
| `LOG_TOOLBOX` | Dev tools |
| `LOG_UI` | UI events |
| `LOG_VIEW` | View box navigation |
| `LOG_WIDGET` | Widget lifecycle |
| `LOG_FACTORY` | Factory loading |
| `LOG_LIGHT_TRACE` | Light ray tracing debug |

## Runtime settings persistence

User-adjusted settings are persisted to `user://settings.cfg` (INI format), separate from this config file. The `game_config.json` only provides defaults — changes made in the settings menu are saved per-user.
