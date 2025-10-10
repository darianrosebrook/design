# Code Generation & Component Mapping

## Mapping Spec (design/mappings.react.json)

> Declarative mapping from node kinds → React emitters. Keep it inspectable and unit-testable.

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

## Codegen CLI (tools/designer-generate.ts, abridged)

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

## Determinism rules

* Sort children by array index; stable ULIDs; stringify with fixed spacing; no Date.now().

## Minimal Workflow (end-to-end)

1. Edit `design/home.canvas.json` with the webview (drag text, edit styles).
2. Save → schema validated, canonicalized.
3. Run `ts-node tools/designer-generate.ts design/home.canvas.json src/ui`.
4. Import `src/ui/Hero.tsx` in app, include `src/ui/tokens.css`.
5. Change `docs/examples/tokens.json` → watcher updates CSS vars → live style change.

## Tests & CI Gates

* **Schema validation** with `ajv` on every save.
* **Determinism**: snapshot tests on codegen outputs; same input → identical bytes.
* **Token reflection** test: tokens → CSS vars mapping round-trips literal values.
* **Accessibility quick-checks**: text color vs background contrast ≥ 4.5:1 if both resolve to hex.

## Failure-Mode Cards

* **F-03: Non-deterministic Generation** — Timestamps/IDs leak into output. *Mitigation*: forbid Date/Math.random in codegen; provide seeded RNG if needed.
