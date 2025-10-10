/**
 * @fileoverview Test file for BoxModel component
 * @author @darianrosebrook
 */

import React from "react";
import { BoxModel } from "./BoxModel";

// Simple test component to verify BoxModel renders correctly
export const BoxModelTest: React.FC = () => {
  const [dimensions, setDimensions] = React.useState({
    width: 360,
    height: 48,
  });

  const [padding, setPadding] = React.useState({
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
  });

  const [margin, setMargin] = React.useState({
    top: 28,
    right: 28,
    bottom: 28,
    left: 28,
  });

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-foreground">
        Box Model Test
      </h1>

      <BoxModel
        width={dimensions.width}
        height={dimensions.height}
        padding={padding}
        margin={margin}
        onDimensionChange={(width, height) => {
          setDimensions({ width, height });
          console.log("Dimensions changed:", { width, height });
        }}
        onPaddingChange={(newPadding) => {
          setPadding(newPadding);
          console.log("Padding changed:", newPadding);
        }}
        onMarginChange={(newMargin) => {
          setMargin(newMargin);
          console.log("Margin changed:", newMargin);
        }}
      />

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Current Values
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-foreground">Dimensions</h3>
            <p className="text-muted-foreground">
              {dimensions.width} × {dimensions.height}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Padding</h3>
            <p className="text-muted-foreground">
              {padding.top}, {padding.right}, {padding.bottom}, {padding.left}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Margin</h3>
            <p className="text-muted-foreground">
              {margin.top}, {margin.right}, {margin.bottom}, {margin.left}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
