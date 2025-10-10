/**
 * @fileoverview Test component for LayoutSection
 * @author @darianrosebrook
 */

import React, { useState } from "react";
import { LayoutSection } from "./LayoutSection";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

export const LayoutSectionTest: React.FC = () => {
  const [mockValues, setMockValues] = useState({
    layoutType: "grid",
    width: 360,
    height: 48,
    widthSizing: "fill",
    heightSizing: "hug",
    paddingTop: 24,
    paddingRight: 8,
    paddingBottom: 24,
    paddingLeft: 24,
    gap: 0,
    gapX: 0,
    gapY: 0,
  });

  const [selection] = useState({
    selectedNodeIds: ["test-frame-1"],
    focusedNodeId: "test-frame-1",
  });

  const getPropertyValue = (propertyKey: string) => {
    return mockValues[propertyKey as keyof typeof mockValues] || 0;
  };

  const handlePropertyChange = (event: PropertyChangeEvent) => {
    console.log("Layout property change:", event);
    setMockValues((prev) => ({
      ...prev,
      [event.propertyKey]: event.newValue,
    }));
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-foreground">
        Layout Section Test
      </h1>

      <div className="w-80 border border-border rounded-lg bg-card">
        <LayoutSection
          selection={selection}
          onPropertyChange={handlePropertyChange}
          getPropertyValue={getPropertyValue}
        />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Current Layout Values
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-foreground">Layout</div>
            <div className="text-muted-foreground">
              Type: {mockValues.layoutType}, Size: {mockValues.width}×
              {mockValues.height}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">Sizing</div>
            <div className="text-muted-foreground">
              W: {mockValues.widthSizing}, H: {mockValues.heightSizing}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">Padding</div>
            <div className="text-muted-foreground">
              T: {mockValues.paddingTop}, R: {mockValues.paddingRight}, B:{" "}
              {mockValues.paddingBottom}, L: {mockValues.paddingLeft}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">Gap</div>
            <div className="text-muted-foreground">
              Gap: {mockValues.gap}, X: {mockValues.gapX}, Y: {mockValues.gapY}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
