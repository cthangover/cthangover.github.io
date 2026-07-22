# Wrappers — UI Templates

Wrapper templates (`.wrappertmpl`) define the structure of UI container widgets. They control how mod-added UI panels are positioned, sized, and layered within a scene.

## Directory structure

```filestree
wrappers/
├── default.wrappertmpl
└── custom_layout.wrappertmpl
```

## What wrappers do

A wrapper is a JSON template that describes a UI container — its anchors, margins, and child slots. When a mod subscribes to a scene (`manifest.json` → `subscriptions`), the `template` field selects which wrapper to use for its UI:

```json
{
  "subscriptions": [
    {
      "scene": "home_kitchen",
      "template": "default",
      "code": "cooking_panel_init",
      "trigger": "on_enter",
      "priority": 10
    }
  ]
}
```

The `"template": "default"` means the cooking UI is hosted inside the default wrapper widget.

## Real example — `core/wrappers/default.wrappertmpl`

The default wrapper provides a full-screen container with sections for:
- A top tool panel (for buttons like "End Turn", "Cook", "Close")
- A central content area (for the main UI)
- A bottom status bar

```json
{
  "name": "default",
  "slots": {
    "tool_panel": {
      "anchor_top": 0.0,
      "anchor_bottom": 0.1,
      "anchor_left": 0.0,
      "anchor_right": 1.0
    },
    "main_panel": {
      "anchor_top": 0.1,
      "anchor_bottom": 0.85,
      "anchor_left": 0.0,
      "anchor_right": 1.0
    },
    "status_panel": {
      "anchor_top": 0.85,
      "anchor_bottom": 1.0,
      "anchor_left": 0.0,
      "anchor_right": 1.0
    }
  }
}
```

Each slot defines a rectangular region using normalized anchors (0.0 = top/left, 1.0 = bottom/right relative to parent).

## Creating a custom wrapper

`wrappers/side_panel.wrappertmpl`:

```json
{
  "name": "side_panel",
  "slots": {
    "sidebar": {
      "anchor_top": 0.0,
      "anchor_bottom": 1.0,
      "anchor_left": 0.0,
      "anchor_right": 0.25
    },
    "content": {
      "anchor_top": 0.0,
      "anchor_bottom": 1.0,
      "anchor_left": 0.25,
      "anchor_right": 1.0
    }
  }
}
```

Then reference it in your manifest:

```json
{ "scene": "my_scene", "template": "side_panel", "code": "my_handler", ... }
```

In your C# handler, access slots by name:

```csharp
public class MyHandler : ISubscriptionHandler
{
    public void OnEnter(SceneContext ctx)
    {
        var sidebar = ctx.GetSlot("sidebar");
        var content = ctx.GetSlot("content");

        var myPanel = new MyUIPanel();
        content.AddChild(myPanel);
    }
}
```

## Using ModWidget

When creating UI components from mod C# code, inherit from `ModWidget` instead of plain `Control`. `ModWidget` ensures the graphics system is correctly initialized for mod-loaded assemblies:

```csharp
public class MyUIPanel : ModWidget
{
    public MyUIPanel()
    {
        // Constructor runs after graphics init
        var label = new Label { Text = "Hello from mod!" };
        AddChild(label);
    }
}
```

## Wrapper vs direct layout

- **Use wrappers** when your UI needs to coexist with other mods' UI in the same scene (each mod gets its own wrapper slot)
- **Use direct layout** (add nodes directly to `ctx.RootNode`) when your UI is self-contained and doesn't share screen space
- The `template` field in subscriptions is optional — omit it to skip the wrapper system and manage layout manually
