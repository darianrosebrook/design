/**
 * @fileoverview Test component for AlignmentSection
 * @author @darianrosebrook
 */

import React, { useState } from "react";
import { AlignmentSection } from "./AlignmentSection";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

export const AlignmentSectionTest: React.FC = () => {
  const [mockValues, setMockValues] = useState({
    x: 480,
    y: 1624,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  });

  const [selection] = useState({
    selectedNodeIds: ["test-node-1"],
    focusedNodeId: "test-node-1",
  });

  const getPropertyValue = (propertyKey: string) => {
    return mockValues[propertyKey as keyof typeof mockValues] || 0;
  };

  const handlePropertyChange = (event: PropertyChangeEvent) => {
    console.log("Property change:", event);
    setMockValues((prev) => ({
      ...prev,
      [event.propertyKey]: event.newValue,
    }));
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-foreground">
        Alignment Section Test
      </h1>

      <div className="w-80 border border-border rounded-lg bg-card">
        <AlignmentSection
          selection={selection}
          onPropertyChange={handlePropertyChange}
          getPropertyValue={getPropertyValue}
        />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Current Values
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-foreground">Position</div>
            <div className="text-muted-foreground">
              X: {mockValues.x}, Y: {mockValues.y}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">Transform</div>
            <div className="text-muted-foreground">
              Rotation: {mockValues.rotation}°, Scale: {mockValues.scaleX}x
              {mockValues.scaleY}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
