# Mod Save API

## Implementing IModSaveable in a mod

Your mod must provide a class implementing `IModSaveable`. It is auto-discovered via reflection when your mod assembly loads.

### API

```csharp
public interface IModSaveable
{
    // Called on save. Slot metadata (ModId, ModName, ModVersion) is
    // already filled by the core. Set MinCoreVersion, IsRequired,
    // CustomData, and write Data[...].
    void OnSave(ModSlot slot);

    // Preferred: explicit contract. Return false + error message on
    // failure. Default impl calls OnLoadVoid for backward compat.
    bool OnLoad(ModSlot slot, out string errorMessage);

    // Legacy: throw-based error handling. Override instead of OnLoad
    // if you prefer exceptions for error reporting.
    void OnLoadVoid(ModSlot slot);
}
```

### Minimal example

```csharp
using Cthangover.Core.Mods;
using Cthangover.Core.Settings;

public class MyModSaveHandler : IModSaveable
{
    public void OnSave(ModSlot slot)
    {
        // ModId, ModName, ModVersion already set by core.
        // Set only what the core needs for validation:
        slot.Metadata.IsRequired = true;

        var blob = new DataBlob();
        blob.SetInt("Health", player.Health);
        blob.SetInt("Mana",   player.Mana);
        blob.SetString("Name", player.Name);

        slot.Data["Stats"] = blob;
    }

    public bool OnLoad(ModSlot slot, out string errorMessage)
    {
        if (slot.Data.TryGetValue("Stats", out var blob))
        {
            player.Health = blob.GetInt("Health", 100);
            player.Mana   = blob.GetInt("Mana", 50);
            player.Name   = blob.GetString("Name", "Hero");
            errorMessage = null;
            return true;
        }

        errorMessage = null;
        return true; // No data → nothing to restore, not an error
    }
}
```

### Versioned migration

When your data schema changes, use `DataBlob.Version` to handle migration:

```csharp
public void OnSave(ModSlot slot)
{
    var data = new PlayerStateV2 { Health = 80, Mana = 40, Stamina = 100 };
    slot.Data["FullState"] = new DataBlob(version: 2, data);
}

public bool OnLoad(ModSlot slot, out string errorMessage)
{
    if (!slot.Data.TryGetValue("FullState", out var blob))
    {
        errorMessage = null;
        return true; // no data — nothing to restore
    }

    if (blob.Version == 2)
    {
        var state = blob.ReadJson<PlayerStateV2>();
        Apply(state);
        errorMessage = null;
        return true;
    }

    if (blob.Version == 1)
    {
        var old = blob.ReadJson<PlayerStateV1>();
        Apply(new PlayerStateV2
        {
            Health  = old.Health,
            Mana    = old.Mana,
            Stamina = 100, // default for new field
        });
        errorMessage = null;
        return true;
    }

    errorMessage = $"Unsupported data version: {blob.Version}";
    return false;
}
```

### Binary data (textures)

```csharp
public void OnSave(ModSlot slot)
{
    slot.Data["Skin"] = new DataBlob(textureBytes);
}

public bool OnLoad(ModSlot slot, out string errorMessage)
{
    if (slot.Data.TryGetValue("Skin", out var blob))
    {
        var tex = Texture2D.LoadFromRaw(blob.GetBytes());
        ApplySkin(tex);
    }

    errorMessage = null;
    return true;
}
```

### Marking a mod as optional

If a save can be loaded without your mod, set `IsRequired = false`:

```csharp
slot.Metadata.IsRequired = false;
```

The core will log a warning and skip the mod's data if the mod is not installed.

### Compatibility guard (MinCoreVersion)

If your save data depends on a specific core API, set the minimum version:

```csharp
slot.Metadata.MinCoreVersion = "0.2.0";
```

On load, if the current core version is below `0.2.0`, the load is aborted with an error message.

## Save slot API (SaveService)

| Method | Description |
|---|---|
| `Save(string fileName)` | Build `"__core__"` slot, collect mod slots, write JSON |
| `Load(string fileName) : bool` | Deserialize, validate + restore + dispatch |
| `GetSaveSlots(int slotCount) : List<SaveSlotInfo>` | Enumerate slots with preview metadata |
| `DeleteSave(string fileName)` | Delete JSON + PNG screenshot |
