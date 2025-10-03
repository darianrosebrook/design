# VS Code Extension API

API for extending the Designer VS Code extension with custom functionality, commands, and integrations.

## 📋 Overview

The VS Code Extension API provides:

- **Command Registration**: Add custom commands to the extension
- **Webview Integration**: Communicate with the canvas webview
- **File Operations**: Work with canvas documents and workspace files
- **Configuration Management**: Access and modify extension settings
- **Message Protocol**: Send and receive messages from the webview

## 🚀 Quick Start

```typescript
import * as vscode from 'vscode';
import { DesignerExtension } from '@paths-design/vscode-ext';

export function activate(context: vscode.ExtensionContext) {
  // Get the extension instance
  const extension = getExtensionInstance();

  // Register a custom command
  const command = vscode.commands.registerCommand(
    'myPlugin.customAction',
    async () => {
      // Plugin logic here
      vscode.window.showInformationMessage('Custom action executed!');
    }
  );

  context.subscriptions.push(command);
}
```

## 🔌 Extension Architecture

### Extension Instance
```typescript
import { getExtensionInstance, DesignerExtension } from '@paths-design/vscode-ext';

// Get the main extension instance
const extension = getExtensionInstance();

// Access current document
const currentDoc = extension.getCurrentDocument();

// Access current selection
const selection = extension.getCurrentSelection();

// Update document (triggers webview refresh)
extension._updateDocument(newDocument);
```

### Message Protocol
```typescript
// Send message to webview
extension.canvasWebviewProvider.postMessage({
  command: 'customAction',
  data: { /* your data */ }
});

// Listen for messages from webview
extension.canvasWebviewProvider.onDidReceiveMessage((message) => {
  switch (message.command) {
    case 'customResponse':
      handleCustomResponse(message.data);
      break;
  }
});
```

## 🎨 Canvas Integration

### Document Operations
```typescript
import { CanvasDocumentType } from '@paths-design/canvas-schema';

// Get current document
const doc = extension.getCurrentDocument();
if (doc) {
  console.log('Current document:', doc.name);
  console.log('Node count:', countNodes(doc));
}

// Update document
const updatedDoc = modifyDocument(doc);
extension._updateDocument(updatedDoc);
```

### Node Selection
```typescript
// Get current selection
const selection = extension.getCurrentSelection();
console.log('Selected nodes:', selection.selectedNodeIds);
console.log('Focused node:', selection.focusedNodeId);

// Listen for selection changes
extension.updateSelection = (newSelection) => {
  console.log('Selection changed:', newSelection);
};
```

### Webview Communication
```typescript
// Send message to canvas webview
await extension.canvasWebviewProvider.postMessage({
  command: 'highlightNodes',
  nodeIds: ['node1', 'node2']
});

// Receive messages from webview
extension.canvasWebviewProvider.onDidReceiveMessage((message) => {
  switch (message.command) {
    case 'nodesHighlighted':
      console.log('Nodes highlighted:', message.nodeIds);
      break;
  }
});
```

## ⚙️ Configuration Management

### Reading Settings
```typescript
import * as vscode from 'vscode';

// Get extension configuration
const config = vscode.workspace.getConfiguration('designer');

// Read specific settings
const autoInit = config.get('webview.autoInitialize', true);
const memoryBudget = config.get('performance.memoryBudgetMB', 100);
const enableAchievements = config.get('achievements.enabled', true);

// Check if performance monitoring is enabled
const enableBudgetMonitoring = config.get('performance.enableBudgetMonitoring', true);
```

### Updating Settings
```typescript
// Update configuration
await config.update(
  'performance.memoryBudgetMB',
  200,
  vscode.ConfigurationTarget.Global
);

// Update workspace-specific setting
await config.update(
  'performance.enableBudgetMonitoring',
  false,
  vscode.ConfigurationTarget.Workspace
);
```

## 📁 File Operations

### Canvas Document Files
```typescript
import * as vscode from 'vscode';

// Read canvas document file
const uri = vscode.Uri.file('/path/to/document.canvas.json');
const content = await vscode.workspace.fs.readFile(uri);
const document = JSON.parse(content.toString());

// Write canvas document file
const updatedContent = JSON.stringify(document, null, 2);
await vscode.workspace.fs.writeFile(uri, Buffer.from(updatedContent, 'utf8'));
```

### Workspace File Operations
```typescript
// Find all canvas files in workspace
const pattern = new vscode.RelativePattern(workspaceFolder, '**/*.canvas.json');
const canvasFiles = await vscode.workspace.findFiles(pattern);

// Create new file in design directory
const designDir = vscode.Uri.joinPath(workspaceFolder.uri, 'design');
const newFile = vscode.Uri.joinPath(designDir, 'new-document.canvas.json');
await vscode.workspace.fs.writeFile(newFile, Buffer.from(jsonContent, 'utf8'));
```

## 🎯 Command Registration

### Basic Commands
```typescript
import * as vscode from 'vscode';

// Register a simple command
const simpleCommand = vscode.commands.registerCommand(
  'myPlugin.helloWorld',
  () => {
    vscode.window.showInformationMessage('Hello from my plugin!');
  }
);

// Register command with arguments
const commandWithArgs = vscode.commands.registerCommand(
  'myPlugin.processNodes',
  async (nodeIds: string[]) => {
    vscode.window.showInformationMessage(`Processing ${nodeIds.length} nodes`);
    // Process the nodes...
  }
);

// Register to command palette
context.subscriptions.push(simpleCommand, commandWithArgs);
```

### Context-Aware Commands
```typescript
// Command only available when canvas is active
const canvasCommand = vscode.commands.registerCommand(
  'myPlugin.canvasAction',
  async () => {
    const selection = extension.getCurrentSelection();
    if (selection.selectedNodeIds.length === 0) {
      vscode.window.showWarningMessage('No nodes selected');
      return;
    }

    // Process selected nodes
    await processSelectedNodes(selection.selectedNodeIds);
  }
);

// Command only available for canvas files
const fileCommand = vscode.commands.registerCommand(
  'myPlugin.fileAction',
  async (uri: vscode.Uri) => {
    if (!uri.fsPath.endsWith('.canvas.json')) {
      return;
    }

    // Process canvas file
    await processCanvasFile(uri);
  }
);
```

## 🔄 Webview Integration

### Message Protocol
```typescript
// Send message to webview
await extension.canvasWebviewProvider.postMessage({
  command: 'customCommand',
  payload: {
    action: 'highlight',
    nodeIds: ['node1', 'node2']
  }
});

// Handle responses from webview
extension.canvasWebviewProvider.onDidReceiveMessage((message) => {
  switch (message.command) {
    case 'highlightComplete':
      console.log('Highlight completed:', message.result);
      break;

    case 'error':
      console.error('Webview error:', message.error);
      break;
  }
});
```

### Webview State Management
```typescript
// Check if webview is ready
if (extension.canvasWebviewProvider.isReady()) {
  // Send message to webview
  await extension.canvasWebviewProvider.postMessage({
    command: 'setSelection',
    selection: currentSelection
  });
}

// Listen for webview state changes
extension.canvasWebviewProvider.onReady(() => {
  console.log('Webview is ready');
});
```

## 📊 Performance Integration

### Performance Monitoring
```typescript
import { PerformanceMonitor } from '@paths-design/canvas-schema';

const monitor = PerformanceMonitor.getInstance();

// Monitor plugin operations
monitor.startOperation('my-plugin-operation');

// Plugin logic here
const result = await performPluginOperation();

// End monitoring
const duration = monitor.endOperation('my-plugin-operation');
console.log(`Plugin operation took ${duration}ms`);

// Check performance budgets
if (monitor.exceedsMemoryBudget(estimatedMemory)) {
  vscode.window.showWarningMessage('Plugin operation exceeds memory budget');
}
```

### Document Performance
```typescript
import { checkDocumentPerformance } from '@paths-design/canvas-schema';

// Check current document performance
const doc = extension.getCurrentDocument();
if (doc) {
  const performance = checkDocumentPerformance(doc);

  if (!performance.withinBudget) {
    vscode.window.showWarningMessage(
      `Document performance issues: ${performance.warnings.join(', ')}`
    );
  }
}
```

## 🧩 Component Integration

### Component Library Access
```typescript
// Access component library functionality
import { createComponentLibrary, validateComponentLibrary } from '@paths-design/canvas-schema';

// Create new component library
const library = createComponentLibrary('My Components');

// Validate component library
const validation = validateComponentLibrary(library);
if (validation.success) {
  console.log('Library is valid');
}
```

### Component Operations
```typescript
import { createComponentFromNode, createComponentInstance } from '@paths-design/canvas-schema';

// Create component from current selection
const selection = extension.getCurrentSelection();
if (selection.selectedNodeIds.length > 0) {
  const node = extension._findNodeById(extension.getCurrentDocument(), selection.selectedNodeIds[0]);
  if (node) {
    const component = createComponentFromNode(node, 'My Component');
    console.log('Component created:', component.name);
  }
}
```

## 🎨 Canvas Operations

### Node Manipulation
```typescript
// Get current document and modify it
const doc = extension.getCurrentDocument();
if (doc) {
  // Find and modify a node
  const node = findNodeById(doc, 'target-node-id');
  if (node && node.type === 'text') {
    const updatedNode = {
      ...node,
      text: 'Updated text content'
    };

    // Update the document
    const updatedDoc = updateNodeInDocument(doc, node.id, updatedNode);
    extension._updateDocument(updatedDoc);
  }
}
```

### Document State Management
```typescript
// Listen for document changes
const originalUpdateDocument = extension._updateDocument;
extension._updateDocument = (newDocument) => {
  console.log('Document being updated:', newDocument.name);

  // Perform additional processing
  const processedDocument = enhanceDocument(newDocument);

  // Call original method
  originalUpdateDocument.call(extension, processedDocument);
};
```

## 📋 Best Practices

### Extension Development
- **Use TypeScript** for type safety and better development experience
- **Follow VS Code patterns** for command registration and webview communication
- **Handle errors gracefully** with user-friendly messages
- **Monitor performance** especially for operations that affect the canvas

### Canvas Integration
- **Preserve node IDs** when possible for stability
- **Validate documents** before making changes
- **Use semantic keys** for component identification
- **Handle webview state** properly (ready/not ready)

### Performance Considerations
- **Monitor operation timing** for slow operations
- **Check memory budgets** before large operations
- **Use progressive operations** for complex document processing
- **Provide user feedback** for long-running operations

## 🚨 Error Handling

### Webview Communication Errors
```typescript
try {
  await extension.canvasWebviewProvider.postMessage({
    command: 'customAction',
    data: payload
  });
} catch (error) {
  console.error('Failed to send message to webview:', error);
  vscode.window.showErrorMessage('Failed to communicate with canvas');
}
```

### File Operation Errors
```typescript
try {
  await vscode.workspace.fs.writeFile(uri, content);
} catch (error) {
  if (error.message.includes('EPERM')) {
    vscode.window.showErrorMessage('Permission denied. Check file permissions.');
  } else if (error.message.includes('ENOSPC')) {
    vscode.window.showErrorMessage('Insufficient disk space.');
  } else {
    vscode.window.showErrorMessage(`File operation failed: ${error.message}`);
  }
}
```

### Document Validation Errors
```typescript
const validation = validateDocument(document);
if (!validation.success) {
  const errorMessage = validation.errors?.join(', ') || 'Unknown validation error';
  vscode.window.showErrorMessage(`Document validation failed: ${errorMessage}`);
  return;
}
```

## 📚 Examples

### Complete Plugin Example
```typescript
import * as vscode from 'vscode';
import { getExtensionInstance } from '@paths-design/vscode-ext';
import { validateDocument } from '@paths-design/canvas-schema';

export function activate(context: vscode.ExtensionContext) {
  const extension = getExtensionInstance();

  // Register command to analyze current document
  const analyzeCommand = vscode.commands.registerCommand(
    'myPlugin.analyzeDocument',
    async () => {
      const doc = extension.getCurrentDocument();
      if (!doc) {
        vscode.window.showWarningMessage('No active document');
        return;
      }

      // Validate document
      const validation = validateDocument(doc);
      if (!validation.success) {
        vscode.window.showErrorMessage('Document is invalid');
        return;
      }

      // Analyze document
      const analysis = analyzeDocumentStructure(doc);

      // Show results
      const panel = vscode.window.createWebviewPanel(
        'analysisResults',
        'Document Analysis',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );

      panel.webview.html = generateAnalysisHtml(analysis);
    }
  );

  context.subscriptions.push(analyzeCommand);
}

function analyzeDocumentStructure(doc) {
  // Analysis logic here
  return {
    nodeCount: countNodes(doc),
    artboardCount: doc.artboards.length,
    componentCount: countComponents(doc)
  };
}

function countNodes(doc) {
  let count = 0;
  doc.artboards.forEach(artboard => {
    count += countNodesInTree(artboard.children || []);
  });
  return count;
}

function countNodesInTree(nodes) {
  let count = nodes.length;
  nodes.forEach(node => {
    if (node.children) {
      count += countNodesInTree(node.children);
    }
  });
  return count;
}
```

## 🎯 API Reference

### Extension Instance
- `getExtensionInstance(): DesignerExtension` - Get main extension instance
- `getCurrentDocument(): CanvasDocument | null` - Get current canvas document
- `getCurrentSelection(): SelectionState` - Get current node selection

### Canvas Webview Provider
- `postMessage(message: any): Promise<void>` - Send message to webview
- `onDidReceiveMessage(handler: (message: any) => void): void` - Listen for webview messages
- `isReady(): boolean` - Check if webview is ready
- `show(uri?: Uri): Promise<void>` - Show/open canvas webview

### Document Operations
- `_updateDocument(document: CanvasDocument): void` - Update current document
- `_findNodeById(document: CanvasDocument, nodeId: string): Node | null` - Find node by ID

### Configuration
- `vscode.workspace.getConfiguration('designer')` - Get extension configuration
- `config.get(key, default)` - Read configuration value
- `config.update(key, value, target)` - Update configuration value

---

*Extension development? → [Component System API](./components.md)*
