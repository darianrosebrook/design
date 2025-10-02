# VS Code Extension & Webview

## VS Code Extension (skeleton)

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

**media/webview/main.js (super-minimal renderer)**

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

## Cursor MCP (optional v0.2)

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

## SVG Import (paste-in)

* Accept SVG string → parse to SVG DOM → convert to `VectorNode` (path data) and `GroupNode`.
* Map `fill`, `stroke`, `strokeWidth` to `Style`; preserve text as `TextNode` where possible.
* Heuristic tokenization: if color matches `tokens.color.*` value, replace literal with token reference in `bind.token`.
