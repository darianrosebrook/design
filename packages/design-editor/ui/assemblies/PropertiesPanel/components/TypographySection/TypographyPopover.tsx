/**
 * @fileoverview Typography popover component for advanced typography controls
 * @author @darianrosebrook
 */

"use client";

import React, { useCallback } from "react";
import {
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Underline,
  Strikethrough,
  RotateCcw,
  ArrowRight,
  List,
  ListOrdered,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/primitives/Tabs";
import { cn } from "@/lib/utils";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

interface TypographyPopoverProps {
  selection: {
    selectedNodeIds: string[];
    focusedNodeId: string | null;
  };
  onPropertyChange: (event: PropertyChangeEvent) => void;
  getPropertyValue: (propertyKey: string) => any;
}

export const TypographyPopover: React.FC<TypographyPopoverProps> = ({
  selection,
  onPropertyChange,
  getPropertyValue,
}) => {
  const hasSelection = selection.selectedNodeIds.length > 0;

  const handlePropertyChange = useCallback(
    (propertyKey: string, value: any) => {
      if (!hasSelection) return;

      const nodeId = selection.focusedNodeId || selection.selectedNodeIds[0];

      onPropertyChange({
        nodeId,
        propertyKey,
        oldValue: getPropertyValue(propertyKey),
        newValue: value,
        sectionId: "typography",
      });
    },
    [hasSelection, selection, onPropertyChange, getPropertyValue]
  );

  const alignmentButtons = [
    {
      id: "left",
      icon: AlignLeft,
      label: "Align Left",
    },
    {
      id: "center",
      icon: AlignCenter,
      label: "Align Center",
    },
    {
      id: "right",
      icon: AlignRight,
      label: "Align Right",
    },
    {
      id: "justify",
      icon: AlignJustify,
      label: "Justify",
    },
  ];

  const decorationButtons = [
    {
      id: "underline",
      icon: Underline,
      label: "Underline",
    },
    {
      id: "strikethrough",
      icon: Strikethrough,
      label: "Strikethrough",
    },
    {
      id: "transform",
      icon: RotateCcw,
      label: "Text Transform",
    },
  ];

  const caseButtons = [
    {
      id: "uppercase",
      label: "AG",
      title: "Uppercase",
    },
    {
      id: "lowercase",
      label: "ag",
      title: "Lowercase",
    },
    {
      id: "capitalize",
      label: "Ag",
      title: "Capitalize",
    },
    {
      id: "small-caps",
      label: "AG",
      title: "Small Caps",
    },
  ];

  const verticalTrimButtons = [
    {
      id: "top",
      icon: ArrowUp,
      label: "Align Top",
    },
    {
      id: "bottom",
      icon: ArrowDown,
      label: "Align Bottom",
    },
  ];

  const listStyleButtons = [
    {
      id: "none",
      label: "None",
    },
    {
      id: "bullet",
      icon: List,
      label: "Bullet",
    },
    {
      id: "number",
      icon: ListOrdered,
      label: "Number",
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics" className="text-xs">
              Basics
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs">
              Details
            </TabsTrigger>
            <TabsTrigger value="variable" className="text-xs">
              Variable
            </TabsTrigger>
          </TabsList>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Preview Area */}
      <div className="p-4 border-b border-border">
        <div className="h-16 bg-muted/20 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Preview</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="basics" className="w-full">
          <TabsContent value="basics" className="space-y-4">
            {/* Alignment */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Alignment
              </div>
              <div className="flex items-center gap-1">
                {alignmentButtons.map((button) => {
                  const IconComponent = button.icon;
                  return (
                    <Button
                      key={button.id}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handlePropertyChange("textAlign", button.id)
                      }
                      disabled={!hasSelection}
                      className="h-8 w-8 p-0 hover:bg-muted"
                      title={button.label}
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Decoration */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Decoration
              </div>
              <div className="flex items-center gap-1">
                {decorationButtons.map((button) => {
                  const IconComponent = button.icon;
                  return (
                    <Button
                      key={button.id}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handlePropertyChange("textDecoration", button.id)
                      }
                      disabled={!hasSelection}
                      className="h-8 w-8 p-0 hover:bg-muted"
                      title={button.label}
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="More options"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Case */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Case</div>
              <div className="flex items-center gap-1">
                {caseButtons.map((button) => (
                  <Button
                    key={button.id}
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handlePropertyChange("textTransform", button.id)
                    }
                    disabled={!hasSelection}
                    className="h-8 w-8 p-0 hover:bg-muted"
                    title={button.title}
                  >
                    <span className="text-xs font-medium">{button.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Vertical Trim */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Vertical trim
              </div>
              <div className="flex items-center gap-1">
                {verticalTrimButtons.map((button) => {
                  const IconComponent = button.icon;
                  return (
                    <Button
                      key={button.id}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handlePropertyChange("verticalAlign", button.id)
                      }
                      disabled={!hasSelection}
                      className="h-8 w-8 p-0 hover:bg-muted"
                      title={button.label}
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* List Style */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                List style
              </div>
              <div className="flex items-center gap-1">
                {listStyleButtons.map((button) => (
                  <Button
                    key={button.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePropertyChange("listStyle", button.id)}
                    disabled={!hasSelection}
                    className="h-8 w-8 p-0 hover:bg-muted"
                    title={button.label}
                  >
                    {button.icon ? (
                      <button.icon className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">
                        {button.label}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Paragraph Spacing */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Paragraph spacing
              </span>
              <input
                type="number"
                value={0}
                onChange={(e) =>
                  handlePropertyChange(
                    "paragraphSpacing",
                    parseFloat(e.target.value)
                  )
                }
                disabled={!hasSelection}
                className="w-12 h-6 px-1 text-xs text-center bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Truncate Text */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePropertyChange("textTruncate", true)}
                disabled={!hasSelection}
                className="h-6 px-2 text-xs hover:bg-muted"
              >
                A...
              </Button>
              <span className="text-xs text-muted-foreground">
                Truncate text
              </span>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="text-sm text-muted-foreground text-center py-8">
              Detailed typography controls coming soon
            </div>
          </TabsContent>

          <TabsContent value="variable" className="space-y-4">
            <div className="text-sm text-muted-foreground text-center py-8">
              Variable font controls coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
