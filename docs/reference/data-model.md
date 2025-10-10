# Data Model & JSON Schema

> Minimal scene-graph with typed nodes; geometry is CSS-like; styles are token-aware; interaction is placeholder for v0.

## Core Data Model (JSON Schema, Draft 2020-12)

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://paths.design.dev/schemas/canvas-0.1.json",
  "title": "CanvasDocument",
  "type": "object",
  "required": ["schemaVersion", "id", "name", "artboards"],
  "properties": {
    "schemaVersion": { "const": "0.1.0" },
    "id": { "type": "string", "pattern": "^[0-9A-HJKMNP-TV-Z]{26}$" },
    "name": { "type": "string" },
    "meta": { "type": "object", "additionalProperties": true },
    "artboards": {
      "type": "array",
      "items": { "$ref": "#/$defs/Artboard" },
      "minItems": 1
    }
  },
  "$defs": {
    "Artboard": {
      "type": "object",
      "required": ["id", "name", "frame", "children"],
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "frame": { "$ref": "#/$defs/Rect" },
        "background": { "$ref": "#/$defs/Fill", "default": {"type":"solid","color":"tokens.color.background"} },
        "children": { "type": "array", "items": { "$ref": "#/$defs/Node" } }
      }
    },
    "Node": {
      "oneOf": [
        { "$ref": "#/$defs/FrameNode" },
        { "$ref": "#/$defs/GroupNode" },
        { "$ref": "#/$defs/VectorNode" },
        { "$ref": "#/$defs/TextNode" },
        { "$ref": "#/$defs/ImageNode" },
        { "$ref": "#/$defs/ComponentInstanceNode" }
      ]
    },
    "BaseNode": {
      "type": "object",
      "required": ["id", "type", "name", "visible", "frame", "style"],
      "properties": {
        "id": { "type": "string" },
        "type": { "type": "string" },
        "name": { "type": "string" },
        "visible": { "type": "boolean", "default": true },
        "frame": { "$ref": "#/$defs/Rect" },
        "style": { "$ref": "#/$defs/Style" },
        "data": { "type": "object", "additionalProperties": true },
        "bind": { "$ref": "#/$defs/Binding" }
      }
    },
    "FrameNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "frame" },
            "layout": { "$ref": "#/$defs/Layout" },
            "children": { "type": "array", "items": { "$ref": "#/$defs/Node" } }
          }
        }
      ]
    },
    "GroupNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "group" },
            "children": { "type": "array", "items": { "$ref": "#/$defs/Node" } }
          }
        }
      ]
    },
    "VectorNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "vector" },
            "path": { "type": "string" },
            "windingRule": { "enum": ["nonzero", "evenodd"], "default": "nonzero" }
          },
          "required": ["path"]
        }
      ]
    },
    "TextNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "text" },
            "text": { "type": "string" },
            "textStyle": { "$ref": "#/$defs/TextStyle" }
          },
          "required": ["text"]
        }
      ]
    },
    "ImageNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "image" },
            "src": { "type": "string" },
            "mode": { "enum": ["cover", "contain", "fill", "none"], "default": "cover" }
          },
          "required": ["src"]
        }
      ]
    },
    "ComponentInstanceNode": {
      "allOf": [
        { "$ref": "#/$defs/BaseNode" },
        {
          "properties": {
            "type": { "const": "component" },
            "componentKey": { "type": "string" },
            "props": { "type": "object", "additionalProperties": true }
          },
          "required": ["componentKey"]
        }
      ]
    },
    "Rect": {
      "type": "object",
      "required": ["x", "y", "width", "height"],
      "properties": {
        "x": { "type": "number" },
        "y": { "type": "number" },
        "width": { "type": "number", "minimum": 0 },
        "height": { "type": "number", "minimum": 0 }
      }
    },
    "Style": {
      "type": "object",
      "properties": {
        "fills": { "type": "array", "items": { "$ref": "#/$defs/Fill" } },
        "strokes": { "type": "array", "items": { "$ref": "#/$defs/Stroke" } },
        "radius": { "type": "number" },
        "opacity": { "type": "number", "minimum": 0, "maximum": 1 },
        "shadow": { "$ref": "#/$defs/Shadow" }
      },
      "additionalProperties": false
    },
    "Fill": {
      "type": "object",
      "properties": {
        "type": { "enum": ["solid", "linearGradient", "radialGradient"] },
        "color": { "type": "string" },
        "stops": { "type": "array", "items": { "$ref": "#/$defs/ColorStop" } }
      },
      "required": ["type"],
      "additionalProperties": false
    },
    "Stroke": {
      "type": "object",
      "properties": {
        "color": { "type": "string" },
        "thickness": { "type": "number", "minimum": 0 }
      },
      "required": ["color", "thickness"],
      "additionalProperties": false
    },
    "Shadow": {
      "type": "object",
      "properties": {
        "x": { "type": "number" },
        "y": { "type": "number" },
        "blur": { "type": "number" },
        "spread": { "type": "number" },
        "color": { "type": "string" }
      },
      "additionalProperties": false
    },
    "ColorStop": {
      "type": "object",
      "properties": {
        "offset": { "type": "number", "minimum": 0, "maximum": 1 },
        "color": { "type": "string" }
      },
      "required": ["offset", "color"]
    },
    "TextStyle": {
      "type": "object",
      "properties": {
        "family": { "type": "string" },
        "size": { "type": "number" },
        "lineHeight": { "type": "number" },
        "weight": { "type": "string" },
        "letterSpacing": { "type": "number" },
        "color": { "type": "string" }
      },
      "additionalProperties": false
    },
    "Layout": {
      "type": "object",
      "properties": {
        "mode": { "enum": ["absolute", "flex", "grid"], "default": "absolute" },
        "direction": { "enum": ["row", "column"] },
        "gap": { "type": "number" },
        "padding": { "type": "number" }
      },
      "additionalProperties": false
    },
    "Binding": {
      "type": "object",
      "properties": {
        "token": { "type": "string" },
        "prop": { "type": "string" },
        "cssVar": { "type": "string" }
      },
      "additionalProperties": false
    }
  }
}
```

## Notes

* `bind.token` points at `docs/examples/tokens.json` (e.g., `"tokens.color.primary"`).
* `bind.prop` allows component instance to map a node attribute to a React prop.
* Canonicalization rule (formatter): order object keys as `[id,type,name,visible,frame,style,...]` and array children by `z`.

## Example Document (abridged)

```json
{
  "schemaVersion": "0.1.0",
  "id": "01JF2PZV9G2WR5C3W7P0YHNX9D",
  "name": "Home",
  "artboards": [
    {
      "id": "01JF2Q02Q3MZ3Q9J7HB3X6N9QB",
      "name": "Desktop",
      "frame": { "x": 0, "y": 0, "width": 1440, "height": 1024 },
      "children": [
        {
          "id": "01JF2Q06GTS16EJ3A3F0KK9K3T",
          "type": "frame",
          "name": "Hero",
          "frame": { "x": 0, "y": 0, "width": 1440, "height": 480 },
          "style": { "fills": [{ "type": "solid", "color": "tokens.color.surface" }] },
          "layout": { "mode": "flex", "direction": "row", "gap": 24, "padding": 32 },
          "children": [
            {
              "id": "01JF2Q09H0C3YV2TE8EH8X7MTA",
              "type": "text",
              "name": "Title",
              "frame": { "x": 32, "y": 40, "width": 600, "height": 64 },
              "style": {},
              "text": "Build in your IDE",
              "textStyle": { "family": "Inter", "size": 48, "weight": "700", "color": "tokens.color.text" }
            }
          ]
        }
      ]
    }
  ]
}
```

## Merge & Diff Strategy

* **Stable IDs** via ULID; new nodes get ULID at creation in webview, never regenerated.
* **Canonical serialization**: sorted keys, newline at EOF; avoids churn.
* **Design-aware diff**: provide a `tools/designer-diff.ts` that emits object-level diff (add/remove/move/prop-change) for PR comments.

## Performance Notes (v0)

* Scene-graph cached per artboard; simple R-tree for hit-testing (later).
* Layer list virtualized after 500 nodes.
* Avoid re-layout on every pointermove; throttle to 60Hz; batch patches.
