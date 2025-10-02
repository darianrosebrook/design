# Local "Canvas mode" (Design-in-IDE) — v0.1 Overview

> A minimal, local-only MCP and Extension, open-format design canvas that lives in your repo, renders in a VS Code (or Cursor) Webview via extension and MCP, and round-trips to code via deterministic generation.

## Objectives

* Design artifacts live beside code in the repo (diff-able, review-able).
* Deterministic round-trip: design → code (templates), and code → design (token/prop reflection).
* IDE-native UX: VS Code Webview (v0), Cursor MCP (v0.2), no network required.
* Merge-aware: stable IDs, canonical ordering, structural diff.
* Extensible: schema + adapters (React DOM v0; React Native/Swift/Kotlin later).

## Non-Goals (v0)

* Real-time multi-user CRDT sync (pave path via Y.js but not required).
* Full Figma parity; start with **SVG import** and **basic shapes/text**.
* Arbitrary framework generation; begin with **React + CSS Modules** (clear, readable output).

## Invariants

* Files are human-legible JSON; schema versioned (`schemaVersion`), canonicalized (sorted keys).
* Every node has a **stable ULID**; parenting is explicit; z-order is array order.
* No hidden I/O: the extension may only read/write inside workspace.

## Repo Layout

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

## Roadmap Sketch

* v0.2: Cursor MCP parity; JSON Patch over webview; SVG paste-in.
* v0.3: Y.js CRDT opt-in; visual diff in PR; component instance → prop mapping UI.
* v0.4: Figma plugin (export subset → canvas.json); React Native adapter.
* v1.0: Plugin SDK for custom emitters; a11y & i18n linters; perf profiles.

## Acceptance (v0.1)

* All artifacts are local-only; no network required.
* Codegen of a named frame → React component + CSS Module is reproducible.
* Tokens reflect to CSS vars; doc loads in VS Code webview and renders text/frame.
* Schema validates; formatter keeps diffs minimal.
