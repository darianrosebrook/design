/**
 * @fileoverview Properties Panel Component - Right panel for editing properties
 * @author @darianrosebrook
 */

import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { PropertiesPanel as CorePropertiesPanel } from "@paths-design/properties-panel";
import type {
  SelectionState,
  FontMetadata,
} from "@paths-design/properties-panel";
import React from "react";

// VS Code API type
interface VSCodeAPI {
  postMessage(message: unknown): void;
}

interface PropertiesPanelProps {
  document: CanvasDocumentType | null;
  selection: SelectionState;
  onPropertyChange: (event: unknown) => void;
  onSelectionChange: (selection: SelectionState) => void;
  fonts?: FontMetadata[];
  propertyError: { propertyKey: string; error: string } | null;
  onDismissError: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  vscode?: VSCodeAPI;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  document,
  selection,
  onPropertyChange,
  onSelectionChange,
  fonts,
  propertyError,
  onDismissError,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div
      className={`properties-panel ${isCollapsed ? "collapsed" : "expanded"}`}
    >
      <div className="panel-header">
        <div className="panel-title">Properties</div>
        <button
          className="panel-toggle"
          onClick={onToggleCollapse}
          aria-label={
            isCollapsed
              ? "Expand properties panel"
              : "Collapse properties panel"
          }
        >
          {isCollapsed ? "▶" : "◀"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="panel-content">
          {document ? (
            <CorePropertiesPanel
              documentId={document.id}
              selection={selection}
              onPropertyChange={onPropertyChange}
              onSelectionChange={onSelectionChange}
              fonts={fonts as FontMetadata[]}
              propertyError={propertyError}
              onDismissError={onDismissError}
            />
          ) : (
            <div className="panel-placeholder">
              Document is null - waiting for document to load...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
