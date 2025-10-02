# React-in-the-Canvas (Design-time Components → Code)

**Claim**: Yes. We can run real React components *inside* the editor webview, edit their props/slots visually, and deterministically emit React code.

## Operating Modes

* **Preview Mode (Runtime)**: Load a component bundle into the webview and render it with React DOM. Users manipulate props, slots, and tokens via an inspector. No side-effects allowed.
* **Canvas Mode (Static)**: Components are *represented* as `ComponentInstanceNode` in the document. The preview uses runtime rendering; persistence uses the static JSON graph.

## Architecture (Layers)

1. **Loader/Sandbox**

   * Bundle user components with `esbuild` (web-worker) using an **in-memory FS** + **import map**.
   * Enforce a **design-time runtime**: forbid `fetch`, timers, and DOM globals; shim with mocks.
   * Only allow imports from an allowlist (`react`, `@design/tokens`, `@ui/*`).
2. **Host Renderer**

   * Use React DOM inside the webview. Option A: standard DOM render. Option B (later): a **custom reconciler** for our scene graph (keeps preview and document perfectly aligned).
3. **Inspector/Bridge**

   * Extract component metadata from TypeScript (react-docgen-typescript or TSC) → **Prop schema** (name, type, default, required).
   * Map **slots** via a convention (e.g., `children`, `slot.*` props) and expose slot drop targets on canvas.
   * Prop edits emit **JSON Patch** to `ComponentInstanceNode.props`; rerender preview.
4. **Serializer/Codegen**

   * Persist `ComponentInstanceNode` with `{ componentKey, props, children[] }`.
   * Deterministic emitter turns a subtree into JSX + CSS Modules (or returns `<Component {...props}>…</Component>` if mapped to a real component file).

## Component Contract (minimal)

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

**Discovery**: a build-time step produces `design/components.index.json`:

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

## Determinism & Safety

* **No effects**: ban `useEffect` with external I/O in preview; allow `useLayoutEffect` for layout only. Lint rule: `design-preview/no-side-effects`.
* **Pure inputs**: preview renders from `{props,tokens}` only. Randomness requires a seeded RNG.
* **Style isolation**: preview uses Shadow DOM root; codegen targets CSS Modules.
* **A11y guards**: inspector exposes aria props; quick-check runs against the composed preview DOM.

## Codegen Strategies

* **Direct Instance Emit** (recommended): `ComponentInstanceNode(Button, props, children)` → JSX import + instantiation. Stable import specifier from component index.
* **Decomposition Emit** (fallback): For primitives, emit `<div/span/svg>` with styles derived from tokens.
* **Slot Mapping**: nested `ComponentInstanceNode` becomes children/slot props in emitted JSX.

## Example Round-Trip

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

## Acceptance (React Preview)

* Can render a library of 10 demo components in the webview sandbox without network or side effects.
* Prop edits produce JSON Patch; re-render in ≤ 16ms median.
* Same doc + tokens → identical emitted JSX bytes across machines.
* A11y quick-check passes for sample library (focus ring visible, contrast ≥ 4.5:1).

## Crosswalk: Reusing Your *Animator* Architecture

> Map the After-Effects-style project (Animator) to this Design-in-IDE tool. What carries over as-is, what adapts, what to avoid.

### What Transfers Almost 1:1

* **CAWS/AGENTS discipline**: Keep `.caws/working-spec.yaml`, risk tiering, provenance, and CI gates; reuse *exactly*.
* **Repo governance & docs**: `docs/…` structure, impact maps, non-functional specs, and test plans → same shape.
* **Property-based testing**: `fast-check` style tests for schema invariants (stable ULIDs, canonical order, idempotent codegen).
* **CRDT substrate (Yjs/Automerge)**: Optional module for multi-user editing and conflict-free merges; plug into webview state.
* **Open formats & CAS thinking**: Keep diff-able, human-legible JSON; optional CAS index for large assets.

### What Adapts with Thin Wrappers

* **Scene Graph** → **Canvas Graph**: Drop time dimension in v0; retain nodes, transforms, styles. Preserve stable IDs and structural sharing.
* **Timeline System** → **Design History**: Use timeline infra to power undo/redo stacks and PR visual diffs (not keyframing yet).
* **Effects/Shader pipeline** → **Canvas Renderer**: Replace WGSL/WebGPU with 2D canvas/SVG now; keep an adapter boundary so a WebGPU renderer can slot in later for complex vector ops.
* **Contracts/OpenAPI** → **Schema Contracts**: Swap HTTP OpenAPI for JSON-Schema contracts (already included) + codegen contracts (component emitters).
* **Sandboxed expressions** → **Safe templates**: Constrain codegen templates (no eval; deterministic output; lint before write).

### What to Avoid (for now)

* **Full GPU compositor**: Overkill for v0; webview Canvas/SVG is enough and keeps the extension light.
* **Global real-time**: Keep sync local-first; multi-player behind a feature flag. Avoid auth/infra until editor proves valuable.

## Engineering Challenges → Borrowed Solutions

| Challenge            | Borrow from *Animator*                | Concrete Tactic                                                          |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| Deterministic output | Deterministic GPU pipeline discipline | Freeze RNG; forbid timestamps; snapshot codegen; schema canonicalizer    |
| Merge conflicts      | CRDT mental model                     | Stable IDs; object-level 3-way merge; optional Yjs branch reconciliation |
| Performance          | Dirty tracking/structural sharing     | Persistent data structures for node edits; batched patches to webview    |
| Testability          | Property-based testing                | fast-check generators over Node/Style; fuzz importers (SVG → VectorNode) |
| A11y from day one    | A11y NFRs                             | Contrast check in CI; keyboard nav in webview; reduced-motion flags      |
| Security             | Sandboxed expressions                 | No eval; template whitelist; path allow-list within workspace            |
