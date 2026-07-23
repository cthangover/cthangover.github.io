# Mod Catalog & Network Repository

The mod catalog system lets players browse and install mods from online
repositories. A catalog is a JSON file hosted on a web server; the game
fetches it, merges entries from multiple URLs, and compares them against
locally-installed mods.

## Catalog JSON Schema

```jsonc
{
  "_catalog": {                                            // Catalog metadata envelope
    "version": 1,                                          // Schema version of this catalog file
    "updated_at": "2026-07-21T12:00:00Z"                   // ISO-8601 timestamp of last server update
  },
  "mods": [                                                // List of mod entries in this catalog
    {
      "id": "cooking",                                     // Canonical mod identifier (matches manifest.json id)
      "name": "Cooking",                                   // Human-readable display name
      "author": "ct",                                      // Author credit string
      "version": "1.2.0",                                  // Latest release version (semver)
      "description": "Cooking mechanic with 40+ recipes",  // Short description
      "category": "gameplay",                              // Category slug: story, characters, gameplay, visual, audio, ui, locale, library, overhaul, other
      "tags": ["cooking", "crafting"],                     // Search/filter tags
      "icon_url": "https://cdn.example.com/mods/cooking/icon.png", // Full URL to preview icon (PNG or JPEG)
      "depends": ["core>=1", "interface>=1"],              // Versioned dependency strings
      "conflicts_with": [],                                // Mutually exclusive mod IDs
      "downloads": [                                       // Version-specific download entries with mirrors
        {
          "version": "1.2.0",                              // Semver version of this download entry
          "urls": [                                        // Mirror URLs tried in order
            "https://cdn1.example.com/mods/cooking_v1.2.0.zip",
            "https://cdn2.example.com/mods/cooking_v1.2.0.zip"
          ],
          "size_bytes": 1425367,                           // File size of the zip for progress display
          "archive_sha256": "e3b0c44298fc...",             // SHA256 of the .zip file (integrity check after download)
          "install_sha256": "a7ffc6f8bf1e..."              // SHA256 of extracted mod content (modification detection)
        },
        {
          "version": "1.0.0",
          "urls": ["https://cdn1.example.com/mods/cooking_v1.0.0.zip"],
          "size_bytes": 980000,
          "archive_sha256": "d4a1b3...",
          "install_sha256": "b8ee..."
        }
      ],
      "changelog": "v1.2.0: Added 5 new fish recipes.",    // Optional version changelog
      "status": "stable",                                  // stable, beta, deprecated, or archived
      "min_game_version": "1.0.0",                         // Minimum compatible game version (semver)
      "max_game_version": null                             // Maximum compatible game version, or null for no upper bound
    }
  ]
}
```

### Root envelope

| Field | Type | Description |
|---|---|---|
| `_catalog.version` | int | Schema version of this catalog file |
| `_catalog.updated_at` | string | ISO-8601 timestamp of last server update |
| `mods` | array | List of mod entries |

### Per-mod entry

| Field | Type | Description |
|---|---|---|
| `id` | string | Canonical mod identifier (must match the mod's `manifest.json` `id`) |
| `name` | string | Human-readable name |
| `author` | string | Author credit |
| `version` | string | Semver version of the latest release (e.g. "1.2.0") |
| `description` | string | Short description |
| `category` | string | Category slug: `story`, `characters`, `gameplay`, `visual`, `audio`, `ui`, `locale`, `library`, `overhaul`, `other` |
| `tags` | string[] | Search/filter tags |
| `icon_url` | string | Full URL to preview icon (PNG or JPEG) |
| `depends` | string[] | Versioned dependency strings (e.g. `"core>=1"`) |
| `conflicts_with` | string[] | Mutually exclusive mod IDs |
| `downloads` | object[] | Version-specific download entries with mirrors |
| `downloads[].version` | string | Semver version of this download entry |
| `downloads[].urls` | string[] | Mirror URLs for the .zip archive (tried in order) |
| `downloads[].size_bytes` | int | File size of the zip (for progress display) |
| `downloads[].archive_sha256` | string | SHA256 of the .zip file itself (integrity check after download) |
| `downloads[].install_sha256` | string | SHA256 of the extracted mod content (modification detection) |
| `changelog` | string | Optional version changelog |
| `status` | string | `stable`, `beta`, `deprecated`, or `archived` |
| `min_game_version` | string | Minimum compatible game version (semver) |
| `max_game_version` | string | Maximum game version, or null |

## Checksums

Two SHA256 hashes are stored per download entry (per version):

**`archive_sha256`** hash of the .zip archive as it sits on the server.
The game verifies this after downloading to detect transfer corruption.

**`install_sha256`** hash of the mod's extracted content, computed by:
1. Enumerating all files in the mod (recursively)
2. Excluding dot-prefixed files/directories (`.godot/`, `.import/`,
   `.gitignore`) and patterns from `catalog_ignore_patterns` in
   `mod_config.json`
3. Sorting files by path (case-insensitive)
4. For each file: `SHA256(path_bytes + content_bytes)`
5. Final: `SHA256(file_hash_1 + file_hash_2 + ...)`

When the game detects that a locally-installed mod's `install_sha256`
differs from the catalog value, it shows a "Modified locally" warning.
Overwriting such a mod from the network would lose the player's changes.

## Configuration

Catalog URLs are configured in `config/mod_config.json`:

```jsonc
{
  "catalog_urls": [                                        // URLs to fetch catalog.json from (merged in order)
    "https://example.com/mods/catalog.json",
    "https://mirror.example.com/mods/catalog.json"
  ],
  "catalog_ignore_patterns": [".*","bin","obj"]            // Glob patterns to exclude from install_sha256 computation
}
```

Multiple URLs are merged — when the same mod appears in two catalogs,
the entry with the highest `version` wins for metadata (name, description,
category, etc.), while `downloads` arrays from all sources are merged:
same-version entries have their `urls` lists combined (deduplicated).

The game caches fetched catalogs to `user://catalog_cache.json`.
Open the Network tab in the mods menu (Mods > Network) and press
**Refresh** to clear the cache and re-fetch.

Architecture note: the catalog system provides the *data source* for an HTTP catalog scanner. For details on how a custom scanner turns catalog JSON into `DiscoveredModEntry` items that the kernel can load, see [Resources — Scanners](../resources/scanners/).

## Exporting a mod to the catalog

From the mods menu, select a locally-installed mod and click
**Export to Catalog**. This opens a dialog where you fill in the
download URL, category, tags, and changelog, then generates:

- A `.zip` archive of the mod (if it was a folder)
- A `.json` catalog entry file alongside the archive

Both files go into the mods root directory. The JSON snippet can be
copied to clipboard and pasted into the catalog JSON you host online.

Ignore patterns for the SHA256 computation can be customized in
`mod_config.json` via `catalog_ignore_patterns` default `[".*","bin","obj"]`
excludes all dot-prefixed entries.

## Mod status display

In the Network tab, each remote mod shows one of four statuses:

| Status | Meaning |
|---|---|
| **Installed** | Same version, same content hash |
| **Update available** | Newer version in catalog |
| **Not installed** | No local copy found |
| **Modified locally** | Same version, but `install_sha256` differs player edited the mod |
