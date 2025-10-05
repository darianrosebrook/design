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
* Modern design tool capabilities; start with **SVG import** and **basic shapes/text**.
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
* v0.4: External tool export (export subset → canvas.json); React Native adapter.
* v1.0: Plugin SDK for custom emitters; a11y & i18n linters; perf profiles.

## Acceptance (v0.1)

* All artifacts are local-only; no network required.
* Codegen of a named frame → React component + CSS Module is reproducible.
* Tokens reflect to CSS vars; doc loads in VS Code webview and renders text/frame.
* Schema validates; formatter keeps diffs minimal.

## Usage

### Creating Canvas Documents

Create a new canvas document with the `Designer: New Canvas Document` command from the command palette, or right-click in the explorer and select "New Canvas Document".

This creates a canonical `.canvas.json` file with:
- Schema version 0.1.0
- Unique ULID identifiers
- One artboard with default dimensions (1440×1024)
- Empty children array ready for design

### Opening Canvas Documents

When you open a `.canvas.json` file, you'll see a quick-pick menu:
- **Open in Canvas Designer**: Launches the visual editor in a webview
- **View JSON**: Opens the raw JSON for manual editing

The visual editor automatically initializes empty or invalid documents if `designer.webview.autoInitialize` is enabled (default: true).

### Commands

**Canvas Management:**
- `designer.createCanvasDocument` - Create a new canvas document
- `designer.openCanvas` - Open canvas in visual editor with document browser
- `designer.viewCanvasSource` - View/edit the JSON source

**Component Library:**
- `designer.createComponentLibrary` - Create a new component library
- `designer.createComponentFromSelection` - Convert selected elements to reusable components
- `designer.showComponentLibrary` - Browse and manage component libraries

**Performance & Monitoring:**
- `designer.showPerformanceMetrics` - View performance statistics and budgets
- `designer.togglePerformanceBudget` - Enable/disable performance monitoring

**Discovery & Help:**
- `designer.showKeyboardShortcuts` - View all keyboard shortcuts and tips
- `designer.openPropertiesPanel` - Show properties panel
- `designer.toggleSelectionMode` - Cycle selection modes (single/rectangle/lasso)

*💡 Commands are discoverable via the Command Palette (Ctrl+Shift+P) by typing "Designer"*

### Configuration

```json
{
  "designer.webview.autoInitialize": true,
  "designer.selectionModes.enabled": true,
  "designer.selectionModes.default": "single",
  "designer.accessibility.announceSelectionChanges": true,
  "designer.performance.enableBudgetMonitoring": true,
  "designer.performance.memoryBudgetMB": 100,
  "designer.performance.maxNodesPerDocument": 10000,
  "designer.achievements.enabled": true,
  "designer.shortcuts.showOnStartup": true
}
```

### Performance & Memory Management

The extension includes built-in performance monitoring that tracks:
- **Document Load Times**: Monitors canvas document loading performance
- **Memory Usage**: Estimates memory consumption for large documents
- **Node Count Limits**: Warns when documents exceed recommended limits
- **Budget Monitoring**: Configurable limits for memory and operation timeouts

Performance warnings appear as VS Code notifications when documents exceed budgets, helping maintain responsive editing experiences.

### Achievement System

Complete milestones to unlock achievements and discover new features:
- **🎨 First Canvas Created** - Welcome to Designer!
- **🏗️ Canvas Veteran** - Created 10+ canvas documents
- **🧩 Component Creator** - Created your first reusable component
- **🏆 Component Master** - Created 5+ components
- **⚡ Performance Aware** - Configured performance monitoring

Achievements appear as notifications and can be viewed in the Welcome panel.

## Security & UX Improvements (Implemented)

✅ **Path Traversal Protection**: Filename input now sanitizes dangerous path components (`../`, `/`, `\`) and restricts file creation to workspace boundaries only.

✅ **File Overwrite Protection**: Existing files prompt for confirmation before overwrite, preventing accidental data loss.

✅ **Improved Post-Creation Flow**: New documents now default to opening in the visual designer with option to view JSON.

✅ **Document Discovery**: "Open Canvas Document" command now shows a searchable list of existing `.canvas.json` files in the workspace.

✅ **File Organization Guidance**: Filename prompts suggest using `design/` folder structure following project conventions.

✅ **Error Handling & Recovery**: Comprehensive error handling with cleanup for partial writes and user-friendly error messages for permission/disk space issues.
