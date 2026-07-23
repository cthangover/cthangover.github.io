# Resources — Pluggable Mod Infrastructure

The kernel's resource pipeline is built on a strategy pattern that lets mods extend *how* mods are discovered, *where* they come from, and *how* they are read. This page gives an overview; each subsection covers one layer in detail.

## Architecture

Three layers work together to turn a URL or folder path into a loaded mod:

```
Scanner (IModScanner)          "I know where mods live"
    ↓
Loader  (IModLoader)           "I know how to open this kind of mod"
    ↓
Provider (IModFileProvider)    "I provide file access to a loaded mod"
```

All three are discovered automatically via `Reflections.FindAndCreate<T>()` — any public, non-abstract class implementing the interface with a parameterless constructor is picked up at startup. Mod DLLs can ship their own implementations; they are registered when the mod assembly is loaded and take priority over built-in ones via LIFO lookup.

## Layers at a Glance

| Layer | Interface | Built-in implementations | What mods can add |
|---|---|---|---|
| **Providers** | [`IModFileProvider`](providers/) | `FolderModFileProvider`, `ZipModFileProvider` | Custom storage backends (memory, network, database) |
| **Scanners** | [`IModScanner`](scanners/) | `UserDataModScanner`, `GameDirModScanner` | New mod sources (HTTP catalog, Steam Workshop, Git repos) |
| **Loaders** | [`IModLoader`](loaders/) | `FolderModLoader`, `ZipModLoader` | New mod formats (.7z, .tar.gz, remote zip download) |
| **Registry** | [`ModDiscoveryRegistry`](discovery-registry/) | Static singleton | — (mods extend via scanners & loaders, not the registry itself) |

## How a mod adds a custom scanner — quick example

A mod that wants to load mods from an HTTP catalog ships one class:

```csharp
using System.Collections.Generic;
using Cthangover.Core.Mods.Discovery;

namespace MyMod
{
    public class HttpCatalogScanner : IModScanner
    {
        public string Name => "HTTP Catalog";

        public bool IsCanProvide(string url)
        {
            return url.StartsWith("https://");
        }

        public IEnumerable<ModSourceRoot> GetRoots()
        {
            yield return new ModSourceRoot
            {
                Url = "https://catalog.example.com/mods",
                Priority = 10
            };
        }

        public IEnumerable<DiscoveredModEntry> Discover(string rootUrl)
        {
            // HTTP GET rootUrl, parse JSON array of mod URLs,
            // yield return new DiscoveredModEntry { ... } for each
        }
    }
}
```

No registration code needed — `Reflections.FindAndCreate<IModScanner>()` finds it automatically when the mod's assembly is loaded.

## Priority and LIFO lookup

- **Root priority** (`ModSourceRoot.Priority`): lower number = higher precedence in deduplication. `UserDataModScanner` uses 0 (user mods win), `GameDirModScanner` uses 1 (built-in mods are overridden).
- **Provider LIFO order**: the **last-registered** scanner or loader that says `IsCanProvide(url) == true` wins. Since mod-added providers are registered after built-in ones, they are checked first and can override core behaviour.
