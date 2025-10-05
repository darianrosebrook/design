"use client";

import React from "react";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import {
  ComponentRenderer,
  getAvailableComponents,
  getComponentMetadata,
} from "@/ui/composers/ComponentRenderer";
import { useCanvas } from "@/lib/canvas-context";

interface ComponentLibraryProps {
  className?: string;
}

/**
 * Component library panel for inserting design system components
 * @author @darianrosebrook
 */
export function ComponentLibrary({ className }: ComponentLibraryProps) {
  const { objects, setObjects } = useCanvas();
  const availableComponents = getAvailableComponents();

  const addComponentToCanvas = (componentType: string) => {
    const metadata = getComponentMetadata(componentType as any);
    const newComponent = {
      id: `component-${Date.now()}`,
      type: "component" as const,
      name: `${componentType} Component`,
      x: 100 + Math.random() * 200, // Random position for demo
      y: 100 + Math.random() * 200,
      width: componentType === "Button" ? 120 : 200,
      height: componentType === "Button" ? 40 : 60,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      componentType,
      componentProps: metadata.defaultProps,
    };

    setObjects([...objects, newComponent]);
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
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Components</h2>
        <span className="text-xs text-muted-foreground">
          {availableComponents.length} components
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(groupedComponents).map(([category, components]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>

              <div className="grid grid-cols-1 gap-1">
                {components.map(({ type, name, description, icon }) => (
                  <button
                    key={type}
                    onClick={() => addComponentToCanvas(type)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("component-type", type);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left"
                    title={`${description} - Click to insert or drag to canvas`}
                  >
                    <div className="text-lg">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{name}</div>
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
      className="border rounded-md p-4 bg-background"
      style={{ width, height }}
    >
      <ComponentRenderer object={mockObject} />
    </div>
  );
}
