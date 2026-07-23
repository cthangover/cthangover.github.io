# Discovery Registry — `ModDiscoveryRegistry`

The central registry that auto-discovers all `IModScanner` and `IModLoader` implementations and provides LIFO-ordered lookup. There is exactly one instance — a static singleton initialised once by `ModRegistry.Initialize()`.

## Discovery

At startup, `Reflections.FindAndCreate<T>()` scans all loaded assemblies for public, non-abstract classes implementing `IModScanner` or `IModLoader` with a parameterless constructor:

```csharp
public static void Initialize()
{
    _scanners.AddRange(Reflections.FindAndCreate<IModScanner>());
    _loaders.AddRange(Reflections.FindAndCreate<IModLoader>());
}
```

When a mod assembly is loaded, `ModAssemblyLoader.RegisterAssembly()` fans out to `ModDiscoveryRegistry.RegisterAssembly()`, which runs the same discovery on the new assembly — appending any found scanners/loaders to the end of the registration lists.

## LIFO lookup

Both `FindScanner(url)` and `FindLoader(url)` walk the registration list **from the end** (last-registered first). This gives mod-added providers priority over built-in ones:

```csharp
public static IModLoader FindLoader(string url)
{
    for (int i = _loaders.Count - 1; i >= 0; i--)
        if (_loaders[i].IsCanProvide(url))
            return _loaders[i];
    return null;
}
```

## Registration order (typical)

| Step | Registered | Order in list |
|---|---|---|
| Core assembly init | `UserDataModScanner`, `GameDirModScanner` | 0, 1 |
| Core assembly init | `FolderModLoader`, `ZipModLoader` | 0, 1 |
| Mod A loaded | `CommunityCatalogScanner` | End → checked first |
| Mod B loaded | `HttpZipLoader` | End → checked first |

After Mod A and Mod B load:
- `FindLoader("https://example.com/mods/cool.zip")` → `HttpZipLoader` (last, checked first) ✓
- `FindLoader("C:/mods/cool")` → `FolderModLoader` (only built-in matching)
- `FindScanner("https://catalog.example.com/mods")` → `CommunityCatalogScanner` ✓

## Public API

```csharp
public static class ModDiscoveryRegistry
{
    // All registered scanners/loaders in registration order
    public static IReadOnlyList<IModScanner> Scanners { get; }
    public static IReadOnlyList<IModLoader> Loaders { get; }

    // Idempotent init — scans assemblies for implementations
    public static void Initialize();

    // Called by ModAssemblyLoader when a mod DLL loads
    public static void RegisterAssembly(Assembly assembly);

    // LIFO search — returns first matching provider or null
    public static IModScanner FindScanner(string url);
    public static IModLoader FindLoader(string url);
}
```

## How `ModRegistry` uses the registry

The full discovery flow in `ModRegistry.Initialize()`:

```csharp
// 1. Discover all scanners and loaders
ModDiscoveryRegistry.Initialize();

// 2. For each scanner, enumerate its roots
foreach (var scanner in ModDiscoveryRegistry.Scanners)
{
    foreach (var root in scanner.GetRoots())
    {
        if (!scanner.IsCanProvide(root.Url))
            continue;  // Root not accessible — skip

        // 3. For each discovered entry, find a loader
        foreach (var entry in scanner.Discover(root.Url))
        {
            var loader = ModDiscoveryRegistry.FindLoader(entry.Url);
            if (loader == null)
                continue;  // No loader claims this entry

            // 4. Create provider, read manifest, build candidate
            var provider = loader.CreateProvider(entry.Url, entry.EntryName);
            var manifest = ReadManifest(provider);
            // ... register candidate for deduplication ...
        }
    }
}
```
