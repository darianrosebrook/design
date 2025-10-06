"use client";

import React from "react";
import styles from "./component-library.module.scss";
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
    <div className={`${styles.componentLibrary} ${className || ""}`}>
      <div className={styles.componentLibraryHeader}>
        <h2 className={styles.componentLibraryHeaderTitle}>Components</h2>
        <span className={styles.componentLibraryHeaderCount}>
          {availableComponents.length} components
        </span>
      </div>

      <ScrollArea className={styles.componentLibraryContent}>
        <div className={styles.componentLibraryContent}>
          {Object.entries(groupedComponents).map(([category, components]) => (
            <div key={category} className={styles.componentLibraryCategory}>
              <h3 className={styles.componentLibraryCategoryHeader}>
                {category}
              </h3>

              <div className={styles.componentLibraryGrid}>
                {components.map(({ type, name, description, icon }) => (
                  <button
                    key={type}
                    onClick={() => addComponentToCanvas(type)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("component-type", type);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className={styles.componentLibraryItem}
                    title={`${description} - Click to insert or drag to canvas`}
                  >
                    <div className={styles.componentLibraryItemIcon}>
                      {icon}
                    </div>
                    <div className={styles.componentLibraryItemContent}>
                      <div className={styles.componentLibraryItemName}>
                        {name}
                      </div>
                      <div className={styles.componentLibraryItemDescription}>
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
    <div className={styles.componentLibraryPreview} style={{ width, height }}>
      <ComponentRenderer object={mockObject} />
    </div>
  );
}
