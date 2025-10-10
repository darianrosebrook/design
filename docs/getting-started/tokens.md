# Design Tokens & Token Reflection

## Tokens (docs/examples/tokens.json)

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

## Token Reflection (tools/designer-watch.ts, abridged)

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

writeCssVars('docs/examples/tokens.json', 'src/ui/tokens.css');
chokidar.watch('docs/examples/tokens.json').on('change',()=>writeCssVars('docs/examples/tokens.json','src/ui/tokens.css'));
```

## Failure-Mode Cards

* **F-01: Token Drift** — Code renames a token (`color.text`→`color.fg`). *Mitigation*: watcher builds reverse index by value and flags orphaned bindings; suggests rename patch.

## Verification Quick-Checks (A11y/Perf/Type)

* **A11y**: Contrast ≥ 4.5:1 for resolved color pairs; focusable elements in webview have visible outline; respects `prefers-reduced-motion`.
* **Perf**: 10k node doc edits at 60Hz on M1 Air; paint ≤ 4ms median/frame; GC pauses ≤ 10ms p95.
* **Type**: TS strict; schema types generated; no `any` in public APIs.
