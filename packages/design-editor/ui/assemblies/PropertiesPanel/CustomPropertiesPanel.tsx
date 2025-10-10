/**
 * @fileoverview Custom Properties Panel with Box Model section
 * @author @darianrosebrook
 */

"use client";

import React, { useMemo, useCallback } from "react";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import { Separator } from "@/ui/primitives/Separator";
import { BoxModelSection } from "./components/BoxModelSection";
import { AlignmentSection } from "./components/AlignmentSection";
import { PositionSection } from "./components/PositionSection";
import { LayoutSection } from "./components/LayoutSection";
import { FillAndBorderSection } from "./components/FillAndBorderSection";
import { TypographySection } from "./components/TypographySection";
import { CanvasBackgroundControls } from "@/ui/composers/CanvasBackgroundControls";
import type {
  SelectionState,
  PropertyChangeEvent,
} from "@paths-design/properties-panel";

interface CustomPropertiesPanelProps {
  selection: SelectionState;
  onPropertyChange: (event: PropertyChangeEvent) => void;
  onSelectionChange: (selection: SelectionState) => void;
  getPropertyValue: (propertyKey: string) => any;
  documentId: string;
}

export const CustomPropertiesPanel: React.FC<CustomPropertiesPanelProps> = ({
  selection,
  onPropertyChange,
  onSelectionChange,
  getPropertyValue,
  documentId,
}) => {
  const hasSelection = selection.selectedNodeIds.length > 0;

  return (
    <div className="min-w-96 w-96 max-w-md h-full bg-card border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Properties</h2>
        <span className="text-xs text-muted-foreground">
          {hasSelection
            ? `${selection.selectedNodeIds.length} selected`
            : "Canvas"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {hasSelection ? (
            <div className="space-y-0">
              {/* Layout Section - Frame layout controls (flex/grid/none) */}
              <LayoutSection
                selection={selection}
                onPropertyChange={onPropertyChange}
                getPropertyValue={getPropertyValue}
              />

              {/* Alignment Section - Top section with alignment controls */}
              <AlignmentSection
                selection={selection}
                onPropertyChange={onPropertyChange}
                getPropertyValue={getPropertyValue}
              />

              {/* Position Section - X, Y coordinates and rotation */}
              <PositionSection
                selection={selection}
                onPropertyChange={onPropertyChange}
                getPropertyValue={getPropertyValue}
              />

              {/* Box Model Section - Dimensions and spacing */}
              <BoxModelSection
                selection={selection}
                onPropertyChange={onPropertyChange}
                getPropertyValue={getPropertyValue}
              />

              {/* Fill and Border Section - Colors and styling */}
              <FillAndBorderSection
                selection={selection}
                onPropertyChange={onPropertyChange}
                getPropertyValue={getPropertyValue}
              />

              {/* Typography Section - Text styling */}
              <TypographySection
                selection={selection}
                onPropertyChange={onPropertyChange}
                getPropertyValue={getPropertyValue}
              />

              {/* Additional sections would go here */}
              <div className="p-4">
                <div className="text-sm text-muted-foreground">
                  Additional property sections will be added here
                </div>
              </div>
            </div>
          ) : (
            <CanvasBackgroundControls />
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
