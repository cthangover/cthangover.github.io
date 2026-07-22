# Versioning & Compatibility

## Backward compatibility

Old saves (without `ModData`, `SaveId`, `Timestamp`, `CoreVersion` fields) will fail to load because the `"__core__"` slot is required. The old `SaveData` format must be migrated manually or via a one-time converter tool.

## Version comparison

During phase-1 validation the core compares `ModMetadata.ModVersion` from the save with `IModInfo.Version` from the installed mod. Both values originate from the `"version"` field in `manifest.json`.

### Comparison strategy

The core uses **semver-first, string-fallback** via `VersionHelper.Compare`:

1. If both strings parse as `System.Version` (`major.minor[.build[.revision]]`), compare numerically. This handles `"1.0" < "2.0"`, `"9.0" < "10.0"`, etc.
2. Otherwise, fall back to ordinal string comparison (`String.CompareOrdinal`). Works for free-form tags like `"Enigma1.5"`, `"alpha-3"`, `"beta-1"`, `"v2"`.

### Supported version formats

| Format | Example | Type |
|---|---|---|
| Strict semver | `1.0.0`, `2.5.3.1` | Numeric |
| Short semver | `1.0`, `0.1` | Numeric |
| Letter in version | `1b.2.0`, `1c.0.1` | Numeric (parsed by `Version`) |
| Prefixed tags | `v1`, `v2.0` | String fallback |
| Codename-style | `Enigma1.5`, `Enigma2.0` | String fallback |
| Alpha/beta tags | `alpha-1`, `beta-3` | String fallback |

### Validation rules

| Condition | Result |
|---|---|
| No version in save or installed mod | Skip check |
| `save.Version > installed.Version` | **Abort** — save was made by a newer mod; downgrade not supported |
| `save.Version < installed.Version` | **Warning** — save is from an older mod version; the mod must handle migration in `OnLoad` |
| `save.Version == installed.Version` | OK |

## Adding version to manifest.json

Every mod's `manifest.json` must include a semver version string:

```json
{
  "name": "My Mod",
  "version": "1.0.0",
  "author": "...",
  "description": "...",
  "sources": ["src/**/*.cs"]
}
```

This value flows through `ModManifest.Version` → `IModInfo.Version` → `ModMetadata.ModVersion` and is used for the save-system version checks above.

## Important rules for mod authors

- **Add `"version"` to `manifest.json`** — the core uses it for save validation and migration detection.
- **One `IModSaveable` per mod** — create a single implementation in your assembly.
- **Never set `ModId`, `ModName`, or `ModVersion`** — the core pre-fills them. Set `MinCoreVersion`, `IsRequired`, `CustomData`, and `Data`.
- **Prefer `bool OnLoad(ModSlot, out string)`** — explicit contract, no exceptions. Override `OnLoadVoid` only for legacy/compatibility.
- **Mods must not depend on each other's save data** — the dispatch order is undefined.
- **Version your `DataBlob` blocks** — use separate blobs per logical entity, version each independently.
- **Handle missing keys** — use `TryGetValue` and provide defaults.
