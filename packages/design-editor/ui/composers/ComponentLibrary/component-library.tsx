"use client";

import React from "react";
// Removed SCSS module import - using Tailwind classes
import { useCanvas } from "@/lib/canvas-context";
import {
  ComponentRenderer,
  getAvailableComponents,
  getComponentMetadata,
} from "@/ui/composers/ComponentRenderer";
import { ScrollArea } from "@/ui/primitives/ScrollArea";

interface ComponentLibraryProps {
  className?: string;
}

/**
 * Component library panel for inserting design system components
 * @author @darianrosebrook
 */
export function ComponentLibrary({ className }: ComponentLibraryProps) {
  const { document, createNode } = useCanvas();
  const availableComponents = getAvailableComponents();

  const addComponentToCanvas = async (componentType: string) => {
    const metadata = getComponentMetadata(componentType as any);
    const nodeData = {
      type: "component",
      name: `${componentType} Component`,
      frame: {
        x: 150, // Fixed position to prevent hydration mismatch
        y: 150, // Fixed position to prevent hydration mismatch
        width: componentType === "Button" ? 120 : 200,
        height: componentType === "Button" ? 40 : 60,
      },
      visible: true,
      locked: false,
      opacity: 1.0,
      componentType,
      componentProps: metadata.defaultProps,
    };

    await createNode([0, "children"], nodeData);
  };

  const groupedComponents = availableComponents.reduce((acc, componentType) => {
    const metadata = getComponentMetadata(componentType);
    const category = metadata.category;

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ type: componentType, ...metadata });

    return acc;
  }, {} as Record<string, Array<{ type: string; name: string; description: string; icon: string }>>);

  return (
    <div className={`h-full flex flex-col ${className || ""}`}>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Components</h2>
        <span className="text-sm text-muted-foreground">
          {availableComponents.length} components
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {Object.entries(groupedComponents).map(([category, components]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {category}
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {components.map(({ type, name, description, icon }) => (
                  <button
                    key={type}
                    onClick={() => addComponentToCanvas(type)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("component-type", type);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left w-full"
                    title={`${description} - Click to insert or drag to canvas`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-md flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Component preview for the library
 */
export function ComponentPreview({
  componentType,
  width = 200,
  height = 60,
}: {
  componentType: string;
  width?: number;
  height?: number;
}) {
  const mockObject = {
    id: "preview",
    type: "component" as const,
    name: "Preview",
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0,
    visible: true,
    locked: false,
    opacity: 100,
    componentType,
    componentProps: getComponentMetadata(componentType as any).defaultProps,
  };

  return (
    <div
      className="border border-border rounded-lg overflow-hidden bg-background"
      style={{ width, height }}
    >
      <ComponentRenderer object={mockObject} />
    </div>
  );
}
