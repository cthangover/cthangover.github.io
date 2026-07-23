# Items

JSON-defined items — consumables, resources, and recipe items — with localization, pricing, and crafting recipes.

## JSON structure

```jsonc
{
  // Unique item ID in path-style format (e.g. "food/ration")
  "Id":          "type/item_id",
  // Locale key for the item's display name
  "Name":        "locale_key_for_name",
  // Locale key for the item's tooltip/description
  "Description": "locale_key_for_description",
  // Base purchase price in the game economy
  "Cost":        5,
  // Path to the item icon sprite, resolved under the mod's sprites directory
  "Sprite":      "type/item_id",
  // Type flags (comma-separated): Food, Resource, Quest, Recipe, Used, TargetUsed
  "ItemType":    "Food,Resource",
  // Action ID for the item's use effect; resolved via IItemAction factory
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

```jsonc
{
  // Unique item ID
  "Id": "food/ration",
  // Locale key → "Ration"
  "Name": "items/food/ration/name",
  // Locale key → "A daily ration unit for one person"
  "Description": "items/food/ration/desc",
  // Base price: 5 gold
  "Cost": 5,
  // Icon sprite path under the mod's sprites folder
  "Sprite": "food/ration",
  // Edible item (consumes hunger stat on use)
  "ItemType": "Food"
}
```

### Crafting material — `core/items/food/wolf_meat.json`

```jsonc
{
  // Unique item ID
  "Id": "food/wolf_meat",
  // Locale key → "Wolf cutlet"
  "Name": "items/food/wolf_meat/name",
  // Locale key → "Raw wolf meat"
  "Description": "items/food/wolf_meat/desc",
  // Base price: 1 gold — cheap, but important for recipes
  "Cost": 1,
  // Icon sprite path
  "Sprite": "food/wolf_meat",
  // Both a crafting ingredient (Resource) and edible (Food)
  "ItemType": "Resource,Food"
}
```

Note: `ItemType` can be multiple values — `"Resource,Food"` means it's both a crafting ingredient and edible.

### Recipe item

Recipe items are items that represent a craftable recipe in the player's inventory:

```jsonc
{
  // Unique recipe item ID
  "Id": "recipe/wolf_meat_to_ration",
  // Locale key for the recipe name
  "Name": "recipe/wolf_meat_to_ration/name",
  // Locale key for the recipe description
  "Description": "recipe/wolf_meat_to_ration/desc",
  // Icon sprite path
  "Sprite": "recipe/wolf_meat_to_ration",
  // Recipe type — unlocks in the cookbook when acquired
  "ItemType": "Recipe"
}
```

## Item index file

`items/items.json` registers items using `$ref` syntax:

```jsonc
{
  // $ref entries — each ${...} path expands to items/{path}.json and its contents are merged in
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

```jsonc
{
  // Wrapping array — recipe definitions are listed under Items
  "Items": [{
    // Unique recipe ID
    "Id": "recipe/wolf_meat_to_ration",
    // Locale key for the recipe display name
    "Name": "recipe/wolf_meat_to_ration/name",
    // Workbench type — "Cooking" is currently the only supported type
    "Type": "Cooking",
    // Crafting time in in-game minutes
    "Time": 15,
    // Required ingredients: Id references an item definition, Count is the quantity needed
    "Input": [
      { "Id": "food/wolf_meat", "Count": 1 },
      { "Id": "resource/branches", "Count": 2 }
    ],
    // Produced items on successful craft
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
