"use client";

import React from "react";
import { useCanvas } from "@/lib/canvas-context";
import { getComponentMetadata } from "./component-renderer";

interface ComponentSlotProps {
  parentId: string;
  slotIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  onDrop?: (componentType: string, slotIndex: number) => void;
}

/**
 * Placeholder slot for composer components that can be filled with other components
 * @author @darianrosebrook
 */
export function ComponentSlot({ 
  parentId, 
  slotIndex = 0, 
  className = "", 
  style = {},
  onDrop 
}: ComponentSlotProps) {
  const { addObjectToParent } = useCanvas();

  const handleClick = () => {
    // TODO: Open component picker or insert default component
    console.log("Slot clicked, parent:", parentId, "slot:", slotIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-orange-100", "border-orange-300");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-orange-100", "border-orange-300");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-orange-100", "border-orange-300");
    
    const componentType = e.dataTransfer.getData("component-type");
    if (componentType) {
      const metadata = getComponentMetadata(componentType as any);
      const newComponent = {
        id: `component-${Date.now()}`,
        type: "component" as const,
        name: `${componentType} Component`,
        x: 0,
        y: 0,
        width: componentType === "Button" ? 120 : 200,
        height: componentType === "Button" ? 40 : 60,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 100,
        componentType,
        componentProps: metadata.defaultProps,
      };

      // Add component as child of parent
      addObjectToParent(parentId, newComponent, slotIndex);
    }
  };

  return (
    <div
      className={`component-slot border-2 border-dashed border-orange-300 bg-orange-50 bg-opacity-50 rounded-md flex items-center justify-center cursor-pointer hover:bg-orange-100 hover:border-orange-400 transition-colors min-h-[40px] ${className}`}
      style={style}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title="Click to insert component or drag from library"
    >
      <div className="text-orange-600 text-sm font-medium opacity-70">
        ◇ Slot
      </div>
    </div>
  );
}

/**
 * Slot container that manages multiple slots for composer components
 */
export function SlotContainer({ 
  children, 
  parentId, 
  maxSlots = 10 
}: { 
  children: React.ReactNode; 
  parentId: string; 
  maxSlots?: number;
}) {
  const slots = Array.from({ length: maxSlots }, (_, index) => (
    <ComponentSlot key={index} parentId={parentId} slotIndex={index} />
  ));

  return (
    <div className="slot-container">
      {children}
      {slots}
    </div>
  );
}
