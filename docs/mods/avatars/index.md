# Avatars

Character portrait images displayed during dialogue scenes, positioned via `first=` (left, player) and `second=` (right, NPC) parameters.

## Directory structure

```filestree
avatars/
└── {character_name}/
    └── {expression}.png
```

## Real example — Murakami

From `mods/murakami/avatars/murakami/`:

```filestree
murakami/
├── normal.png      # neutral expression
├── think.png       # thoughtful
├── fear_1.png      # scared
├── fear_2.png      # terrified
└── what.png        # confused
```

## Usage in scenarios

Avatars appear in dialogue lines through the `text` command:

```scenario
text "- Help me..." key=murakami/help second=murakami/fear_1
text "- What are you doing here alone?" key=murakami/alone first=marao/think
```

- `first=` — left-side speaker (usually the player)
- `second=` — right-side speaker (usually the NPC)
- The value is `{character}/{expression}` — no `.png` extension

## Adding a new avatar set

1. Create `avatars/{character_name}/` in your mod
2. Add `.png` files for each expression you need
3. The character's JSON definition sets `"Image"` to the base path:

```jsonc
{
  "Id": "Murakami",                                        // Unique character identifier
  "Image": "characters/player/murakami"                    // Base path to character textures
}
```

4. Use in scenarios: `first=murakami/think` or `second=murakami/fear_1`

## Multiple characters in dialogue

The same expression naming convention works for any character:

```filestree
avatars/
├── marao/
│   ├── normal.png
│   ├── think.png
│   └── what.png
└── murakami/
    ├── fear_1.png
    └── fear_2.png
```

## Format requirements

- **Format:** PNG with transparency
- **Resolution:** 512×512 recommended, but any square power-of-two works
- **Naming:** lowercase, underscores for multi-word expressions (`fear_1`, `very_happy`)
- The extension is omitted in scenario files — the engine resolves `{character}/{expression}` to `avatars/{character}/{expression}.png`
