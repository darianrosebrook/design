"use client";

import { Search, Package } from "lucide-react";
import React, { useState } from "react";
import {
  getComponentMetadata,
  getAvailableComponents,
} from "@/lib/utils/dynamic-component-registry";
import type { COMPONENT_REGISTRY } from "./component-renderer";
import { useCanvas } from "@/lib/canvas-context";
import { Button } from "@/ui/primitives/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/Dialog";
import { Input } from "@/ui/primitives/Input";
import { ScrollArea } from "@/ui/primitives/ScrollArea";

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
  onDrop: _onDrop,
}: ComponentSlotProps) {
  const { addObjectToParent } = useCanvas();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const availableComponents = getAvailableComponents();
  const filteredComponents = availableComponents.filter(
    (component) =>
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClick = () => {
    setIsPickerOpen(true);
  };

  const handleComponentSelect = (componentType: string) => {
    const metadata =
      getComponentMetadata(componentType as keyof typeof COMPONENT_REGISTRY) ||
      availableComponents.find((c) => c.id === componentType.toLowerCase());

    if (metadata) {
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
        componentProps: metadata.defaultProps || {},
      };

      addObjectToParent(parentId, newComponent, slotIndex);
      setIsPickerOpen(false);
      setSearchQuery("");
    }
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
      const metadata = getComponentMetadata(
        componentType as keyof typeof COMPONENT_REGISTRY
      );
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
    <>
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

      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Insert Component
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredComponents.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No components found
                  </div>
                ) : (
                  filteredComponents.map((component) => (
                    <Button
                      key={component.id}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => handleComponentSelect(component.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{component.name}</div>
                          <div className="text-sm text-gray-500">
                            {component.category}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Slot container that manages multiple slots for composer components
 */
export function SlotContainer({
  children,
  parentId,
  maxSlots = 10,
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
