# Monorepo Scaffold & Implementation

> Minimal, runnable starter with npm/yarn/pnpm workspaces. Default: **pnpm** recommended.

## Proposed Monorepo Layout (Animator-style)

```
/
├─ packages/
│  ├─ canvas-schema/         # JSON Schema + TS types (zod/ajv exports)
│  ├─ canvas-engine/         # scene graph ops (immutability, hit tests), no UI
│  ├─ canvas-renderer-dom/   # 2D canvas/SVG renderer for VS Code webview
│  ├─ codegen-react/         # deterministic React + CSS-Modules emitters
│  ├─ tokens/                # token parser, CSS-var emitter
│  ├─ diff-visualizer/       # object-level diffs → HTML for PR comments
│  └─ mcp-adapter/           # optional MCP stdio bridge for Cursor
├─ apps/
│  ├─ vscode-ext/            # the webview host; packs renderer + engine
│  └─ cli/                   # designer-generate, designer-watch, designer-diff
├─ .caws/                    # working specs, risk tiers
└─ docs/                     # ADRs, non-functional, test plans
```

## Root files

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

**design/home.canvas.json** (from data-model.md) and **design/tokens.json** (from tokens.md)

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

## packages/canvas-schema

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

## packages/canvas-engine

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

## packages/canvas-renderer-dom

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

## packages/codegen-react

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

## packages/tokens

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

## apps/cli

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

## apps/vscode-ext

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

## Quickstart

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

## Verification

* The extension webview loads and renders the Hero frame + Title text using the example doc.
* `pnpm generate` emits `src/ui/Hero.tsx` and `src/ui/Hero.module.css` deterministically.
* Token watcher writes `src/ui/tokens.css` and updates on edits to `design/tokens.json`.
