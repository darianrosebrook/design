# MCP/Agent API

API for integrating Designer with external tools, agents, and the Model Context Protocol (MCP).

## 📋 Overview

The MCP/Agent API provides:

- **MCP Server Integration**: Connect Designer to MCP-compatible tools and agents
- **Message Protocol**: Standardized communication between Designer and external systems
- **Tool Registration**: Register custom tools that can be called by agents
- **Agent Communication**: Send and receive messages from external agents
- **Provenance Tracking**: Maintain audit trails for agent operations

## 🚀 Quick Start

```typescript
import { MCPServer } from '@paths-design/mcp-adapter';

// Create MCP server
const server = new MCPServer({
  name: 'Designer Extension',
  version: '1.0.0'
});

// Register a tool
server.registerTool({
  name: 'create-canvas-document',
  description: 'Create a new canvas document',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Document name' },
      template: { type: 'string', description: 'Template to use' }
    },
    required: ['name']
  }
}, async (params) => {
  const doc = createEmptyDocument(params.name);
  return { success: true, documentId: doc.id };
});

// Start server
await server.start();
```

## 🤖 Agent Integration

### Agent Communication
```typescript
import { AgentClient } from '@paths-design/mcp-adapter';

// Connect to external agent
const agent = new AgentClient('http://localhost:3000');

// Send message to agent
const response = await agent.sendMessage({
  type: 'canvas-analysis',
  data: { documentId: 'doc-123' }
});

console.log('Agent response:', response);
```

### Tool Execution
```typescript
// Execute tool through agent
const result = await agent.executeTool('analyze-design', {
  documentId: 'doc-123',
  analysisType: 'usability'
});

if (result.success) {
  console.log('Analysis complete:', result.data);
}
```

## 🔌 MCP Server

### Server Setup
```typescript
import { MCPServer } from '@paths-design/mcp-adapter';

const server = new MCPServer({
  name: 'Designer MCP Server',
  version: '1.0.0',
  capabilities: ['tools', 'resources', 'prompts']
});

// Register server with stdio transport
server.registerTransport('stdio');

// Start server
await server.start();
```

### Tool Registration
```typescript
// Register a simple tool
server.registerTool({
  name: 'get-document-info',
  description: 'Get information about a canvas document',
  inputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string' }
    },
    required: ['documentId']
  }
}, async (params) => {
  const doc = getDocumentById(params.documentId);
  return {
    name: doc.name,
    nodeCount: countNodes(doc),
    lastModified: doc.updatedAt
  };
});
```

### Resource Registration
```typescript
// Register a resource
server.registerResource({
  uri: 'designer://documents',
  name: 'Canvas Documents',
  description: 'List of available canvas documents',
  mimeType: 'application/json'
}, async () => {
  const documents = listAllDocuments();
  return JSON.stringify(documents, null, 2);
});
```

## 📨 Message Protocol

### Message Types
```typescript
interface Message {
  id: string;
  type: 'request' | 'response' | 'notification';
  method: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

### Request/Response Pattern
```typescript
// Send request
const response = await server.sendRequest('get-document', {
  documentId: 'doc-123'
});

// Handle response
if (response.result) {
  console.log('Document:', response.result);
} else {
  console.error('Error:', response.error);
}
```

### Notification Pattern
```typescript
// Send notification (fire and forget)
await server.sendNotification('document-changed', {
  documentId: 'doc-123',
  changes: ['node-added', 'style-updated']
});

// Listen for notifications
server.onNotification('document-changed', (params) => {
  console.log('Document changed:', params);
});
```

## 🛠️ Tool Development

### Tool Interface
```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (params: any) => Promise<any>;
}
```

### Tool Implementation
```typescript
// Create a tool for component analysis
const componentAnalysisTool: Tool = {
  name: 'analyze-components',
  description: 'Analyze components in a canvas document',
  inputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string' },
      componentType: { type: 'string', enum: ['button', 'input', 'card'] }
    },
    required: ['documentId']
  },
  handler: async (params) => {
    const doc = getDocument(params.documentId);
    const components = findComponentsByType(doc, params.componentType);

    return {
      count: components.length,
      components: components.map(c => ({
        id: c.id,
        name: c.name,
        position: c.frame
      }))
    };
  }
};

// Register the tool
server.registerTool(componentAnalysisTool);
```

### Tool Validation
```typescript
// Tools are automatically validated against their schema
server.registerTool(validTool); // ✅ Valid schema
server.registerTool(invalidTool); // ❌ Throws validation error
```

## 🎨 Canvas Integration

### Document Access
```typescript
import { getDocument, updateDocument } from '@paths-design/canvas-schema';

// Get document through MCP
server.registerTool({
  name: 'get-canvas-document',
  description: 'Retrieve a canvas document by ID',
  inputSchema: {
    type: 'object',
    properties: { documentId: { type: 'string' } },
    required: ['documentId']
  }
}, async (params) => {
  const doc = getDocument(params.documentId);
  return doc;
});
```

### Document Modification
```typescript
// Modify document through MCP
server.registerTool({
  name: 'update-canvas-document',
  description: 'Update a canvas document',
  inputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string' },
      changes: { type: 'array' }
    },
    required: ['documentId', 'changes']
  }
}, async (params) => {
  const doc = getDocument(params.documentId);

  // Apply changes
  for (const change of params.changes) {
    applyChange(doc, change);
  }

  // Save document
  await saveDocument(doc);

  return { success: true, documentId: doc.id };
});
```

## 📊 Provenance & Audit

### Operation Tracking
```typescript
// Track operations with provenance
server.registerTool({
  name: 'track-operation',
  description: 'Track an operation with provenance information',
  inputSchema: {
    type: 'object',
    properties: {
      operation: { type: 'string' },
      documentId: { type: 'string' },
      metadata: { type: 'object' }
    },
    required: ['operation', 'documentId']
  }
}, async (params) => {
  const provenance = {
    operation: params.operation,
    documentId: params.documentId,
    timestamp: new Date().toISOString(),
    agent: 'designer-mcp-server',
    metadata: params.metadata
  };

  // Store provenance information
  await storeProvenance(provenance);

  return { provenanceId: generateId() };
});
```

### Audit Trail
```typescript
// Get audit trail for document
server.registerTool({
  name: 'get-audit-trail',
  description: 'Get the audit trail for a document',
  inputSchema: {
    type: 'object',
    properties: { documentId: { type: 'string' } },
    required: ['documentId']
  }
}, async (params) => {
  const trail = await getAuditTrail(params.documentId);
  return { operations: trail };
});
```

## 🔧 Advanced Features

### Custom Transports
```typescript
import { WebSocketTransport } from '@paths-design/mcp-adapter';

// Add WebSocket transport
const wsTransport = new WebSocketTransport('ws://localhost:8080');
server.registerTransport('websocket', wsTransport);

// HTTP transport
const httpTransport = new HTTPTransport('http://localhost:3000/mcp');
server.registerTransport('http', httpTransport);
```

### Middleware
```typescript
// Add middleware for logging
server.use(async (message, next) => {
  console.log('MCP Message:', message.method);
  const result = await next();
  console.log('Response:', result);
  return result;
});

// Add authentication middleware
server.use(async (message, next) => {
  if (message.method !== 'initialize') {
    const auth = await authenticate(message);
    if (!auth) {
      throw new Error('Authentication failed');
    }
  }
  return next();
});
```

### Resource Management
```typescript
// Register dynamic resource
server.registerResource({
  uri: 'designer://performance-metrics',
  name: 'Performance Metrics',
  description: 'Current performance metrics',
  mimeType: 'application/json'
}, async () => {
  const metrics = getPerformanceMetrics();
  return JSON.stringify(metrics, null, 2);
});

// Resource with parameters
server.registerResource({
  uri: 'designer://document/{documentId}/nodes',
  name: 'Document Nodes',
  description: 'Nodes in a specific document',
  mimeType: 'application/json',
  parameters: {
    documentId: { type: 'string', description: 'Document ID' }
  }
}, async (params) => {
  const doc = getDocument(params.documentId);
  return JSON.stringify(doc.artboards, null, 2);
});
```

## 📋 Best Practices

### Tool Development
- **Descriptive names** - Use clear, descriptive tool names
- **Comprehensive schemas** - Define input/output schemas completely
- **Error handling** - Provide meaningful error messages
- **Documentation** - Include examples and usage notes

### Agent Integration
- **Idempotent operations** - Tools should be safe to call multiple times
- **Progress reporting** - Use notifications for long-running operations
- **Resource cleanup** - Clean up temporary resources
- **Error recovery** - Handle and recover from errors gracefully

### Performance
- **Async operations** - Use async/await for I/O operations
- **Resource limits** - Implement appropriate limits and timeouts
- **Memory management** - Clean up resources after operations
- **Monitoring** - Track tool usage and performance

## 🚨 Error Handling

### Tool Errors
```typescript
// Tool with error handling
server.registerTool({
  name: 'risky-operation',
  description: 'An operation that might fail',
  inputSchema: { /* ... */ }
}, async (params) => {
  try {
    const result = await performRiskyOperation(params);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    throw {
      code: -32000,
      message: 'Operation failed',
      data: { originalError: error.message }
    };
  }
});
```

### Agent Communication Errors
```typescript
try {
  const response = await agent.sendMessage(message);
} catch (error) {
  if (error.code === -32000) {
    console.error('Tool execution failed:', error.data);
  } else {
    console.error('Communication error:', error);
  }
}
```

## 📚 Examples

### Complete MCP Server Setup
```typescript
import { MCPServer } from '@paths-design/mcp-adapter';
import { createEmptyDocument, validateDocument } from '@paths-design/canvas-schema';

class DesignerMCPServer {
  private server: MCPServer;

  constructor() {
    this.server = new MCPServer({
      name: 'Designer MCP Server',
      version: '1.0.0'
    });
  }

  async initialize() {
    // Register canvas tools
    this.registerCanvasTools();

    // Register component tools
    this.registerComponentTools();

    // Start server
    await this.server.start();
  }

  private registerCanvasTools() {
    // Document creation
    this.server.registerTool({
      name: 'create-document',
      description: 'Create a new canvas document',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          template: { type: 'string', enum: ['blank', 'hero', 'form'] }
        },
        required: ['name']
      }
    }, async (params) => {
      const doc = createEmptyDocument(params.name);

      // Apply template if specified
      if (params.template !== 'blank') {
        doc = await applyTemplate(doc, params.template);
      }

      return { documentId: doc.id, name: doc.name };
    });

    // Document validation
    this.server.registerTool({
      name: 'validate-document',
      description: 'Validate a canvas document',
      inputSchema: {
        type: 'object',
        properties: { document: { type: 'object' } },
        required: ['document']
      }
    }, async (params) => {
      const validation = validateDocument(params.document);
      return {
        valid: validation.success,
        errors: validation.errors,
        warnings: validation.warnings
      };
    });
  }

  private registerComponentTools() {
    // Component listing
    this.server.registerTool({
      name: 'list-components',
      description: 'List available components',
      inputSchema: {
        type: 'object',
        properties: {
          libraryId: { type: 'string' },
          category: { type: 'string' }
        }
      }
    }, async (params) => {
      const components = await listComponents(params.libraryId, params.category);
      return { components };
    });
  }
}

// Usage
const server = new DesignerMCPServer();
await server.initialize();
```

### Agent Integration Example
```typescript
import { AgentClient } from '@paths-design/mcp-adapter';

class DesignAgent {
  private client: AgentClient;

  constructor() {
    this.client = new AgentClient('http://localhost:3000');
  }

  async analyzeDesign(documentId: string) {
    // Get document info
    const docInfo = await this.client.executeTool('get-document-info', {
      documentId
    });

    // Analyze components
    const components = await this.client.executeTool('analyze-components', {
      documentId,
      componentType: 'button'
    });

    // Generate suggestions
    const suggestions = await this.client.executeTool('generate-suggestions', {
      documentId,
      analysis: { docInfo, components }
    });

    return suggestions;
  }
}
```

## 🎯 API Reference

### MCPServer
- `constructor(config: ServerConfig)` - Create new MCP server
- `registerTool(tool: Tool)` - Register a tool
- `registerResource(resource: Resource)` - Register a resource
- `registerTransport(name: string, transport: Transport)` - Register transport
- `start()` - Start the server
- `stop()` - Stop the server

### AgentClient
- `constructor(endpoint: string)` - Connect to MCP server
- `sendMessage(message: Message)` - Send message to server
- `executeTool(toolName: string, params: any)` - Execute a tool
- `getResources()` - Get available resources

### Message Protocol
- `sendRequest(method: string, params?: any)` - Send request
- `sendNotification(method: string, params?: any)` - Send notification
- `onMessage(handler: (message: Message) => void)` - Listen for messages

### Types
- `ServerConfig` - Server configuration
- `Tool` - Tool definition
- `Resource` - Resource definition
- `Transport` - Transport interface
- `Message` - Message interface

---

*Plugin development complete! → [Back to API Overview](../README.md)*
