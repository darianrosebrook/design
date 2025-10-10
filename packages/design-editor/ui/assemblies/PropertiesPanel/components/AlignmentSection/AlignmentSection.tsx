/**
 * @fileoverview Alignment section component for the properties panel
 * @author @darianrosebrook
 */

"use client";

import React, { useCallback } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  MoreHorizontal,
  Link,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { cn } from "@/lib/utils";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

interface AlignmentSectionProps {
  selection: {
    selectedNodeIds: string[];
    focusedNodeId: string | null;
  };
  onPropertyChange: (event: PropertyChangeEvent) => void;
  getPropertyValue: (propertyKey: string) => any;
}

type AlignmentAction =
  | "align-left"
  | "align-center"
  | "align-right"
  | "align-top"
  | "align-middle"
  | "align-bottom"
  | "distribute-horizontal"
  | "distribute-vertical"
  | "flip-horizontal"
  | "flip-vertical";

export const AlignmentSection: React.FC<AlignmentSectionProps> = ({
  selection,
  onPropertyChange,
  getPropertyValue,
}) => {
  const hasMultipleSelection = selection.selectedNodeIds.length > 1;
  const hasSelection = selection.selectedNodeIds.length > 0;

  const handleAlignmentAction = useCallback(
    (action: AlignmentAction) => {
      if (!hasSelection) return;

      // For single selection, align relative to canvas
      if (selection.selectedNodeIds.length === 1) {
        const nodeId = selection.selectedNodeIds[0];

        switch (action) {
          case "align-left":
            onPropertyChange({
              nodeId,
              propertyKey: "x",
              oldValue: getPropertyValue("x"),
              newValue: 0,
              sectionId: "alignment",
            });
            break;
          case "align-center":
            // This would need canvas width - for now, center at 400px
            onPropertyChange({
              nodeId,
              propertyKey: "x",
              oldValue: getPropertyValue("x"),
              newValue: 200, // Half of assumed canvas width
              sectionId: "alignment",
            });
            break;
          case "align-right":
            // This would need canvas width - for now, right-align at 800px
            onPropertyChange({
              nodeId,
              propertyKey: "x",
              oldValue: getPropertyValue("x"),
              newValue: 800,
              sectionId: "alignment",
            });
            break;
          case "align-top":
            onPropertyChange({
              nodeId,
              propertyKey: "y",
              oldValue: getPropertyValue("y"),
              newValue: 0,
              sectionId: "alignment",
            });
            break;
          case "align-middle":
            // This would need canvas height - for now, center at 300px
            onPropertyChange({
              nodeId,
              propertyKey: "y",
              oldValue: getPropertyValue("y"),
              newValue: 150, // Half of assumed canvas height
              sectionId: "alignment",
            });
            break;
          case "align-bottom":
            // This would need canvas height - for now, bottom-align at 600px
            onPropertyChange({
              nodeId,
              propertyKey: "y",
              oldValue: getPropertyValue("y"),
              newValue: 600,
              sectionId: "alignment",
            });
            break;
        }
      }

      // For multiple selection, implement distribution logic
      if (hasMultipleSelection) {
        // TODO: Implement distribution logic for multiple objects
        console.log(
          `Distribution action: ${action} for ${selection.selectedNodeIds.length} objects`
        );
      }
    },
    [
      hasSelection,
      selection.selectedNodeIds,
      onPropertyChange,
      getPropertyValue,
    ]
  );

  const handleTransformAction = useCallback(
    (action: "flip-horizontal" | "flip-vertical") => {
      if (!hasSelection) return;

      selection.selectedNodeIds.forEach((nodeId) => {
        const currentScaleX = getPropertyValue("scaleX") || 1;
        const currentScaleY = getPropertyValue("scaleY") || 1;

        if (action === "flip-horizontal") {
          onPropertyChange({
            nodeId,
            propertyKey: "scaleX",
            oldValue: currentScaleX,
            newValue: -currentScaleX,
            sectionId: "alignment",
          });
        } else {
          onPropertyChange({
            nodeId,
            propertyKey: "scaleY",
            oldValue: currentScaleY,
            newValue: -currentScaleY,
            sectionId: "alignment",
          });
        }
      });
    },
    [
      hasSelection,
      selection.selectedNodeIds,
      onPropertyChange,
      getPropertyValue,
    ]
  );

  const alignmentButtons = [
    {
      id: "align-left",
      icon: AlignLeft,
      label: "Align Left",
      action: "align-left" as AlignmentAction,
    },
    {
      id: "align-center",
      icon: AlignCenter,
      label: "Align Center",
      action: "align-center" as AlignmentAction,
    },
    {
      id: "align-right",
      icon: AlignRight,
      label: "Align Right",
      action: "align-right" as AlignmentAction,
    },
    {
      id: "align-top",
      icon: AlignVerticalJustifyCenter,
      label: "Align Top",
      action: "align-top" as AlignmentAction,
    },
    {
      id: "align-middle",
      icon: AlignHorizontalJustifyCenter,
      label: "Align Middle",
      action: "align-middle" as AlignmentAction,
    },
    {
      id: "align-bottom",
      icon: AlignVerticalJustifyCenter,
      label: "Align Bottom",
      action: "align-bottom" as AlignmentAction,
    },
    {
      id: "distribute-horizontal",
      icon: AlignHorizontalDistributeCenter,
      label: "Distribute Horizontally",
      action: "distribute-horizontal" as AlignmentAction,
      disabled: !hasMultipleSelection,
    },
    {
      id: "distribute-vertical",
      icon: AlignVerticalDistributeCenter,
      label: "Distribute Vertically",
      action: "distribute-vertical" as AlignmentAction,
      disabled: !hasMultipleSelection,
    },
  ];

  return (
    <div className="border-b border-border">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-xs font-medium text-foreground uppercase tracking-wide">
          Alignment
        </h3>
      </div>

      <div className="p-3 space-y-4">
        {/* Alignment Grid */}
        <div className="grid grid-cols-3 gap-1">
          {alignmentButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <Button
                key={button.id}
                variant="ghost"
                size="sm"
                onClick={() => handleAlignmentAction(button.action)}
                disabled={button.disabled || !hasSelection}
                className={cn(
                  "h-8 w-8 p-0 hover:bg-muted",
                  !hasSelection && "opacity-50 cursor-not-allowed"
                )}
                title={button.label}
              >
                <IconComponent className="h-4 w-4" />
              </Button>
            );
          })}

          {/* More options button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
            title="More alignment options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Transform Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTransformAction("flip-horizontal")}
              disabled={!hasSelection}
              className="h-8 w-8 p-0 hover:bg-muted"
              title="Flip Horizontal"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTransformAction("flip-vertical")}
              disabled={!hasSelection}
              className="h-8 w-8 p-0 hover:bg-muted"
              title="Flip Vertical"
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
            title="Link properties"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        {/* Selection Info */}
        {hasSelection && (
          <div className="text-xs text-muted-foreground">
            {selection.selectedNodeIds.length === 1
              ? "Align to canvas"
              : `${selection.selectedNodeIds.length} objects selected`}
          </div>
        )}
      </div>
    </div>
  );
};
