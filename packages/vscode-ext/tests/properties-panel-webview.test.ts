/**
 * @fileoverview Properties Panel Webview Provider Tests
 * @author @darianrosebrook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as vscode from "vscode";
import { PropertiesPanelWebviewProvider } from "../src/properties-panel-webview";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import type {
  SelectionState,
  PropertyChangeEvent,
} from "@paths-design/properties-panel";

// Mock VS Code APIs
vi.mock("vscode", () => ({
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    registerWebviewViewProvider: vi.fn(),
  },
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: "/test/workspace",
          joinPath: vi.fn((...parts: string[]) => ({
            fsPath: `/test/workspace/${parts.join("/")}`,
          })),
        },
      },
    ],
    fs: {
      writeFile: vi.fn(),
    },
    onDidOpenTextDocument: vi.fn(),
    createFileSystemWatcher: vi.fn(() => ({
      onDidChange: vi.fn(),
    })),
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn(),
  },
  Uri: {
    joinPath: vi.fn((base: any, ...parts: string[]) => ({
      fsPath: `${base.fsPath}/${parts.join("/")}`,
    })),
    file: vi.fn((path: string) => ({
      fsPath: path,
    })),
  },
}));

// Mock the extension instance
const mockExtensionInstance = {
  getCurrentDocument: vi.fn(),
  _updateDocument: vi.fn(),
};

(globalThis as any).designerExtension = mockExtensionInstance;

describe("PropertiesPanelWebviewProvider", () => {
  let provider: PropertiesPanelWebviewProvider;
  let mockContext: vscode.ExtensionContext;
  let mockWebviewView: vscode.WebviewView;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock context
    mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: "/test/extension" } as vscode.Uri,
    } as vscode.ExtensionContext;

    // Create mock webview view
    mockWebviewView = {
      webview: {
        options: {},
        html: "",
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn(),
      },
      onDidChangeVisibility: vi.fn(),
      onDidDispose: vi.fn(),
      visible: true,
    } as any;

    // Create provider
    provider = new PropertiesPanelWebviewProvider(mockContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resolveWebviewView", () => {
    it("should set up webview correctly", () => {
      provider.resolveWebviewView(mockWebviewView);

      expect(mockWebviewView.webview.options).toEqual({
        enableScripts: true,
        localResourceRoots: [mockContext.extensionUri],
      });
    });

    it("should handle ready message", async () => {
      provider.resolveWebviewView(mockWebviewView);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage;
      expect(messageHandler).toHaveBeenCalled();

      // Simulate ready message
      const handler = messageHandler.mock.calls[0][0];
      await handler({ command: "ready" });

      // Should send current state - at minimum selection
      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: "setSelection",
        selection: { selectedNodeIds: [], focusedNodeId: null },
      });
    });

    it("should handle property change messages", async () => {
      // Set up mock document
      const mockDocument: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Main Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "frame-1",
                type: "frame",
                name: "Test Frame",
                visible: true,
                frame: { x: 100, y: 100, width: 200, height: 100 },
              },
            ],
          },
        ],
      };

      mockExtensionInstance.getCurrentDocument.mockReturnValue(mockDocument);

      // Set document with file path to avoid "No file path tracked" error
      const mockFilePath = { fsPath: "/test/path/test.canvas.json" } as any;
      provider.setDocument(mockDocument, mockFilePath);
      provider.resolveWebviewView(mockWebviewView);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage;
      const handler = messageHandler.mock.calls[0][0];

      // Simulate property change
      const propertyEvent: PropertyChangeEvent = {
        nodeId: "frame-1",
        propertyKey: "frame.x",
        oldValue: 100,
        newValue: 150,
        sectionId: "layout",
      };

      await handler({ command: "propertyChange", event: propertyEvent });

      // Should acknowledge the change (after successful save)
      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: "propertyChangeAcknowledged",
        event: propertyEvent,
      });
    });

    it("should handle errors gracefully", async () => {
      // Set up mock to throw error
      mockExtensionInstance.getCurrentDocument.mockImplementation(() => {
        throw new Error("Test error");
      });

      provider.resolveWebviewView(mockWebviewView);

      const messageHandler = mockWebviewView.webview.onDidReceiveMessage;
      const handler = messageHandler.mock.calls[0][0];

      // Simulate property change that will fail
      const propertyEvent: PropertyChangeEvent = {
        nodeId: "frame-1",
        propertyKey: "frame.x",
        oldValue: 100,
        newValue: 150,
        sectionId: "layout",
      };

      await handler({ command: "propertyChange", event: propertyEvent });

      // Should send error message
      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: "showError",
        error: expect.stringContaining("Failed to apply property change"),
      });
    });
  });

  describe("Document and Selection Management", () => {
    beforeEach(() => {
      provider.resolveWebviewView(mockWebviewView);
    });

    it("should set and send document", () => {
      const mockDocument: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [],
      };

      provider.setDocument(mockDocument);

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: "setDocument",
        document: mockDocument,
      });
    });

    it("should set and send selection", () => {
      const selection: SelectionState = {
        selectedNodeIds: ["frame-1", "text-1"],
        focusedNodeId: "frame-1",
      };

      provider.setSelection(selection);

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: "setSelection",
        selection,
      });
    });

    it("should notify property changes", () => {
      const event: PropertyChangeEvent = {
        nodeId: "frame-1",
        propertyKey: "frame.x",
        oldValue: 100,
        newValue: 150,
        sectionId: "layout",
      };

      provider.notifyPropertyChanged(event);

      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: "propertyChangedFromCanvas",
        event,
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle webview disposal", () => {
      provider.resolveWebviewView(mockWebviewView);

      // Simulate disposal
      const disposeHandler = mockWebviewView.onDidDispose;
      const handler = disposeHandler.mock.calls[0][0];
      handler();

      // Provider should handle disposal gracefully
      expect(() => provider.getView()).not.toThrow();
    });

    it("should handle visibility changes", () => {
      // Set up document first
      const mockDocument: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [],
      };

      mockExtensionInstance.getCurrentDocument.mockReturnValue(mockDocument);
      provider.setDocument(mockDocument);

      provider.resolveWebviewView(mockWebviewView);

      // Simulate ready message first
      const messageHandler = mockWebviewView.webview.onDidReceiveMessage;
      const readyHandler = messageHandler.mock.calls[0][0];
      readyHandler({ command: "ready" });

      // Check that webview is properly configured
      expect(mockWebviewView.webview.options.enableScripts).toBe(true);
      expect(mockWebviewView.webview.options.localResourceRoots).toEqual([
        mockContext.extensionUri,
      ]);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete workflow", async () => {
      // Set up document and selection
      const mockDocument: CanvasDocumentType = {
        schemaVersion: "0.1.0",
        id: "test-doc",
        name: "Test Document",
        artboards: [
          {
            id: "artboard-1",
            name: "Main Artboard",
            frame: { x: 0, y: 0, width: 1440, height: 1024 },
            children: [
              {
                id: "frame-1",
                type: "frame",
                name: "Test Frame",
                visible: true,
                frame: { x: 100, y: 100, width: 200, height: 100 },
              },
            ],
          },
        ],
      };

      mockExtensionInstance.getCurrentDocument.mockReturnValue(mockDocument);

      provider.setDocument(mockDocument);
      provider.setSelection({
        selectedNodeIds: ["frame-1"],
        focusedNodeId: "frame-1",
      });

      // Resolve webview
      provider.resolveWebviewView(mockWebviewView);

      // Simulate ready message
      const messageHandler = mockWebviewView.webview.onDidReceiveMessage;
      const handler = messageHandler.mock.calls[0][0];
      await handler({ command: "ready" });

      // Should send document and selection
      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: "setDocument",
        document: mockDocument,
      });
      expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith({
        command: "setSelection",
        selection: { selectedNodeIds: ["frame-1"], focusedNodeId: "frame-1" },
      });
    });
  });
});
