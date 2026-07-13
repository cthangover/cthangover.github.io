# Items

JSON-defined items — consumables, resources, and recipe items — with localization, pricing, and crafting recipes.

## JSON structure

```json
{
  "Id":          "type/item_id",
  "Name":        "locale_key_for_name",
  "Description": "locale_key_for_description",
  "Cost":        5,
  "Sprite":      "type/item_id",
  "ItemType":    "Food | Resource | ...",
  "ItemAction":  "action_id"
}
```

## Field reference

| Field | Description |
|---|---|
| `Id` | Unique item ID, path-style (`"food/ration"`) |
| `Name` | Locale key resolved from `.properties` files |
| `Description` | Locale key for tooltip/info text |
| `Cost` | Base price in the game economy |
| `Sprite` | Path to the item icon under the mod's sprites directory |
| `ItemType` | Type tag(s), comma-separated: `Food`, `Resource`, `Quest`, `Recipe`, `Used`, `TargetUsed` |
| `ItemAction` | Action ID resolved via `IItemAction` factory — can be a C# class or a GDScript with `get_item_action_id()` + `use(item)`. Defines the item's use effect |

### ItemType values

`ItemType` is a `[Flags]` enum — multiple values can be combined with a comma:

| Value | Hex | Description |
|---|---|---|
| `Quest` | `0x01` | Quest item — tracked in quest log |
| `Used` | `0x02` | Self-targeting use item |
| `TargetUsed` | `0x04` | Ally/enemy-targeting use item |
| `Food` | `0x08` | Edible (consumes hunger stat) |
| `Resource` | `0x10` | Crafting material |
| `Recipe` | `0x20` | Recipe item (unlocks in cookbook) |
| `CantDrop` | `0x80000000` | Cannot be discarded from inventory |

## Real examples

### Consumable — `core/items/food/ration.json`

```json
{
  "Id": "food/ration",
  "Name": "items/food/ration/name",
  "Description": "items/food/ration/desc",
  "Cost": 5,
  "Sprite": "food/ration",
  "ItemType": "Food"
}
```

### Crafting material — `core/items/food/wolf_meat.json`

```json
{
  "Id": "food/wolf_meat",
  "Name": "items/food/wolf_meat/name",
  "Description": "items/food/wolf_meat/desc",
  "Cost": 1,
  "Sprite": "food/wolf_meat",
  "ItemType": "Resource,Food"
}
```

Note: `ItemType` can be multiple values — `"Resource,Food"` means it's both a crafting ingredient and edible.

### Recipe item

Recipe items are items that represent a craftable recipe in the player's inventory:

```json
{
  "Id": "recipe/wolf_meat_to_ration",
  "Name": "recipe/wolf_meat_to_ration/name",
  "Description": "recipe/wolf_meat_to_ration/desc",
  "Sprite": "recipe/wolf_meat_to_ration",
  "ItemType": "Recipe"
}
```

## Item index file

`items/items.json` registers items using `$ref` syntax:

```json
{
  "Items": [
    "${food/ration}",
    "${food/wolf_meat}",
    "${resource/branches}"
  ]
}
```

`${food/ration}` expands to `items/food/ration.json`.

## Recipes

Recipes are defined separately in `recipes/` and describe input→output transformations:

```json
{
  "Items": [{
    "Id": "recipe/wolf_meat_to_ration",
    "Name": "recipe/wolf_meat_to_ration/name",
    "Type": "Cooking",
    "Time": 15,
    "Input": [
      { "Id": "food/wolf_meat", "Count": 1 },
      { "Id": "resource/branches", "Count": 2 }
    ],
    "Output": [
      { "Id": "food/ration", "Count": 1 }
    ]
  }]
}
```

| Field | Description |
|---|---|
| `Id` | Unique recipe ID |
| `Name` | Locale key for recipe display name |
| `Type` | Workbench type — currently only `"Cooking"` |
| `Time` | Crafting time in in-game minutes |
| `Input` | Required ingredients: `Id` (item ID) + `Count` |
| `Output` | Produced items: `Id` (item ID) + `Count` |

## Locale keys

Item JSONs reference locale keys — you need to define the actual text in `locale/en.properties`:

```properties
items/food/ration/name = Ration
items/food/ration/desc = A daily ration unit for one person
items/food/wolf_meat/name = Wolf cutlet
items/food/wolf_meat/desc = Raw wolf meat
recipe/wolf_meat_to_ration/name = Ration from wolf meat
recipe/wolf_meat_to_ration/desc = A recipe for cooking wolf meat safely
```

## Adding a new item

1. Create `items/{type}/{id}.json` with all fields
2. Add it to `items/items.json`: `"${type/id}"`
3. Add locale keys for name and description
4. Optionally add a sprite icon
5. If the item has an active use, reference it via the factory — implement either an `IItemAction` C# class or a GDScript with `get_item_action_id()` + `use(item)`. See [GDScript in Mods](site/docs/mods/src/gdscript) for details.
