 # Local “Canvas mode” (Design‑in‑IDE) — v0.1 Working Spec

> A minimal, local‑only MCP and Extension, open‑format design canvas that lives in your repo, renders in a VS Code (or Cursor ) Webview via extension and MCP, and round‑trips to code via deterministic generation.

---

## 0. Objectives & Non‑Goals

**Objectives**

* Design artifacts live beside code in the repo (diff‑able, review‑able).
* Deterministic round‑trip: design → code (templates), and code → design (token/prop reflection).
* IDE‑native UX: VS Code Webview (v0), Cursor MCP (v0.2), no network required.
* Merge‑aware: stable IDs, canonical ordering, structural diff.
* Extensible: schema + adapters (React DOM v0; React Native/Swift/Kotlin later).

**Non‑Goals (v0)**

* Real‑time multi‑user CRDT sync (pave path via Y.js but not required).
* Full Figma parity; start with **SVG import** and **basic shapes/text**.
* Arbitrary framework generation; begin with **React + CSS Modules** (clear, readable output).

**Invariants**

* Files are human‑legible JSON; schema versioned (`schemaVersion`), canonicalized (sorted keys).
* Every node has a **stable ULID**; parenting is explicit; z‑order is array order.
* No hidden I/O: the extension may only read/write inside workspace.

---

## 1. Repo Layout

```
/
├─ design/
│  ├─ home.canvas.json        # a document (artboards, layers)
│  ├─ tokens.json             # color/type/space tokens
│  └─ mappings.react.json     # node→component mappings & templates
├─ src/
│  └─ ui/                     # generated components land here
└─ tools/
   ├─ designer-generate.ts      # codegen CLI
   └─ designer-watch.ts         # file watcher + reflect tokens
```

---

## 2. Core Data Model (JSON Schema, Draft 2020‑12)

> Minimal scene‑graph with typed nodes; geometry is CSS‑like; styles are token‑aware; interaction is placeholder for v0.

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

**Notes**

* `bind.token` points at `design/tokens.json` (e.g., `"tokens.color.primary"`).
* `bind.prop` allows component instance to map a node attribute to a React prop.
* Canonicalization rule (formatter): order object keys as `[id,type,name,visible,frame,style,...]` and array children by `z`.

---

## 3. Example Document (abridged)

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

---

## 4. Tokens (design/tokens.json)

```json
{
  "$schema": "https://paths.design.dev/schemas/tokens-0.1.json",
  "schemaVersion": "0.1.0",
  "color": {
    "background": "#0B0B0B",
    "surface": "#111317",
    "primary": "#4F46E5",
    "text": "#E6E6E6"
  },
  "space": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
  "type": { "body": { "family": "Inter", "size": 16, "lineHeight": 24 } }
}
```

---

## 5. Mapping Spec (design/mappings.react.json)

> Declarative mapping from node kinds → React emitters. Keep it inspectable and unit‑testable.

```json
{
  "componentLibrary": "vanilla",
  "rules": [
    {
      "when": { "node.type": "frame", "nameMatches": "Hero" },
      "emit": { "component": "Hero", "file": "src/ui/Hero.tsx" }
    },
    {
      "when": { "node.type": "text" },
      "emit": { "component": "Text", "file": "src/ui/atoms/Text.tsx" }
    }
  ],
  "style": {
    "mode": "css-modules",
    "filePattern": "src/ui/[name].module.css",
    "cssVarsFromTokens": true
  }
}
```

---

## 6. Codegen CLI (tools/designer-generate.ts, abridged)

```ts
#!/usr/bin/env ts-node
import fs from 'node:fs';
import path from 'node:path';
import { ulid } from 'ulidx';

type Canvas = any; // import schema types in real impl

function cssVar(key: string) { return `var(--${key.replace(/\./g,'-')})`; }

function emitText(node: any) {
  return `<span className={s.text}>${node.text}</span>`;
}

function emitFrame(node: any, children: string[]) {
  return `<div className={s.frame}>${children.join('\n')}</div>`;
}

function* walk(node: any): Generator<string> {
  switch (node.type) {
    case 'text': yield emitText(node); break;
    case 'frame': yield emitFrame(node, (node.children||[]).flatMap(n=>Array.from(walk(n)))); break;
    default: break;
  }
}

function generate(canvasPath: string, outDir: string) {
  const doc: Canvas = JSON.parse(fs.readFileSync(canvasPath, 'utf8'));
  const ab = doc.artboards[0];
  const hero = ab.children.find((n:any)=>n.name==='Hero');
  const jsx = Array.from(walk(hero)).join('\n');
  const component = `import s from './Hero.module.css';\nexport default function Hero(){\n return <>${jsx}</>;\n}`;
  fs.mkdirSync(path.join(outDir), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'Hero.tsx'), component);
  fs.writeFileSync(path.join(outDir, 'Hero.module.css'), `.frame{display:flex;gap:24px;padding:32px}\n.text{color:var(--color-text)}`);
}

const [,, canvas, out] = process.argv;
if (!canvas || !out) { console.error('usage: designer-generate design/home.canvas.json src/ui'); process.exit(1); }
generate(canvas, out);
```

**Determinism rules**

* Sort children by array index; stable ULIDs; stringify with fixed spacing; no Date.now().

---

## 7. Token Reflection (tools/designer-watch.ts, abridged)

> Reflect tokens → `:root` CSS vars for the app (and webview preview), and allow code→design feedback.

```ts
import fs from 'node:fs';
import chokidar from 'chokidar';

function writeCssVars(tokensPath: string, outCss: string) {
  const t = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  const flat = (obj: any, prefix = 'color'): string[] => {
    const res: string[] = [];
    const walk = (o:any, p:string[])=>{ for (const k in o){
      const v=o[k]; const np=[...p,k];
      if (typeof v === 'object') walk(v,np); else res.push(`--${np.join('-')}:${v}`);
    }}; walk(obj,["color"]); return res; };
  const lines = [":root{", ...flat(t.color), "}"];
  fs.writeFileSync(outCss, lines.join(';'));
}

writeCssVars('design/tokens.json', 'src/ui/tokens.css');
chokidar.watch('design/tokens.json').on('change',()=>writeCssVars('design/tokens.json','src/ui/tokens.css'));
```

---

## 8. VS Code Extension (skeleton)

**Files**

```
.vscodeignore
package.json
src/extension.ts
media/webview/index.html
media/webview/main.js
```

**package.json (abridged)**

```json
{
  "name": "paths-design/designer",
  "publisher": "yours",
  "version": "0.1.0",
  "engines": { "vscode": "^1.93.0" },
  "activationEvents": ["onCommand:@paths.design/designer.open"],
  "contributes": { "commands": [{ "command": "@paths.design/designer.open", "title": "Open Designer" }] },
  "main": "./dist/extension.js"
}
```

**src/extension.ts (abridged)**

```ts
import * as vscode from 'vscode';
import * as fs from 'node:fs';

export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.commands.registerCommand('@paths.design/designer.open', ()=>{
    const panel = vscode.window.createWebviewPanel('@paths.design/designer','Designer',{viewColumn:1},{enableScripts:true, retainContextWhenHidden:true});
    const html = fs.readFileSync(ctx.asAbsolutePath('media/webview/index.html'),'utf8');
    panel.webview.html = html.replace('{{cspSource}}', panel.webview.cspSource);

    panel.webview.onDidReceiveMessage(async msg => {
      if (msg.type==='loadDoc') {
        const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri,'design/home.canvas.json');
        const text = (await vscode.workspace.fs.readFile(uri)).toString();
        panel.webview.postMessage({type:'doc', payload: JSON.parse(text)});
      }
      if (msg.type==='saveDoc') {
        const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri,'design/home.canvas.json');
        await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(msg.payload, null, 2)));
      }
    });
  }));
}
```

**media/webview/index.html (abridged)**

```html
<!doctype html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline' {{cspSource}}; script-src {{cspSource}};">
<style>canvas{border:1px solid #333; background:#111}</style>
</head>
<body>
<button id="load">Load</button>
<canvas id="c" width="1024" height="640"></canvas>
<script src="main.js"></script>
</body></html>
```

**media/webview/main.js (super‑minimal renderer)**

```js
const vscode = acquireVsCodeApi();
const ctx = document.getElementById('c').getContext('2d');

document.getElementById('load').onclick = ()=>vscode.postMessage({type:'loadDoc'});

window.addEventListener('message', (e)=>{
  const {type, payload} = e.data; if (type!=='doc') return;
  draw(payload);
});

function draw(doc){
  ctx.clearRect(0,0,1024,640);
  const ab = doc.artboards[0];
  for (const node of ab.children){
    if (node.type==='frame') {
      ctx.fillStyle = '#222';
      ctx.fillRect(node.frame.x, node.frame.y, node.frame.width, node.frame.height);
      for (const ch of (node.children||[])) if (ch.type==='text') {
        ctx.fillStyle = '#e6e6e6';
        ctx.font = `${ch.textStyle?.size||16}px Inter`;
        ctx.fillText(ch.text, ch.frame.x, ch.frame.y+ch.textStyle?.size||16);
      }
    }
  }
}
```

**Security**: CSP locked to webview source; no remote content; only workspace FS.

---

## 9. Cursor MCP (optional v0.2)

**.cursor/mcp.json**

```json
{
  "version": 1,
  "tools": {
    "paths-design/designer": {
      "transport": { "stdio": { "command": "node", "args": ["tools/mcp-designer.js"] } },
      "displayName": "Designer"
    }
  }
}
```

**tools/mcp-designer.js (toy server)**

```js
#!/usr/bin/env node
process.stdin.setEncoding('utf8');
const fs = require('fs');

function respond(id, result){
  process.stdout.write(JSON.stringify({jsonrpc:'2.0', id, result})+'\n');
}

process.stdin.on('data', chunk=>{
  for (const line of chunk.split(/\n+/)){
    if(!line.trim()) continue; const msg = JSON.parse(line);
    if (msg.method==='@paths.design/designer.getDoc'){
      const doc = JSON.parse(fs.readFileSync('design/home.canvas.json','utf8'));
      respond(msg.id, doc);
    }
    if (msg.method==='@paths.design/designer.applyPatch'){
      fs.writeFileSync('design/home.canvas.json', JSON.stringify(msg.params.doc, null, 2));
      respond(msg.id, {ok:true});
    }
    if (msg.method==='@paths.design/designer.generate'){
      // shell out to tools/designer-generate.ts in real impl
      respond(msg.id, {ok:true, files:['src/ui/Hero.tsx']});
    }
  }
});
```

---

## 10. SVG Import (paste‑in)

* Accept SVG string → parse to SVG DOM → convert to `VectorNode` (path data) and `GroupNode`.
* Map `fill`, `stroke`, `strokeWidth` to `Style`; preserve text as `TextNode` where possible.
* Heuristic tokenization: if color matches `tokens.color.*` value, replace literal with token reference in `bind.token`.

---

## 11. Merge & Diff Strategy

* **Stable IDs** via ULID; new nodes get ULID at creation in webview, never regenerated.
* **Canonical serialization**: sorted keys, newline at EOF; avoids churn.
* **Design‑aware diff**: provide a `tools/designer-diff.ts` that emits object‑level diff (add/remove/move/prop‑change) for PR comments.

---

## 12. Performance Notes (v0)

* Scene‑graph cached per artboard; simple R‑tree for hit‑testing (later).
* Layer list virtualized after 500 nodes.
* Avoid re‑layout on every pointermove; throttle to 60Hz; batch patches.

---

## 13. Tests & CI Gates

* **Schema validation** with `ajv` on every save.
* **Determinism**: snapshot tests on codegen outputs; same input → identical bytes.
* **Token reflection** test: tokens → CSS vars mapping round‑trips literal values.
* **Accessibility quick‑checks**: text color vs background contrast ≥ 4.5:1 if both resolve to hex.

---

## 14. Failure‑Mode Cards

* **F‑01: Token Drift** — Code renames a token (`color.text`→`color.fg`). *Mitigation*: watcher builds reverse index by value and flags orphaned bindings; suggests rename patch.
* **F‑02: Merge Clash** — Two branches move same node. *Mitigation*: object‑level 3‑way merge; prefer spatial average + record conflict note in `meta.conflicts`.
* **F‑03: Non‑deterministic Generation** — Timestamps/IDs leak into output. *Mitigation*: forbid Date/Math.random in codegen; provide seeded RNG if needed.

---

## 15. Minimal Workflow (end‑to‑end)

1. Edit `design/home.canvas.json` with the webview (drag text, edit styles).
2. Save → schema validated, canonicalized.
3. Run `ts-node tools/designer-generate.ts design/home.canvas.json src/ui`.
4. Import `src/ui/Hero.tsx` in app, include `src/ui/tokens.css`.
5. Change `design/tokens.json` → watcher updates CSS vars → live style change.

---

## 16. Roadmap Sketch

* v0.2: Cursor MCP parity; JSON Patch over webview; SVG paste‑in.
* v0.3: Y.js CRDT opt‑in; visual diff in PR; component instance → prop mapping UI.
* v0.4: Figma plugin (export subset → canvas.json); React Native adapter.
* v1.0: Plugin SDK for custom emitters; a11y & i18n linters; perf profiles.

---

## 17. Acceptance (v0.1)

* All artifacts are local‑only; no network required.
* Codegen of a named frame → React component + CSS Module is reproducible.
* Tokens reflect to CSS vars; doc loads in VS Code webview and renders text/frame.
* Schema validates; formatter keeps diffs minimal.

---

## 18. Crosswalk: Reusing Your *Animator* Architecture

> Map the After‑Effects‑style project (Animator) to this Design‑in‑IDE tool. What carries over as‑is, what adapts, what to avoid.

### 18.1 What Transfers Almost 1:1

* **CAWS/AGENTS discipline**: Keep `.caws/working-spec.yaml`, risk tiering, provenance, and CI gates; reuse *exactly*.
* **Repo governance & docs**: `docs/…` structure, impact maps, non‑functional specs, and test plans → same shape.
* **Property‑based testing**: `fast-check` style tests for schema invariants (stable ULIDs, canonical order, idempotent codegen).
* **CRDT substrate (Yjs/Automerge)**: Optional module for multi‑user editing and conflict‑free merges; plug into webview state.
* **Open formats & CAS thinking**: Keep diff‑able, human‑legible JSON; optional CAS index for large assets.

### 18.2 What Adapts with Thin Wrappers

* **Scene Graph** → **Canvas Graph**: Drop time dimension in v0; retain nodes, transforms, styles. Preserve stable IDs and structural sharing.
* **Timeline System** → **Design History**: Use timeline infra to power undo/redo stacks and PR visual diffs (not keyframing yet).
* **Effects/Shader pipeline** → **Canvas Renderer**: Replace WGSL/WebGPU with 2D canvas/SVG now; keep an adapter boundary so a WebGPU renderer can slot in later for complex vector ops.
* **Contracts/OpenAPI** → **Schema Contracts**: Swap HTTP OpenAPI for JSON‑Schema contracts (already included) + codegen contracts (component emitters).
* **Sandboxed expressions** → **Safe templates**: Constrain codegen templates (no eval; deterministic output; lint before write).

### 18.3 What to Avoid (for now)

* **Full GPU compositor**: Overkill for v0; webview Canvas/SVG is enough and keeps the extension light.
* **Global real‑time**: Keep sync local‑first; multi‑player behind a feature flag. Avoid auth/infra until editor proves valuable.

---

## 19. Proposed Monorepo Layout (Animator‑style)

```
/
├─ packages/
│  ├─ canvas-schema/         # JSON Schema + TS types (zod/ajv exports)
│  ├─ canvas-engine/         # scene graph ops (immutability, hit tests), no UI
│  ├─ canvas-renderer-dom/   # 2D canvas/SVG renderer for VS Code webview
│  ├─ codegen-react/         # deterministic React + CSS‑Modules emitters
│  ├─ tokens/                # token parser, CSS‑var emitter
│  ├─ diff-visualizer/       # object‑level diffs → HTML for PR comments
│  └─ mcp-adapter/           # optional MCP stdio bridge for Cursor
├─ apps/
│  ├─ vscode-ext/            # the webview host; packs renderer + engine
│  └─ cli/                   # designer-generate, designer-watch, designer-diff
├─ .caws/                    # working specs, risk tiers
└─ docs/                     # ADRs, non‑functional, test plans
```

---

## 20. Engineering Challenges → Borrowed Solutions

| Challenge            | Borrow from *Animator*                | Concrete Tactic                                                          |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| Deterministic output | Deterministic GPU pipeline discipline | Freeze RNG; forbid timestamps; snapshot codegen; schema canonicalizer    |
| Merge conflicts      | CRDT mental model                     | Stable IDs; object‑level 3‑way merge; optional Yjs branch reconciliation |
| Performance          | Dirty tracking/structural sharing     | Persistent data structures for node edits; batched patches to webview    |
| Testability          | Property‑based testing                | fast‑check generators over Node/Style; fuzz importers (SVG → VectorNode) |
| A11y from day one    | A11y NFRs                             | Contrast check in CI; keyboard nav in webview; reduced‑motion flags      |
| Security             | Sandboxed expressions                 | No eval; template whitelist; path allow‑list within workspace            |

---

## 21. Targeted Edits (Working Spec‑style)

**TE‑1 — Extract ********************`canvas-engine`******************** from Animator’s scene graph**

* *Change*: Remove time/curves; keep nodes, transforms, styles, hit‑testing API.
* *Acceptance*: 1k property‑based ops with no invariant violations; ops are pure and associative (where defined).

**TE‑2 — Replace WGSL/WebGPU with DOM renderer**

* *Change*: Implement renderer that consumes the engine tree and paints to `<canvas>`/SVG.
* *Acceptance*: Render parity on a golden sample (10 scenes) within ±1px and identical text layout for Inter 16/24 baseline.

**TE‑3 — Port CRDT interface behind a flag**

* *Change*: Wrap engine ops in Yjs doc bindings; persist to JSON on save.
* *Acceptance*: Two clients edit disjoint subtrees; produce conflict‑free save with stable ordering.

**TE‑4 — Codegen contracts**

* *Change*: Specify emitter contract (input: Node subtree + tokens; output: files[] + diffs).
* *Acceptance*: Same doc → identical bytes across runs and machines; lint passes; no network.

**TE‑5 — PR visual diff**

* *Change*: `designer-diff` renders before/after thumbnails for changed nodes.
* *Acceptance*: GitHub comment artifact shows node‑level add/remove/move/prop deltas.

---

## 22. Verification Quick‑Checks (A11y/Perf/Type)

* **A11y**: Contrast ≥ 4.5:1 for resolved color pairs; focusable elements in webview have visible outline; respects `prefers-reduced-motion`.
* **Perf**: 10k node doc edits at 60Hz on M1 Air; paint ≤ 4ms median/frame; GC pauses ≤ 10ms p95.
* **Type**: TS strict; schema types generated; no `any` in public APIs.

---

## 23. React‑in‑the‑Canvas (Design‑time Components → Code)

**Claim**: Yes. We can run real React components *inside* the editor webview, edit their props/slots visually, and deterministically emit React code.

### 23.1 Operating Modes

* **Preview Mode (Runtime)**: Load a component bundle into the webview and render it with React DOM. Users manipulate props, slots, and tokens via an inspector. No side‑effects allowed.
* **Canvas Mode (Static)**: Components are *represented* as `ComponentInstanceNode` in the document. The preview uses runtime rendering; persistence uses the static JSON graph.

### 23.2 Architecture (Layers)

1. **Loader/Sandbox**

   * Bundle user components with `esbuild` (web‑worker) using an **in‑memory FS** + **import map**.
   * Enforce a **design‑time runtime**: forbid `fetch`, timers, and DOM globals; shim with mocks.
   * Only allow imports from an allowlist (`react`, `@design/tokens`, `@ui/*`).
2. **Host Renderer**

   * Use React DOM inside the webview. Option A: standard DOM render. Option B (later): a **custom reconciler** for our scene graph (keeps preview and document perfectly aligned).
3. **Inspector/Bridge**

   * Extract component metadata from TypeScript (react‑docgen‑typescript or TSC) → **Prop schema** (name, type, default, required).
   * Map **slots** via a convention (e.g., `children`, `slot.*` props) and expose slot drop targets on canvas.
   * Prop edits emit **JSON Patch** to `ComponentInstanceNode.props`; rerender preview.
4. **Serializer/Codegen**

   * Persist `ComponentInstanceNode` with `{ componentKey, props, children[] }`.
   * Deterministic emitter turns a subtree into JSX + CSS Modules (or returns `<Component {...props}>…</Component>` if mapped to a real component file).

### 23.3 Component Contract (minimal)

```ts
// src/ui/Button.tsx
/**
 * @design.component key="Button" version="1"
 * @design.props schema="zod"
 */
export type ButtonProps = {
  kind?: 'primary'|'secondary';
  size?: 'sm'|'md'|'lg';
  iconLeft?: React.ReactNode;
  children?: React.ReactNode;
}
export default function Button({kind='primary', size='md', iconLeft, children}: ButtonProps){
  return <button className={`btn ${kind} ${size}`}>{iconLeft}{children}</button>;
}
```

**Discovery**: a build‑time step produces `design/components.index.json`:

```json
{
  "Button": {
    "file": "src/ui/Button.tsx",
    "props": {
      "kind": {"type":"enum","values":["primary","secondary"],"default":"primary"},
      "size": {"type":"enum","values":["sm","md","lg"],"default":"md"},
      "iconLeft": {"type":"node"},
      "children": {"type":"node"}
    }
  }
}
```

### 23.4 Determinism & Safety

* **No effects**: ban `useEffect` with external I/O in preview; allow `useLayoutEffect` for layout only. Lint rule: `design-preview/no-side-effects`.
* **Pure inputs**: preview renders from `{props,tokens}` only. Randomness requires a seeded RNG.
* **Style isolation**: preview uses Shadow DOM root; codegen targets CSS Modules.
* **A11y guards**: inspector exposes aria props; quick‑check runs against the composed preview DOM.

### 23.5 Codegen Strategies

* **Direct Instance Emit** (recommended): `ComponentInstanceNode(Button, props, children)` → JSX import + instantiation. Stable import specifier from component index.
* **Decomposition Emit** (fallback): For primitives, emit `<div/span/svg>` with styles derived from tokens.
* **Slot Mapping**: nested `ComponentInstanceNode` becomes children/slot props in emitted JSX.

### 23.6 Example Round‑Trip

1. Drop **Button** onto canvas → adds `ComponentInstanceNode{componentKey:'Button', props:{size:'md'}}`.
2. Edit props in inspector; drop an icon into `iconLeft`.
3. Save → JSON persists.
4. Run codegen →

```tsx
import Button from '@/ui/Button';
import { IconPlus } from '@/ui/icons';
export default function HeroCTA(){
  return (
    <Button kind="primary" size="md" iconLeft={<IconPlus/>}>
      Get Started
    </Button>
  );
}
```

### 23.7 Acceptance (React Preview)

* Can render a library of 10 demo components in the webview sandbox without network or side effects.
* Prop edits produce JSON Patch; re‑render in ≤ 16ms median.
* Same doc + tokens → identical emitted JSX bytes across machines.
* A11y quick‑check passes for sample library (focus ring visible, contrast ≥ 4.5:1).

---

## 24. Monorepo Scaffold (copy‑paste files)

> Minimal, runnable starter with npm/yarn/pnpm workspaces. Default: **pnpm** recommended.

### 24.1 Root files

**package.json**

```json
{
  "name": "paths-design/designer",
  "private": true,
  "packageManager": "pnpm@9.10.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "pnpm -r run build",
    "typecheck": "pnpm -r run typecheck",
    "lint": "pnpm -r run lint",
    "dev:ext": "pnpm --filter @paths-design/designer/vscode-ext dev",
    "dev:cli": "pnpm --filter @paths-design/designer/cli dev",
    "generate": "pnpm --filter @paths-design/designer/cli generate design/home.canvas.json src/ui",
    "watch:tokens": "pnpm --filter @paths-design/designer/cli watch:tokens"
  }
}
```

**tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "types": ["node"],
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "baseUrl": "."
  }
}
```

**.editorconfig**

```
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

**.gitignore**

```
node_modules
.vscode-test
.vscode/.tsbuildinfo
coverage
/dist
.DS_Store
```

**design/home.canvas.json** (from §3) and **design/tokens.json** (from §4)

**.caws/working-spec.yaml**

```yaml
version: 0.1
feature: paths-design/designer v0.1 bootstrap
risk_tier: 1
acceptance:
  - doc loads in webview and renders sample text/frame
  - codegen from Hero frame produces deterministic JSX/CSS
  - tokens reflect to :root CSS vars
checks:
  determinism: snapshot-tests
  a11y: contrast >= 4.5:1
```

---

### 24.2 packages/canvas-schema

**packages/canvas-schema/package.json**

```json
{
  "name": "@paths-design/designer/canvas-schema",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "echo noop"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "zod": "^3.23.8"
  },
  "files": ["dist", "schemas"]
}
```

**packages/canvas-schema/tsconfig.json**

```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist" }, "include": ["src"] }
```

**packages/canvas-schema/src/index.ts**

```ts
import { z } from 'zod';
export const ULID = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
export const Rect = z.object({ x: z.number(), y: z.number(), width: z.number().min(0), height: z.number().min(0) });
export const TextStyle = z.object({ family: z.string().optional(), size: z.number().optional(), lineHeight: z.number().optional(), weight: z.string().optional(), letterSpacing: z.number().optional(), color: z.string().optional() });
export const Style = z.object({ fills: z.array(z.any()).optional(), strokes: z.array(z.any()).optional(), radius: z.number().optional(), opacity: z.number().min(0).max(1).optional(), shadow: z.any().optional() });
const BaseNode = z.object({ id: ULID, type: z.string(), name: z.string(), visible: z.boolean().default(true), frame: Rect, style: Style.optional(), data: z.record(z.any()).optional(), bind: z.any().optional() });
export type BaseNode = z.infer<typeof BaseNode>;
export const TextNode = BaseNode.extend({ type: z.literal('text'), text: z.string(), textStyle: TextStyle.optional() });
export const FrameNode = BaseNode.extend({ type: z.literal('frame'), layout: z.record(z.any()).optional(), children: z.lazy(()=>Node.array()).default([]) });
export const ComponentInstanceNode = BaseNode.extend({ type: z.literal('component'), componentKey: z.string(), props: z.record(z.any()).default({}) });
export const Node: z.ZodType<any> = z.union([FrameNode, TextNode, ComponentInstanceNode]);
export const Artboard = z.object({ id: ULID, name: z.string(), frame: Rect, children: Node.array().default([]) });
export const CanvasDocument = z.object({ schemaVersion: z.literal('0.1.0'), id: ULID, name: z.string(), artboards: Artboard.array().min(1) });
export type CanvasDocument = z.infer<typeof CanvasDocument>;
```

---

### 24.3 packages/canvas-engine

**packages/canvas-engine/package.json**

```json
{ "name": "@paths-design/designer/canvas-engine", "version": "0.1.0", "type": "module", "main": "dist/index.js", "types": "dist/index.d.ts", "scripts": { "build": "tsc -p tsconfig.json", "typecheck": "tsc -p tsconfig.json --noEmit", "lint": "echo noop" }, "dependencies": { "@paths-design/designer/canvas-schema": "0.1.0" }, "devDependencies": { "typescript": "^5.6.2" } }
```

**packages/canvas-engine/tsconfig.json**

```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist" }, "include": ["src"] }
```

**packages/canvas-engine/src/index.ts**

```ts
import { CanvasDocument, Node } from '@paths-design/designer/canvas-schema';

export type Patch = { path: (string|number)[], op: 'set'|'insert'|'remove', value?: any };

export function apply(doc: any, p: Patch): any {
  const clone = structuredClone(doc);
  let target: any = clone; for (let i=0;i<p.path.length-1;i++){ target = target[p.path[i] as any]; }
  const key = p.path[p.path.length-1] as any;
  if (p.op==='set') target[key] = p.value; else if (p.op==='insert') target[key].splice(key,0,p.value); else if (p.op==='remove') target[key].splice(key,1);
  return clone;
}

export function findById(doc: CanvasDocument, id: string): { node: any, parent?: any, index?: number } | null {
  for (const ab of doc.artboards){
    const stack: any[] = [...ab.children.map((n,i)=>({node:n,parent:ab.children,index:i}))];
    while (stack.length){
      const cur = stack.pop()!; if (cur.node.id===id) return cur;
      if (cur.node.children) for (let i=0;i<cur.node.children.length;i++) stack.push({node:cur.node.children[i], parent:cur.node, index:i});
    }
  }
  return null;
}
```

---

### 24.4 packages/canvas-renderer-dom

**packages/canvas-renderer-dom/package.json**

```json
{ "name": "@paths-design/designer/canvas-renderer-dom", "version": "0.1.0", "type": "module", "main": "dist/index.js", "types": "dist/index.d.ts", "scripts": { "build": "tsc -p tsconfig.json", "typecheck": "tsc -p tsconfig.json --noEmit", "lint": "echo noop" }, "devDependencies": { "typescript": "^5.6.2" } }
```

**packages/canvas-renderer-dom/src/index.ts**

```ts
export function draw(ctx: CanvasRenderingContext2D, doc: any){
  ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
  const ab = doc.artboards[0];
  for (const node of ab.children){
    if (node.type==='frame') {
      ctx.fillStyle = '#222';
      ctx.fillRect(node.frame.x, node.frame.y, node.frame.width, node.frame.height);
      for (const ch of (node.children||[])) if (ch.type==='text') {
        ctx.fillStyle = '#e6e6e6';
        const size = ch.textStyle?.size||16;
        ctx.font = `${size}px Inter`;
        ctx.fillText(ch.text, ch.frame.x, ch.frame.y+size);
      }
    }
  }
}
```

---

### 24.5 packages/codegen-react

**packages/codegen-react/package.json**

```json
{ "name": "@paths-design/designer/codegen-react", "version": "0.1.0", "type": "module", "main": "dist/index.js", "types": "dist/index.d.ts", "scripts": { "build": "tsc -p tsconfig.json", "typecheck": "tsc -p tsconfig.json --noEmit", "lint": "echo noop" }, "devDependencies": { "typescript": "^5.6.2" } }
```

**packages/codegen-react/src/index.ts**

```ts
export function generateHero(doc: any){
  const ab = doc.artboards[0];
  const hero = ab.children.find((n:any)=>n.name==='Hero');
  function emit(node:any): string {
    if (node.type==='text') return `<span className={s.text}>${node.text}</span>`;
    if (node.type==='frame') return `<div className={s.frame}>${(node.children||[]).map(emit).join('
')}</div>`;
    return '';
  }
  const jsx = emit(hero);
  const component = `import s from './Hero.module.css';
export default function Hero(){
 return <>${jsx}</>;
}`;
  const css = `.frame{display:flex;gap:24px;padding:32px}
.text{color:var(--color-text)}`;
  return { files: [{ path: 'src/ui/Hero.tsx', content: component }, { path: 'src/ui/Hero.module.css', content: css }] };
}
```

---

### 24.6 packages/tokens

**packages/tokens/package.json**

```json
{ "name": "@paths-design/designer/tokens", "version": "0.1.0", "type": "module", "main": "dist/index.js", "types": "dist/index.d.ts", "scripts": { "build": "tsc -p tsconfig.json", "typecheck": "tsc -p tsconfig.json --noEmit", "lint": "echo noop" }, "devDependencies": { "typescript": "^5.6.2" } }
```

**packages/tokens/src/index.ts**

```ts
import fs from 'node:fs';
export function tokensToCssVars(jsonPath: string): string {
  const t = JSON.parse(fs.readFileSync(jsonPath,'utf8'));
  const res: string[] = [];
  function walk(o:any, p:string[]){ for(const k in o){ const v=o[k]; const np=[...p,k]; if (typeof v==='object') walk(v,np); else res.push(`--${np.join('-')}:${v}`); }}
  walk(t.color,['color']);
  return `:root{${res.join(';')}}`;
}
```

---

### 24.7 apps/cli

**apps/cli/package.json**

```json
{
  "name": "@paths-design/designer/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "designer-generate": "dist/generate.js", "designer-watch": "dist/watch.js" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/generate.ts design/home.canvas.json src/ui",
    "generate": "node dist/generate.js",
    "watch:tokens": "node dist/watch.js"
  },
  "dependencies": {
    "@paths-design/designer/codegen-react": "0.1.0",
    "@paths-design/designer/tokens": "0.1.0",
    "chokidar": "^3.6.0"
  },
  "devDependencies": { "typescript": "^5.6.2", "tsx": "^4.16.2" }
}
```

**apps/cli/tsconfig.json**

```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist" }, "include": ["src"] }
```

**apps/cli/src/generate.ts**

```ts
import fs from 'node:fs';
import { generateHero } from '@paths-design/designer/codegen-react';
const [,, docPath='design/home.canvas.json', outDir='src/ui'] = process.argv;
const doc = JSON.parse(fs.readFileSync(docPath,'utf8'));
const { files } = generateHero(doc);
for (const f of files){
  const p = `${outDir}/${f.path.split('/').slice(-1)[0]}`; // flatten for demo
  fs.writeFileSync(p, f.content);
  console.log('wrote', p);
}
```

**apps/cli/src/watch.ts**

```ts
import fs from 'node:fs';
import chokidar from 'chokidar';
import { tokensToCssVars } from '@paths-design/designer/tokens';
const [,, tokens='design/tokens.json', out='src/ui/tokens.css'] = process.argv;
function run(){ fs.writeFileSync(out, tokensToCssVars(tokens)); console.log('updated', out); }
run();
chokidar.watch(tokens).on('change', run);
```

---

### 24.8 apps/vscode-ext

**apps/vscode-ext/package.json**

```json
{
  "name": "@paths-design/designer/vscode-ext",
  "version": "0.1.0",
  "publisher": "yours",
  "type": "module",
  "main": "./dist/extension.js",
  "engines": { "vscode": "^1.93.0" },
  "activationEvents": ["onCommand:@paths.design/designer.open"],
  "contributes": { "commands": [{ "command": "@paths.design/designer.open", "title": "Open Designer" }] },
  "scripts": {
    "build": "tsc -p tsconfig.json && esbuild src/webview/main.ts --bundle --outfile=media/main.js",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "dev": "node --watch dist/extension.js"
  },
  "devDependencies": {
    "@paths-design/designer/canvas-renderer-dom": "0.1.0",
    "esbuild": "^0.23.0",
    "typescript": "^5.6.2"
  }
}
```

**apps/vscode-ext/tsconfig.json**

```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "outDir": "dist" }, "include": ["src", "media"] }
```

**apps/vscode-ext/src/extension.ts**

```ts
import * as vscode from 'vscode';
import * as fs from 'node:fs';
export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.commands.registerCommand('@paths.design/designer.open', ()=>{
    const panel = vscode.window.createWebviewPanel('@paths.design/designer','Designer',{viewColumn:1},{enableScripts:true, retainContextWhenHidden:true});
    const html = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline' ${panel.webview.cspSource}; script-src ${panel.webview.cspSource};"><style>canvas{border:1px solid #333;background:#111}</style></head><body><button id="load">Load</button><canvas id="c" width="1024" height="640"></canvas><script src="${panel.webview.asWebviewUri(vscode.Uri.joinPath(ctx.extensionUri,'media','main.js'))}"></script></body></html>`;
    panel.webview.html = html;
    panel.webview.onDidReceiveMessage(async msg => {
      if (msg.type==='loadDoc') {
        const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri,'design/home.canvas.json');
        const text = (await vscode.workspace.fs.readFile(uri)).toString();
        panel.webview.postMessage({type:'doc', payload: JSON.parse(text)});
      }
    });
  }));
}
```

**apps/vscode-ext/media/main.ts**

```ts
// Minimal webview script bunded by esbuild
const vscode = (globalThis as any).acquireVsCodeApi?.();
const c = document.getElementById('c') as HTMLCanvasElement;
const ctx = c.getContext('2d')!;
(document.getElementById('load') as HTMLButtonElement).onclick = ()=>vscode?.postMessage({type:'loadDoc'});

window.addEventListener('message', (e)=>{
  const {type, payload} = e.data as any; if (type!=='doc') return;
  draw(payload);
});

function draw(doc:any){
  ctx.clearRect(0,0,c.width,c.height);
  const ab = doc.artboards[0];
  for (const node of ab.children){
    if (node.type==='frame') {
      ctx.fillStyle = '#222';
      ctx.fillRect(node.frame.x, node.frame.y, node.frame.width, node.frame.height);
      for (const ch of (node.children||[])) if (ch.type==='text') {
        ctx.fillStyle = '#e6e6e6';
        const size = ch.textStyle?.size||16;
        ctx.font = `${size}px Inter`;
        ctx.fillText(ch.text, ch.frame.x, ch.frame.y+size);
      }
    }
  }
}
```

---

### 24.9 Quickstart

```bash
pnpm i
pnpm build
# create initial ui folder for demo output
mkdir -p src/ui && echo "" > src/ui/.keep
# generate demo component from the example doc
pnpm generate
# start token watcher (writes src/ui/tokens.css)
pnpm watch:tokens
# in VS Code, run the extension: F5 (Extension Development Host) then Cmd+Shift+P → "Open Designer"
```

**Verification**

* The extension webview loads and renders the Hero frame + Title text using the example doc.
* `pnpm generate` emits `src/ui/Hero.tsx` and `src/ui/Hero.module.css` deterministically.
* Token watcher writes `src/ui/tokens.css` and updates on edits to `design/tokens.json`.
