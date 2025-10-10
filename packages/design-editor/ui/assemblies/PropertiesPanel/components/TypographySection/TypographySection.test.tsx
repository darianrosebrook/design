/**
 * @fileoverview Test component for TypographySection
 * @author @darianrosebrook
 */

import React, { useState } from "react";
import { TypographySection } from "./TypographySection";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

export const TypographySectionTest: React.FC = () => {
  const [mockValues, setMockValues] = useState({
    fontFamily: "Inter",
    fontWeight: "Regular",
    fontSize: 12,
    lineHeight: "Auto",
    letterSpacing: 0,
    textAlign: "left",
    verticalAlign: "top",
    textDecoration: "none",
    textTransform: "none",
    listStyle: "none",
    paragraphSpacing: 0,
    textTruncate: false,
  });

  const [selection] = useState({
    selectedNodeIds: ["test-text-1"],
    focusedNodeId: "test-text-1",
  });

  const getPropertyValue = (propertyKey: string) => {
    return mockValues[propertyKey as keyof typeof mockValues] || 0;
  };

  const handlePropertyChange = (event: PropertyChangeEvent) => {
    console.log("Typography property change:", event);
    setMockValues((prev) => ({
      ...prev,
      [event.propertyKey]: event.newValue,
    }));
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-foreground">
        Typography Section Test
      </h1>

      <div className="w-80 border border-border rounded-lg bg-card">
        <TypographySection
          selection={selection}
          onPropertyChange={handlePropertyChange}
          getPropertyValue={getPropertyValue}
        />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Current Typography Values
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-foreground">Font</div>
            <div className="text-muted-foreground">
              Family: {mockValues.fontFamily}, Weight: {mockValues.fontWeight}
            </div>
            <div className="text-muted-foreground">
              Size: {mockValues.fontSize}px, Line Height:{" "}
              {mockValues.lineHeight}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">Alignment</div>
            <div className="text-muted-foreground">
              Text: {mockValues.textAlign}, Vertical: {mockValues.verticalAlign}
            </div>
            <div className="text-muted-foreground">
              Letter Spacing: {mockValues.letterSpacing}%
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">Decoration</div>
            <div className="text-muted-foreground">
              Decoration: {mockValues.textDecoration}
            </div>
            <div className="text-muted-foreground">
              Transform: {mockValues.textTransform}
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">List & Spacing</div>
            <div className="text-muted-foreground">
              List Style: {mockValues.listStyle}
            </div>
            <div className="text-muted-foreground">
              Paragraph Spacing: {mockValues.paragraphSpacing}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
