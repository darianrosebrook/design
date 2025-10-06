"use client";

import {
  Button,
  Box,
  Input,
  Select,
  Checkbox,
  Label,
  Icon,
  Stack,
  Flex,
  Slider,
  TextField,
  NumberField,
  ColorField,
} from "@paths-design/design-system";
import React from "react";
import styles from "./component-renderer.module.scss";
import type { CanvasObject } from "@/lib/types";

// Import all design system components

/**
 * Component registry mapping component names to actual components
 * @author @darianrosebrook
 */
const COMPONENT_REGISTRY = {
  Button,
  Box,
  Input,
  Select,
  Checkbox,
  Label,
  Icon,
  Stack,
  Flex,
  Slider,
  TextField,
  NumberField,
  ColorField,
} as const;

type ComponentName = keyof typeof COMPONENT_REGISTRY;

interface ComponentRendererProps {
  object: CanvasObject;
}

/**
 * Renders a React component from the design system within the canvas
 * @author @darianrosebrook
 */
export function ComponentRenderer({ object }: ComponentRendererProps) {
  if (!object || object.type !== "component" || !object.componentType) {
    return null;
  }

  const ComponentName = object.componentType as ComponentName;
  const Component = COMPONENT_REGISTRY[ComponentName];

  if (!Component) {
    console.warn(`Component "${ComponentName}" not found in registry`);
    return (
      <div
        className={styles.componentRendererError}
        style={{
          left: object.x,
          top: object.y,
          width: object.width,
          height: object.height,
        }}
      >
        Component "{ComponentName}" not found
      </div>
    );
  }

  // Merge component props with object properties
  const componentProps = {
    ...object.componentProps,
    style: {
      width: "100%",
      height: "100%",
      ...object.componentProps?.style,
    },
  } as any;

  // Handle special cases for different component types
  switch (ComponentName) {
    case "Button":
      return (
        <div
          className={styles.componentRendererPositioned}
          style={{
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
          }}
        >
          <div className={styles.componentRendererButton}>
            <Component {...componentProps}>
              {componentProps.children || "Button"}
            </Component>
          </div>
        </div>
      );

    case "Box":
      return (
        <div
          className={styles.componentRendererPositioned}
          style={{
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
          }}
        >
          <div className={styles.componentRendererStack}>
            <Component {...componentProps}>
              {object.children && object.children.length > 0 ? (
                object.children.map((child) => {
                  // Simple child rendering without recursion to avoid circular dependencies
                  return (
                    <div
                      key={child.id}
                      className={styles.componentRendererChild}
                    >
                      {child.type === "component" ? (
                        <ComponentRenderer object={child} />
                      ) : (
                        <div>Child: {child.name}</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={styles.componentRendererSlot}>
                  <div className={styles.componentRendererSlotLabel}>
                    ◇ Slot
                  </div>
                </div>
              )}
            </Component>
          </div>
        </div>
      );

    case "Input":
    case "TextField":
      return (
        <div
          className={styles.componentRendererPositioned}
          style={{
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
          }}
        >
          <div className={styles.componentRendererInput}>
            <Component {...componentProps} />
          </div>
        </div>
      );

    case "Select":
      return (
        <div
          className={styles.componentRendererPositioned}
          style={{
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
          }}
        >
          <div className={styles.componentRendererSelect}>
            <Component {...componentProps} options={[]} />
          </div>
        </div>
      );

    case "Stack":
    case "Flex":
      return (
        <div
          className={styles.componentRendererPositioned}
          style={{
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
          }}
        >
          <div
            className={`${
              ComponentName === "Stack"
                ? styles.componentRendererStack
                : styles.componentRendererFlex
            }`}
          >
            <Component {...componentProps}>
              {object.children && object.children.length > 0 ? (
                object.children.map((child) => {
                  // Simple child rendering without recursion to avoid circular dependencies
                  return (
                    <div
                      key={child.id}
                      className={styles.componentRendererChild}
                    >
                      {child.type === "component" ? (
                        <ComponentRenderer object={child} />
                      ) : (
                        <div>Child: {child.name}</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={styles.componentRendererSlot}>
                  <div className={styles.componentRendererSlotLabel}>
                    ◇ Slot
                  </div>
                </div>
              )}
            </Component>
          </div>
        </div>
      );

    default:
      return (
        <div
          className={styles.componentRendererPositioned}
          style={{
            left: object.x,
            top: object.y,
            width: object.width,
            height: object.height,
          }}
        >
          <div className={styles.componentRendererContent}>
            <Component {...componentProps} />
          </div>
        </div>
      );
  }
}

/**
 * Get available component names for the component library
 */
export function getAvailableComponents(): ComponentName[] {
  return Object.keys(COMPONENT_REGISTRY) as ComponentName[];
}

/**
 * Get component metadata for the component library
 */
export function getComponentMetadata(componentName: ComponentName) {
  const componentMetadata: Record<string, any> = {
    Button: {
      name: "Button",
      description: "Interactive button component",
      category: "Interactive",
      icon: "🔘",
      defaultProps: {
        children: "Button",
        variant: "primary",
        size: "md",
      },
    },
    Box: {
      name: "Box",
      description: "Container component with styling options",
      category: "Layout",
      icon: "📦",
      defaultProps: {
        padding: "md",
        backgroundColor: "surface",
        borderRadius: "md",
      },
    },
    Input: {
      name: "Input",
      description: "Text input field",
      category: "Form",
      icon: "📝",
      defaultProps: {
        placeholder: "Enter text...",
      },
    },
    TextField: {
      name: "TextField",
      description: "Text field with label",
      category: "Form",
      icon: "📝",
      defaultProps: {
        label: "Label",
        placeholder: "Enter text...",
      },
    },
    Select: {
      name: "Select",
      description: "Dropdown selection component",
      category: "Form",
      icon: "📋",
      defaultProps: {
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
        ],
        placeholder: "Select option...",
      },
    },
    Checkbox: {
      name: "Checkbox",
      description: "Checkbox input component",
      category: "Form",
      icon: "☑️",
      defaultProps: {},
    },
    Label: {
      name: "Label",
      description: "Text label component",
      category: "Typography",
      icon: "🏷️",
      defaultProps: {
        children: "Label",
      },
    },
    Icon: {
      name: "Icon",
      description: "Icon component",
      category: "Media",
      icon: "🎨",
      defaultProps: {
        name: "star",
      },
    },
    Stack: {
      name: "Stack",
      description: "Vertical layout container",
      category: "Layout",
      icon: "📚",
      defaultProps: {
        gap: "md",
      },
    },
    Flex: {
      name: "Flex",
      description: "Flexible layout container",
      category: "Layout",
      icon: "🔧",
      defaultProps: {
        gap: "md",
      },
    },
    Slider: {
      name: "Slider",
      description: "Range slider input",
      category: "Form",
      icon: "🎚️",
      defaultProps: {
        min: 0,
        max: 100,
        defaultValue: 50,
      },
    },
    NumberField: {
      name: "NumberField",
      description: "Number input field",
      category: "Form",
      icon: "🔢",
      defaultProps: {
        label: "Number",
        placeholder: "0",
      },
    },
    ColorField: {
      name: "ColorField",
      description: "Color picker field",
      category: "Form",
      icon: "🎨",
      defaultProps: {
        label: "Color",
        defaultValue: "#000000",
      },
    },
  };

  return (
    componentMetadata[componentName] || {
      name: componentName,
      description: `${componentName} component`,
      category: "Other",
      icon: "❓",
      defaultProps: {},
    }
  );
}
