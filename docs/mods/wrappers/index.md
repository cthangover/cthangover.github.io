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

```jsonc
{
  "subscriptions": [
    {
      "scene": "home_kitchen",       // Target scene ID
      "template": "default",         // Wrapper template name (from wrappers/ directory)
      "code": "cooking_panel_init",  // C# handler class name
      "trigger": "on_enter",         // Lifecycle event: on_enter | on_exit
      "priority": 10                 // Execution order: lower runs earlier among multiple subscribers
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

```jsonc
{
  "name": "default",                // Template name — referenced by subscriptions' "template" field
  "slots": {
    "tool_panel": {                 // Named slot for toolbar buttons (e.g. "End Turn", "Cook")
      "anchor_top": 0.0,            // Normalized anchor: 0.0 = top of parent
      "anchor_bottom": 0.1,         // 0.1 = 10% from top → thin strip
      "anchor_left": 0.0,           // Full width from left edge
      "anchor_right": 1.0
    },
    "main_panel": {                 // Central content area for mod UIs
      "anchor_top": 0.1,            // Starts below tool_panel (10% from top)
      "anchor_bottom": 0.85,        // Ends above status_panel (85% from top)
      "anchor_left": 0.0,
      "anchor_right": 1.0
    },
    "status_panel": {               // Bottom bar for status/notifications
      "anchor_top": 0.85,           // Starts at 85% from top
      "anchor_bottom": 1.0,         // Extends to bottom of parent
      "anchor_left": 0.0,
      "anchor_right": 1.0
    }
  }
}
```

Each slot defines a rectangular region using normalized anchors (0.0 = top/left, 1.0 = bottom/right relative to parent).

## Creating a custom wrapper

`wrappers/side_panel.wrappertmpl`:

```jsonc
{
  "name": "side_panel",             // Template name for sidebar layout
  "slots": {
    "sidebar": {                    // Left sidebar (0–25% width)
      "anchor_top": 0.0,
      "anchor_bottom": 1.0,
      "anchor_left": 0.0,
      "anchor_right": 0.25
    },
    "content": {                    // Main content area (25–100% width)
      "anchor_top": 0.0,
      "anchor_bottom": 1.0,
      "anchor_left": 0.25,
      "anchor_right": 1.0
    }
  }
}
```

Then reference it in your manifest:

```jsonc
{ "scene": "my_scene", "template": "side_panel", "code": "my_handler", ... }  // Uses side_panel template
```

In your subscription code fragment, you receive the scene root `Node` and find UI containers by name:

```csharp
var modPanel = FindNode<Control>("Lastground");
if (modPanel == null)
    return;

var myPanel = new MyUIPanel();
myPanel.Name = "MyCustomPanel";
modPanel.AddChild(myPanel);
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
- **Use direct layout** (add nodes directly to the scene root via `FindNode<T>()`) when your UI is self-contained and doesn't share screen space
- The `template` field in subscriptions is optional — omit it to skip the wrapper system and manage layout manually
