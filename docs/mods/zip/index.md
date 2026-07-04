# Mod Packaging — .zip Distribution

Mods can be distributed as `.zip` archives instead of loose folders. The kernel loads them identically — zip is just a transport format.

## When to use .zip vs folder

| Format | Use case |
|---|---|
| **Folder** | Local development. Instant iteration — edit files, reload game |
| **.zip** | Distribution. Share with players, upload to mod platforms, versioned releases |

## Directory structure inside the zip

The zip must have the same structure as a loose mod folder:

```
my_mod.zip
├── manifest.json
├── src/
│   └── MyCode.cs
├── scenarios/
│   └── my_scene.scenario
├── items/
│   └── items.json
├── backgrounds/
│   └── my_bg.png
├── locale/
│   └── en.properties
└── ...                     # any other assets
```

The root of the zip IS the mod root — no extra wrapper folder.

## How the kernel loads zipped mods

1. On startup, the kernel scans `mods/` for both folders and `.zip` files
2. Each `.zip` is decompressed into a memory-backed filesystem
3. The mod is loaded as if it were a folder — `manifest.json` is read, sources compiled, assets discovered
4. Zip mods have the same priority, dependency resolution, and lifecycle as folder mods

## Creating a .zip for distribution

From the mod's parent directory:

```bash
# From mods/
zip -r my_mod_v1.0.0.zip my_mod/
```

Or using the Python build script (add this to your mod's tooling):

```python
import shutil
import json

def pack_mod(mod_path, output_path):
    with open(f"{mod_path}/manifest.json") as f:
        manifest = json.load(f)

    name = manifest.get("name", mod_path)
    version = manifest.get("version", "0.0.0")
    archive = f"{output_path}/{name}_v{version}"

    shutil.make_archive(archive, "zip", mod_path)
    print(f"Packed: {archive}.zip")
```

## Testing a zipped mod

1. Place the `.zip` in `mods/`
2. Remove the source folder (or keep both — the kernel prefers folders over zips if both exist)
3. Launch the game — the mod loads from the zip
4. Check the game log for any errors

## Mod versioning

Include a `version` field in `manifest.json` for proper version tracking:

```json
{
  "name": "MyMod",
  "version": "1.2.0",
  "author": "you",
  "description": "..."
}
```

The kernel does **not** enforce version conflicts — multiple versions of the same mod will both load, which may cause issues. Use version numbers for player information and mod platform compatibility checks.

## Zip mod limitations

- **No hot-reload**: Editing files inside a zip requires repacking. Use folders during development
- **Larger startup time**: First-time decompression adds a small delay (cached on subsequent runs)
- **File size**: No hard limit, but very large zips (>100 MB of assets) may impact load times

## Existing test zips

The project includes test zip mods in `mods/` — these demonstrate the zip loading system:

```
mods/
├── test_mod_1.zip
├── test_mod_2.zip
└── test_mod_3.zip
```

These are minimal mods used in automated tests to verify zip loading works correctly.
