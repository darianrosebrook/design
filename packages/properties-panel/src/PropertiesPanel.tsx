/**
 * @fileoverview Main properties panel component
 * @author @darianrosebrook
 */

import React, { useMemo } from "react";
import { PropertyRegistry } from "./property-registry";
import { PropertySectionComponent } from "./PropertySection";
import type {
  PropertiesPanelProps,
  // PropertySectionProps, // TODO: Remove if not needed
  // PropertySection, // TODO: Remove if not needed
} from "./types";
import { useProperties } from "./use-properties";

/**
 * Main properties panel component
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  _documentId,
  selection: externalSelection,
  onPropertyChange,
  onSelectionChange,
  className = "",
  style = {},
}) => {
  // Use the properties hook for state management
  const {
    selection,
    updateSelection,
    handlePropertyChange,
    getCurrentPropertyValue,
  } = useProperties();

  // Use external selection if provided, otherwise use internal state
  const currentSelection = externalSelection || selection;

  // Get applicable sections for the current selection
  const sections = useMemo(() => {
    if (currentSelection.selectedNodeIds.length === 0) {
      return [];
    }

    // For now, return all sections since we don't have access to the actual nodes
    // In a real implementation, we'd get the node types and filter accordingly
    return PropertyRegistry.getSections();
  }, [currentSelection.selectedNodeIds]);

  // Handle selection changes
  React.useEffect(() => {
    if (externalSelection !== undefined && onSelectionChange !== undefined) {
      updateSelection(externalSelection);
    }
  }, [externalSelection, updateSelection, onSelectionChange]);

  if (currentSelection.selectedNodeIds.length === 0) {
    return (
      <div
        className={`properties-panel ${className}`}
        style={{
          width: 280,
          height: "100%",
          backgroundColor: "#f8f9fa",
          borderLeft: "1px solid #e1e5e9",
          padding: "16px",
          overflowY: "auto",
          ...style,
        }}
      >
        <div className="properties-panel-empty">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No Selection</h3>
            <p>Select an element to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`properties-panel ${className}`}
      style={{
        width: 280,
        height: "100%",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #e1e5e9",
        overflowY: "auto",
        ...style,
      }}
    >
      <div className="properties-panel-header">
        <h2 className="panel-title">Properties</h2>
        <div className="selection-info">
          {currentSelection.selectedNodeIds.length} element
          {currentSelection.selectedNodeIds.length !== 1 ? "s" : ""} selected
        </div>
      </div>

      <div className="properties-panel-content">
        {sections.map((section) => (
          <PropertySectionComponent
            key={section.id}
            section={section}
            selection={currentSelection}
            onPropertyChange={(event) => {
              handlePropertyChange(event);
              onPropertyChange?.(event);
            }}
            getPropertyValue={getCurrentPropertyValue}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * CSS styles for the properties panel
 */
export const propertiesPanelStyles = `
.properties-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: #333333;
}

.properties-panel-header {
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  background-color: #f8f9fa;
}

.panel-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.selection-info {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
}

.properties-panel-content {
  padding: 0;
}

.properties-panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.empty-state {
  padding: 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

/* Responsive design */
@media (max-width: 768px) {
  .properties-panel {
    width: 100% !important;
    border-left: none;
    border-top: 1px solid #e1e5e9;
  }
}
`;
