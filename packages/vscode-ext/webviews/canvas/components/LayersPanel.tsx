/**
 * @fileoverview Layers Panel Component
 * @author @darianrosebrook
 *
 * Left-docked panel showing the document layer hierarchy.
 * Allows selection, visibility toggling, and layer management.
 */

import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { Button, Stack } from "@paths-design/design-system";
import React, { useState, useCallback } from "react";

interface LayersPanelProps {
  document: CanvasDocumentType | null;
  selection: { selectedNodeIds: string[]; focusedNodeId: string | null };
  onSelectionChange: (selection: {
    selectedNodeIds: string[];
    focusedNodeId: string | null;
  }) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface LayerItemProps {
  node: any;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onToggleVisibility: () => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  node,
  depth,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onToggleVisibility,
}) => {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "frame":
        return "🖼️";
      case "text":
        return "📝";
      case "component":
        return "🧩";
      default:
        return "⬜";
    }
  };

  return (
    <div className="layer-item">
      <div className="layer-item-content">
        {/* Expand/collapse button */}
        {hasChildren && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleExpand}
            className="layer-expand-btn"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "▼" : "▶"}
          </Button>
        )}

        {/* Visibility toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleVisibility}
          className={`layer-visibility-btn ${
            node.visible ? "visible" : "hidden"
          }`}
          aria-label={node.visible ? "Hide layer" : "Show layer"}
        >
          {node.visible ? "👁️" : "🙈"}
        </Button>

        {/* Layer icon and name */}
        <div
          className={`layer-name ${isSelected ? "selected" : ""}`}
          onClick={onSelect}
          role="button"
          tabIndex={0}
        >
          <span className="layer-icon">{getNodeIcon(node.type)}</span>
          <span className="layer-text">{node.name || "Untitled"}</span>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="layer-children">
          {node.children.map((child: any, index: number) => (
            <LayerItem
              key={`${node.id}-${child.id || `child-${index}`}`}
              node={child}
              depth={depth + 1}
              isSelected={false} // TODO: Check if child is selected
              isExpanded={false} // TODO: Manage expanded state
              onToggleExpand={() => {}} // TODO: Implement
              onSelect={() => {}} // TODO: Implement
              onToggleVisibility={() => {}} // TODO: Implement
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayersPanel: React.FC<LayersPanelProps> = ({
  document,
  selection,
  onSelectionChange,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      onSelectionChange({
        selectedNodeIds: [nodeId],
        focusedNodeId: nodeId,
      });
    },
    [onSelectionChange]
  );

  const handleToggleVisibility = useCallback((nodeId: string) => {
    // TODO: Implement visibility toggle
    console.log("Toggle visibility for node:", nodeId);
  }, []);

  if (!document) {
    return (
      <div className="layers-panel collapsed">
        <div className="panel-header">
          <h3>Layers</h3>
        </div>
        <div className="panel-content">
          <div className="empty-state">No document loaded</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`layers-panel ${isCollapsed ? "collapsed" : "expanded"}`}>
      <div className="panel-header">
        <Stack direction="horizontal" align="center" justify="between">
          <h3>Layers</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleCollapse}
            aria-label={
              isCollapsed ? "Expand layers panel" : "Collapse layers panel"
            }
          >
            {isCollapsed ? "▶" : "◀"}
          </Button>
        </Stack>
      </div>

      {!isCollapsed && (
        <div className="panel-content">
          <div className="layers-tree">
            {document.artboards.map((artboard) => (
              <LayerItem
                key={artboard.id}
                node={artboard}
                depth={0}
                isSelected={selection.selectedNodeIds.includes(artboard.id)}
                isExpanded={expandedNodes.has(artboard.id)}
                onToggleExpand={() => handleToggleExpand(artboard.id)}
                onSelect={() => handleSelectNode(artboard.id)}
                onToggleVisibility={() => handleToggleVisibility(artboard.id)}
              />
            ))}
          </div>

          {document.artboards.length === 0 && (
            <div className="empty-state">No artboards in document</div>
          )}
        </div>
      )}
    </div>
  );
};
