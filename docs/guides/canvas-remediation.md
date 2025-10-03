# Designer Canvas Remediation Guide

## Context
The current VS Code integration renders only the placeholder properties webview while leaving the actual design surface unhosted. Core canvas packages (`canvas-engine`, `canvas-renderer-dom`, `properties-panel`, `mcp-adapter`) are present but wired together minimally, which blocks the Figma-like workflow shown in `examples/Screenshot 2025-10-01 at 10.22.32 AM.png`. This guide documents the work needed to deliver a performant, deterministic, and agent-friendly canvas experience inside VS Code/Cursor.

Each section below covers: objective, concrete steps, pitfalls, and code references or pseudocode for implementation.

## CAWS Specification Map
- Canvas Webview Host & Inspector: `.caws/specs/DESIGNER-016-canvas-webview-host.yaml` (Tier 2)
- Properties Panel React Integration: `.caws/specs/DESIGNER-013-properties-panel.yaml` (Tier 2)
- Deterministic Document Pipeline & Persistence: `.caws/specs/DESIGNER-017-document-mutation-pipeline.yaml` (Tier 1)
- Renderer Coordinate & Interaction Layer: `.caws/specs/DESIGNER-018-renderer-interaction-layer.yaml` (Tier 2)
- MCP Bridge for Agent Workflows: `.caws/specs/DESIGNER-020-mcp-integration.yaml` (Tier 2)

---

## 1. Build a Unified Canvas Webview Host
**Objective**: Host the visual canvas and inspector inside one bundled webview (or coordinated pair) so selection, editing, and rendering stay in sync.

### Steps
- Add a dedicated view/command (e.g. `designer.canvas`) in `packages/vscode-ext/package.json` alongside the existing properties view (`packages/vscode-ext/package.json:33`).
- Introduce a bundling pipeline (Vite or esbuild) that outputs a single webview entry file, consuming `@paths-design/canvas-renderer-dom` and the React inspector. Store source in `packages/vscode-ext/webviews/canvas/`.
- In `packages/vscode-ext/src/index.ts`, register a `CanvasWebviewProvider` that mirrors the current `PropertiesPanelWebviewProvider` but loads the new bundle, not ad-hoc HTML (`packages/vscode-ext/src/index.ts:147`).
- Establish a typed message channel (`postMessage`) for selection, mutations, and telemetry between the extension host and the canvas webview. Reuse existing Zod schemas in `packages/vscode-ext/src/protocol` for validation.

### Pitfalls
- Webviews run in a browser sandbox: avoid `process` references and Node-only APIs without polyfills.
- Keep memory isolated per document; tear down listeners on webview disposal to prevent leaks.
- Budget rendering work to 16 ms slices—batch updates using `requestAnimationFrame` (already implemented in renderer).

### Pseudocode
```ts
// packages/vscode-ext/src/canvas-webview.ts
const renderer = createCanvasRenderer({
  classPrefix: "designer-",
  onSelectionChange: (ids) => vscode.postMessage({ type: "selection", ids }),
  onNodeUpdate: (id, patch) => applyLocalPatch(id, patch),
});

window.addEventListener("message", (event) => {
  switch (event.data.type) {
    case "loadDocument": {
      renderer.render(event.data.document, canvasRoot);
      break;
    }
    case "applyPatch": {
      renderer.updateNodes(event.data.nodeIds, event.data.updates);
      break;
    }
  }
});
```

---

## 2. Reuse the Properties Panel React Package
**Objective**: Replace the handcrafted DOM panel with the tested `@paths-design/properties-panel` React component so semantic keys, contracts, and component metadata flow through.

### Steps
- In the new webview bundle, mount a React root that renders both the canvas and `<PropertiesPanel />` (see `packages/properties-panel/src/PropertiesPanel.tsx:17`).
- Use `PropertiesService` hooks (`packages/properties-panel/src/use-properties.ts:19`) to consume selection and node updates passed from the renderer via context or message bus.
- Feed the actual component index (`componentIndex?.components`) from the extension host when available to unlock contract-driven editing.

### Pitfalls
- The panel expects `selectedNodeIds` plus node objects; populate `PropertiesService.setNodes` through the extension when documents load.
- Namespace panel styles to avoid clashing with VS Code defaults; either scope via CSS modules or wrap in a shadow root.
- Ensure SSR-friendly bundling (no direct `document` access during module init) to keep tests running under Vitest/JSDOM.

### Pseudocode
```tsx
// packages/vscode-ext/webviews/canvas/App.tsx
export function App() {
  const { document, selection, dispatch } = useDesignerState();

  useEffect(() => {
    PropertiesService.getInstance().setNodes(flattenNodes(document));
    PropertiesService.getInstance().setSelection(selection);
  }, [document, selection]);

  return (
    <Layout>
      <CanvasSurface onSelectionChange={dispatch.selection} />
      <PropertiesPanel
        selection={selection}
        onPropertyChange={(event) => dispatch.propertyChange(event)}
      />
    </Layout>
  );
}
```

---

## 3. Deterministic Document Mutation Pipeline
**Objective**: Apply edits through `canvas-engine` operations to maintain deterministic output, stable ULIDs, and canonical JSON.

### Steps
- In the extension host, replace `_applyPropertyChangeToDocument` (`packages/vscode-ext/src/properties-panel-webview.ts:92`) with calls to `canvas-engine` operations (`packages/canvas-engine/src/operations.ts:23`).
- Introduce a `DocumentStore` that tracks the current `CanvasDocumentType`, applies patches, validates with `validateCanvasDocument` (`packages/canvas-engine/src/index.ts:19`), and broadcasts diffs back to webviews.
- Maintain undo/redo stacks using the existing patch metadata (`DocumentPatch`, `JsonPatch` types in `packages/canvas-engine/src/types.ts`).

### Pitfalls
- Do not mutate nodes in place; always treat documents as immutable and create new references.
- Regenerate IDs only via `generateNodeId` when creating new nodes (`packages/canvas-engine/src/operations.ts:69`).
- Re-run canonicalization before persisting (see `packages/canvas-schema/src/canonical.ts`).

### Pseudocode
```ts
// packages/vscode-ext/src/document-store.ts
export function applyPropertyChange(event: PropertyChangeEvent) {
  const result = setNodeProperty(currentDocument, event); // delegates to engine
  if (!result.success) throw new Error(result.error);

  const canonical = canonicalizeDocument(result.document);
  validateCanvasDocument(canonical);

  currentDocument = canonical;
  notifyWebviews({ type: "documentUpdated", document: canonical });
}
```

---

## 4. Persist Documents to the Correct Files
**Objective**: Save changes back to the source `.canvas.json` rather than fabricating `${document.id}.canvas.json` files.

### Steps
- Track the originating URI when loading a document (update `loadDocument` in `packages/vscode-ext/src/index.ts:190`). Store the mapping in the `DocumentStore`.
- Replace `_saveDocument` (`packages/vscode-ext/src/properties-panel-webview.ts:185`) with logic that writes to the recorded URI using `vscode.workspace.fs.writeFile`.
- Run canonical serialization (`canonicalizeDocument`) and ensure newline-at-EOF before writing.

### Pitfalls
- Handle multi-root workspaces: keep per-workspace mappings and resolve relative paths via `workspace.asRelativePath`.
- Debounce disk writes to avoid thrashing when MCP agents emit rapid edits; consider a transactional save queue.
- Watch for external edits via `FileSystemWatcher` and prompt for reload conflicts.

### Pseudocode
```ts
const documentPaths = new Map<string, vscode.Uri>(); // docId -> file URI

async function saveDocument(doc: CanvasDocumentType) {
  const fileUri = documentPaths.get(doc.id);
  if (!fileUri) throw new Error(`Unknown origin for document ${doc.id}`);

  const serialized = canonicalizeDocument(doc);
  await vscode.workspace.fs.writeFile(fileUri, Buffer.from(serialized, "utf8"));
}
```

---

## 5. Fix Renderer Coordinate System & Interaction Layer
**Objective**: Correct HiDPI handling, selection overlays, and prepare for pan/zoom & multi-selection.

### Steps
- Stop double-scaling: retain the container at 100 % size while storing `pixelRatio` for rendering math (`packages/canvas-renderer-dom/src/renderer.ts:116`). Apply pixel ratio inside `applyNodePositioning` only for actual draw surfaces, not DOM positioning.
- Replace `getBoundingClientRect()` diffs in `updateNodeElement` (`packages/canvas-renderer-dom/src/renderer.ts:452`) with document-space frames supplied in the update payload.
- Add zoom/pan state on the renderer and incorporate it into selection overlays (`packages/canvas-renderer-dom/src/renderer.ts:520`).
- Extend hit-testing utilities (`packages/canvas-engine/src/hit-testing.ts:20`) to account for transforms when computing selection rectangles.

### Pitfalls
- Keep selection overlays in the same transformed coordinate system as nodes; recompute on `scroll` and `resize` events.
- When zooming, avoid CSS transforms that break pointer events; instead, adjust a dedicated container (`transform: scale`) and recompute hit testing based on inverse transforms.
- Ensure keyboard navigation (arrow keys, focus management) still works after restructuring (see `handleArrowNavigation` in `renderer.ts`).

### Pseudocode
```ts
function applyNodePositioning(element: HTMLElement, node: NodeType) {
  const { x, y, width, height } = node.frame;
  element.style.transform = `translate(${x}px, ${y}px)`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
}

function updateSelectionOverlay() {
  const zoom = this.viewport.zoom;
  outline.style.transform = `translate(${rect.left * zoom}px, ${rect.top * zoom}px)`;
}
```

---

## 6. Integrate MCP Server for Agent Workflows
**Objective**: Allow embedded agents (VS Code, Cursor, Windsurf) to query and mutate the design graph through the existing MCP server.

### Steps
- Ship the `@paths-design/mcp-adapter` entry (`packages/mcp-adapter/src/mcp-server.ts`) with the extension and spawn it as a child process when the webview requests agent features.
- Define a VS Code command (e.g. `designer.startMcpBridge`) that opens a `MessageChannel` to the webview and forwards requests/responses to the MCP server via stdio.
- Surface MCP tool capabilities (load, generate, update nodes) in the UI and provide agent-authored edits back into `DocumentStore.applyPatch`.
- Implement visual feedback (loading shimmer) when MCP operations apply asynchronous mutations; broadcast state to renderer for skeleton overlays.

### Pitfalls
- Keep the MCP server optional; guard spawn with feature flags and kill the process on extension deactivate.
- Sanitize file paths passed into MCP tools—restrict access to workspace roots (`packages/vscode-ext/src/security/resource-limits.ts:113`).
- Prevent concurrent edits from clobbering each other: queue MCP mutations and revalidate after every apply.

### Pseudocode
```ts
// Extension host bridge
const mcp = spawn(mcpBinary, [], { stdio: ["pipe", "pipe", "pipe"] });

webview.onDidReceiveMessage(async (msg) => {
  if (msg.type === "mcpCall") {
    const response = await callMcpTool(mcp, msg.payload);
    webview.postMessage({ type: "mcpResult", response });
  }
});
```

---

## 7. Strengthen Testing & Observability
**Objective**: Protect determinism and user experience with automated checks and telemetry.

### Steps
- Add integration tests in `packages/canvas-renderer-dom/tests` that render golden frames and compare serialized DOM snapshots per viewport scale.
- Extend property-based tests in `packages/canvas-engine/tests` to cover round-tripping updates and MCP-generated nodes.
- Create VS Code extension end-to-end tests (Playwright or `@vscode/test-electron`) that open `.canvas.json`, edit a node, and verify on-disk changes.
- Emit renderer metrics (`renderer_frame_duration_ms`, `renderer_dirty_nodes_total`) to the extension console and expose them in a devtools overlay for manual profiling.

### Pitfalls
- Keep golden snapshots canonical: run `canonicalizeDocument` before serializing test fixtures to avoid false positives.
- Mock `window.devicePixelRatio` in tests to assert HiDPI behavior deterministically.
- Avoid flaky MPC tests by faking stdio responses with fixtures when running in CI.

### Pseudocode
```ts
// packages/canvas-renderer-dom/tests/golden.test.ts
it("renders rover dashboard frame deterministically", () => {
  const doc = loadGolden("tests/golden/rover.canvas.json");
  const renderer = createCanvasRenderer({ interactive: false });
  renderer.render(doc, container);

  expect(container.innerHTML).toMatchSnapshot();
});
```

---

## Delivery Sequencing
1. Ship bundled canvas webview host plus React properties panel integration; confirm persistence mapping and CSP compliance.
2. Land deterministic mutation pipeline through `canvas-engine`, including canonical persistence and undo/redo stabilization.
3. Correct renderer coordinate mathematics, implement pan/zoom, and align selection overlays with viewport transforms.
4. Wire MCP bridge with feature flag, asynchronous feedback, and conflict-safe mutation queueing.
5. Expand testing, property coverage, and observability to protect determinism and performance regressions.

Shipping these milestones aligns the Designer IDE experience with Figma-class expectations while preserving determinism, git friendliness, and agent interoperability.
