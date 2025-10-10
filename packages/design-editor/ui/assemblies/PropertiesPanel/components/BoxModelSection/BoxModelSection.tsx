/**
 * @fileoverview Box Model section component for the properties panel
 * @author @darianrosebrook
 */

"use client";

import React, { useMemo } from "react";
import { BoxModel } from "@/ui/assemblies/BoxModel";
import type { PropertyChangeEvent } from "@paths-design/properties-panel";

interface BoxModelSectionProps {
  selection: {
    selectedNodeIds: string[];
    focusedNodeId: string | null;
  };
  onPropertyChange: (event: PropertyChangeEvent) => void;
  getPropertyValue: (propertyKey: string) => any;
}

export const BoxModelSection: React.FC<BoxModelSectionProps> = ({
  selection,
  onPropertyChange,
  getPropertyValue,
}) => {
  // Extract box model values from the selected node
  const boxModelValues = useMemo(() => {
    const width =
      getPropertyValue("width") || getPropertyValue("frame.width") || 360;
    const height =
      getPropertyValue("height") || getPropertyValue("frame.height") || 48;

    const paddingTop =
      getPropertyValue("paddingTop") || getPropertyValue("padding.top") || 8;
    const paddingRight =
      getPropertyValue("paddingRight") ||
      getPropertyValue("padding.right") ||
      8;
    const paddingBottom =
      getPropertyValue("paddingBottom") ||
      getPropertyValue("padding.bottom") ||
      8;
    const paddingLeft =
      getPropertyValue("paddingLeft") || getPropertyValue("padding.left") || 8;

    const marginTop =
      getPropertyValue("marginTop") || getPropertyValue("margin.top") || 28;
    const marginRight =
      getPropertyValue("marginRight") || getPropertyValue("margin.right") || 28;
    const marginBottom =
      getPropertyValue("marginBottom") ||
      getPropertyValue("margin.bottom") ||
      28;
    const marginLeft =
      getPropertyValue("marginLeft") || getPropertyValue("margin.left") || 28;

    return {
      width: typeof width === "number" ? width : parseFloat(width) || 360,
      height: typeof height === "number" ? height : parseFloat(height) || 48,
      padding: {
        top:
          typeof paddingTop === "number"
            ? paddingTop
            : parseFloat(paddingTop) || 8,
        right:
          typeof paddingRight === "number"
            ? paddingRight
            : parseFloat(paddingRight) || 8,
        bottom:
          typeof paddingBottom === "number"
            ? paddingBottom
            : parseFloat(paddingBottom) || 8,
        left:
          typeof paddingLeft === "number"
            ? paddingLeft
            : parseFloat(paddingLeft) || 8,
      },
      margin: {
        top:
          typeof marginTop === "number"
            ? marginTop
            : parseFloat(marginTop) || 28,
        right:
          typeof marginRight === "number"
            ? marginRight
            : parseFloat(marginRight) || 28,
        bottom:
          typeof marginBottom === "number"
            ? marginBottom
            : parseFloat(marginBottom) || 28,
        left:
          typeof marginLeft === "number"
            ? marginLeft
            : parseFloat(marginLeft) || 28,
      },
    };
  }, [getPropertyValue]);

  const handleDimensionChange = (width: number, height: number) => {
    if (selection.focusedNodeId) {
      // Try frame properties first (for canvas objects)
      onPropertyChange({
        nodeId: selection.focusedNodeId,
        propertyKey: "frame",
        oldValue: getPropertyValue("frame"),
        newValue: {
          ...getPropertyValue("frame"),
          width,
          height,
        },
        sectionId: "box-model",
      });

      // Also try direct properties
      onPropertyChange({
        nodeId: selection.focusedNodeId,
        propertyKey: "width",
        oldValue: getPropertyValue("width"),
        newValue: width,
        sectionId: "box-model",
      });

      onPropertyChange({
        nodeId: selection.focusedNodeId,
        propertyKey: "height",
        oldValue: getPropertyValue("height"),
        newValue: height,
        sectionId: "box-model",
      });
    }
  };

  const handlePaddingChange = (padding: typeof boxModelValues.padding) => {
    if (selection.focusedNodeId) {
      // Update individual padding properties
      Object.entries(padding).forEach(([side, value]) => {
        const propertyKey = `padding${
          side.charAt(0).toUpperCase() + side.slice(1)
        }`;
        onPropertyChange({
          nodeId: selection.focusedNodeId!,
          propertyKey,
          oldValue: getPropertyValue(propertyKey),
          newValue: value,
          sectionId: "box-model",
        });
      });

      // Also update padding object
      onPropertyChange({
        nodeId: selection.focusedNodeId,
        propertyKey: "padding",
        oldValue: getPropertyValue("padding"),
        newValue: padding,
        sectionId: "box-model",
      });
    }
  };

  const handleMarginChange = (margin: typeof boxModelValues.margin) => {
    if (selection.focusedNodeId) {
      // Update individual margin properties
      Object.entries(margin).forEach(([side, value]) => {
        const propertyKey = `margin${
          side.charAt(0).toUpperCase() + side.slice(1)
        }`;
        onPropertyChange({
          nodeId: selection.focusedNodeId!,
          propertyKey,
          oldValue: getPropertyValue(propertyKey),
          newValue: value,
          sectionId: "box-model",
        });
      });

      // Also update margin object
      onPropertyChange({
        nodeId: selection.focusedNodeId,
        propertyKey: "margin",
        oldValue: getPropertyValue("margin"),
        newValue: margin,
        sectionId: "box-model",
      });
    }
  };

  return (
    <div className="border-b border-border">
      <BoxModel
        width={boxModelValues.width}
        height={boxModelValues.height}
        padding={boxModelValues.padding}
        margin={boxModelValues.margin}
        onDimensionChange={handleDimensionChange}
        onPaddingChange={handlePaddingChange}
        onMarginChange={handleMarginChange}
        className="border-0 rounded-none bg-transparent"
      />
    </div>
  );
};
