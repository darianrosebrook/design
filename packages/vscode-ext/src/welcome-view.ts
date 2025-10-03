/**
 * @fileoverview Welcome view provider for Designer extension
 * @author @darianrosebrook
 *
 * Provides a welcome screen with shortcuts, tips, and quick actions
 */

import * as vscode from "vscode";

/**
 * Welcome view provider for the Designer extension
 */
export class WelcomeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "designer.welcome";

  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "dist", "webviews"),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const shortcuts = [
      { key: "Ctrl+Shift+C", description: "Create component from selection" },
      { key: "Ctrl+Shift+L", description: "Show component library" },
      { key: "Ctrl+Shift+S", description: "Toggle selection mode" },
      { key: "Ctrl+Shift+N", description: "Create new canvas document" },
      { key: "Ctrl+O", description: "Open canvas document" },
    ];

    const tips = [
      "💡 Use **Ctrl+Shift+N** to quickly create a new canvas document",
      "🎨 Select elements and press **Ctrl+Shift+C** to create reusable components",
      "⚡ Enable performance monitoring in settings to track large document performance",
      "🏆 Complete milestones to unlock achievements and learn new features",
      "📚 Press **Ctrl+Shift+P** then type 'Designer' to see all available commands",
    ];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Designer Welcome</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.5;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h3 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .shortcut {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-list-inactiveSelectionBackground);
        }
        .shortcut:last-child {
            border-bottom: none;
        }
        .key {
            font-family: var(--vscode-editor-font-family);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        .tip {
            padding: 10px;
            background: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            margin: 8px 0;
        }
        .action-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .action-button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="section">
        <h3>🚀 Quick Start</h3>
        <p>Welcome to Designer! Here are some quick actions to get you started:</p>
        <button class="action-button" onclick="vscode.commands.executeCommand('designer.createCanvasDocument')">Create Canvas Document</button>
        <button class="action-button" onclick="vscode.commands.executeCommand('designer.showKeyboardShortcuts')">Show All Shortcuts</button>
        <button class="action-button" onclick="vscode.commands.executeCommand('designer.showPerformanceMetrics')">View Performance</button>
    </div>

    <div class="section">
        <h3>⌨️ Keyboard Shortcuts</h3>
        ${shortcuts
          .map(
            (s) => `
            <div class="shortcut">
                <span>${s.description}</span>
                <span class="key">${s.key}</span>
            </div>
        `
          )
          .join("")}
        <p><em>💡 Tip: Use Cmd+K Cmd+S (macOS) or Ctrl+K Ctrl+S (Windows) to view all VS Code shortcuts</em></p>
    </div>

    <div class="section">
        <h3>💡 Tips & Tricks</h3>
        ${tips.map((tip) => `<div class="tip">${tip}</div>`).join("")}
    </div>

    <div class="section">
        <h3>🏆 Achievements</h3>
        <p>Complete milestones to unlock achievements and learn new features!</p>
        <button class="action-button" onclick="vscode.commands.executeCommand('designer.showKeyboardShortcuts')">View Progress</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
    </script>
</body>
</html>`;
  }
}
