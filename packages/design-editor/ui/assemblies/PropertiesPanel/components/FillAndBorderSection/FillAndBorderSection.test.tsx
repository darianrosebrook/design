/**
 * @fileoverview Test component for FillAndBorderSection
 * @author @darianrosebrook
 */

import React, { useState } from "react";
import { FillAndBorderSection } from "./FillAndBorderSection";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

export const FillAndBorderSectionTest: React.FC = () => {
  const [mockValues, setMockValues] = useState({
    fill: "#3b82f6",
    backgroundColor: "#3b82f6",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderStyle: "solid",
    fillOpacity: 100,
    borderOpacity: 100,
    hasFill: true,
    hasBorder: true,
  });

  const [selection] = useState({
    selectedNodeIds: ["test-object-1"],
    focusedNodeId: "test-object-1",
  });

  const getPropertyValue = (propertyKey: string) => {
    return mockValues[propertyKey as keyof typeof mockValues] || 0;
  };

  const handlePropertyChange = (event: PropertyChangeEvent) => {
    console.log("Fill/Border property change:", event);
    setMockValues((prev) => ({
      ...prev,
      [event.propertyKey]: event.newValue,
    }));
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-foreground">
        Fill & Border Section Test
      </h1>

      <div className="w-80 border border-border rounded-lg bg-card">
        <FillAndBorderSection
          selection={selection}
          onPropertyChange={handlePropertyChange}
          getPropertyValue={getPropertyValue}
        />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Current Fill & Border Values
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-foreground">Fill</div>
            <div className="text-muted-foreground">
              Color: {mockValues.fill}, Opacity: {mockValues.fillOpacity}%
            </div>
            <div className="text-muted-foreground">
              Enabled: {mockValues.hasFill ? "Yes" : "No"}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">Border</div>
            <div className="text-muted-foreground">
              Color: {mockValues.borderColor}, Width: {mockValues.borderWidth}px
            </div>
            <div className="text-muted-foreground">
              Style: {mockValues.borderStyle}, Opacity:{" "}
              {mockValues.borderOpacity}%
            </div>
            <div className="text-muted-foreground">
              Enabled: {mockValues.hasBorder ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
