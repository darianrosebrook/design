"use client";

import { Link2, Unlink } from "lucide-react";
import type React from "react";
import { useState } from "react";
import styles from "./box-model-editor.module.scss";
import type { CanvasObject } from "@/lib/types";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { Label } from "@/ui/primitives/Label";

interface BoxModelEditorProps {
  object: CanvasObject;
  onUpdate: (updates: Partial<CanvasObject>) => void;
}

interface BoxModelValues {
  margin: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
  content: { width: number; height: number };
}

export function BoxModelEditor({ object, onUpdate }: BoxModelEditorProps) {
  const [linked, setLinked] = useState({
    margin: true,
    padding: true,
    border: true,
  });

  const [values, setValues] = useState<BoxModelValues>({
    margin: {
      top: object.marginTop || 0,
      right: object.marginRight || 0,
      bottom: object.marginBottom || 0,
      left: object.marginLeft || 0,
    },
    padding: {
      top: object.paddingTop || 0,
      right: object.paddingRight || 0,
      bottom: object.paddingBottom || 0,
      left: object.paddingLeft || 0,
    },
    border: {
      top: object.borderTopWidth || 0,
      right: object.borderRightWidth || 0,
      bottom: object.borderBottomWidth || 0,
      left: object.borderLeftWidth || 0,
    },
    content: {
      width: object.width,
      height: object.height,
    },
  });

  const updateValue = (
    section: keyof BoxModelValues,
    property: string,
    value: number
  ) => {
    const newValues = { ...values };
    (newValues[section] as any)[property] = value;

    // If linked, update all sides
    if (linked[section as keyof typeof linked]) {
      const sides = ["top", "right", "bottom", "left"];
      sides.forEach((side) => {
        (newValues[section] as any)[side] = value;
      });
    }

    setValues(newValues);

    // Update the object
    const updates: Partial<CanvasObject> = {};
    if (section === "content") {
      updates.width = newValues.content.width;
      updates.height = newValues.content.height;
    } else {
      Object.entries(newValues[section]).forEach(([key, val]) => {
        const propName = `${section}${
          key.charAt(0).toUpperCase() + key.slice(1)
        }` as keyof CanvasObject;
        (updates as any)[propName] = val;
      });
    }

    onUpdate(updates);
  };

  const renderInput = (
    section: keyof BoxModelValues,
    property: string,
    label: string
  ) => {
    const value = (values[section] as any)[property];
    const isLinked = linked[section as keyof typeof linked];

    return (
      <div className={styles.inputGroup}>
        <Label className={styles.inputLabel}>{label}</Label>
        <div className={styles.inputGroup}>
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              updateValue(section, property, Number(e.target.value))
            }
            className={styles.controlInput}
            step="0.1"
          />
          {isLinked && (
            <Button
              variant="ghost"
              size="icon"
              className={styles.linkButton}
              onClick={() => setLinked({ ...linked, [section]: false })}
            >
              <Link2 className={styles.linkIcon} />
            </Button>
          )}
          {!isLinked && (
            <Button
              variant="ghost"
              size="icon"
              className={styles.linkButton}
              onClick={() => setLinked({ ...linked, [section]: true })}
            >
              <Unlink className={styles.linkIcon} />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.boxModelEditor}>
      {/* Visual Box Model Representation */}
      <div className={styles.visualContainer}>
        <div className={styles.visualBoxModel}>
          {/* Margin */}
          <div
            className={styles.marginLayer}
            style={{
              top: -values.margin.top,
              right: -values.margin.right,
              bottom: -values.margin.bottom,
              left: -values.margin.left,
            }}
          />

          {/* Border */}
          <div
            className={styles.borderLayer}
            style={{
              top: -values.margin.top - values.border.top,
              right: -values.margin.right - values.border.right,
              bottom: -values.margin.bottom - values.border.bottom,
              left: -values.margin.left - values.border.left,
            }}
          />

          {/* Padding */}
          <div
            className={styles.paddingLayer}
            style={{
              top: -values.margin.top - values.border.top - values.padding.top,
              right:
                -values.margin.right -
                values.border.right -
                values.padding.right,
              bottom:
                -values.margin.bottom -
                values.border.bottom -
                values.padding.bottom,
              left:
                -values.margin.left - values.border.left - values.padding.left,
            }}
          />

          {/* Content */}
          <div
            className={styles.contentLayer}
            style={{
              width: values.content.width,
              height: values.content.height,
            }}
          >
            Content
          </div>
        </div>

        {/* Labels */}
        <div className={`${styles.visualLabel} ${styles.marginLabel}`}>
          Margin
        </div>
        <div className={`${styles.visualLabel} ${styles.borderLabel}`}>
          Border
        </div>
        <div className={`${styles.visualLabel} ${styles.paddingLabel}`}>
          Padding
        </div>
        <div className={`${styles.visualLabel} ${styles.contentLabel}`}>
          Content
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlsSection}>
        {/* Content */}
        <div className={styles.sectionContainer}>
          <Label className={styles.sectionLabel}>Content</Label>
          <div className={`${styles.unlinkedInputs}`}>
            {renderInput("content", "width", "W")}
            {renderInput("content", "height", "H")}
          </div>
        </div>

        {/* Padding */}
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <Label className={styles.sectionLabel}>Padding</Label>
            <Button
              variant="ghost"
              size="icon"
              className={styles.linkButton}
              onClick={() => setLinked({ ...linked, padding: !linked.padding })}
            >
              {linked.padding ? (
                <Link2 className={styles.linkIcon} />
              ) : (
                <Unlink className={styles.linkIcon} />
              )}
            </Button>
          </div>
          {linked.padding ? (
            <Input
              type="number"
              value={values.padding.top}
              onChange={(e) =>
                updateValue("padding", "top", Number(e.target.value))
              }
              className={styles.controlInput}
              step="0.1"
            />
          ) : (
            <div className={styles.unlinkedInputs}>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>T</Label>
                <Input
                  type="number"
                  value={values.padding.top}
                  onChange={(e) =>
                    updateValue("padding", "top", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>R</Label>
                <Input
                  type="number"
                  value={values.padding.right}
                  onChange={(e) =>
                    updateValue("padding", "right", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>B</Label>
                <Input
                  type="number"
                  value={values.padding.bottom}
                  onChange={(e) =>
                    updateValue("padding", "bottom", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>L</Label>
                <Input
                  type="number"
                  value={values.padding.left}
                  onChange={(e) =>
                    updateValue("padding", "left", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Border */}
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <Label className={styles.sectionLabel}>Border</Label>
            <Button
              variant="ghost"
              size="icon"
              className={styles.linkButton}
              onClick={() => setLinked({ ...linked, border: !linked.border })}
            >
              {linked.border ? (
                <Link2 className={styles.linkIcon} />
              ) : (
                <Unlink className={styles.linkIcon} />
              )}
            </Button>
          </div>
          {linked.border ? (
            <Input
              type="number"
              value={values.border.top}
              onChange={(e) =>
                updateValue("border", "top", Number(e.target.value))
              }
              className={styles.controlInput}
              step="0.1"
            />
          ) : (
            <div className={styles.unlinkedInputs}>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>T</Label>
                <Input
                  type="number"
                  value={values.border.top}
                  onChange={(e) =>
                    updateValue("border", "top", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>R</Label>
                <Input
                  type="number"
                  value={values.border.right}
                  onChange={(e) =>
                    updateValue("border", "right", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>B</Label>
                <Input
                  type="number"
                  value={values.border.bottom}
                  onChange={(e) =>
                    updateValue("border", "bottom", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>L</Label>
                <Input
                  type="number"
                  value={values.border.left}
                  onChange={(e) =>
                    updateValue("border", "left", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Margin */}
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <Label className={styles.sectionLabel}>Margin</Label>
            <Button
              variant="ghost"
              size="icon"
              className={styles.linkButton}
              onClick={() => setLinked({ ...linked, margin: !linked.margin })}
            >
              {linked.margin ? (
                <Link2 className={styles.linkIcon} />
              ) : (
                <Unlink className={styles.linkIcon} />
              )}
            </Button>
          </div>
          {linked.margin ? (
            <Input
              type="number"
              value={values.margin.top}
              onChange={(e) =>
                updateValue("margin", "top", Number(e.target.value))
              }
              className={styles.controlInput}
              step="0.1"
            />
          ) : (
            <div className={styles.unlinkedInputs}>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>T</Label>
                <Input
                  type="number"
                  value={values.margin.top}
                  onChange={(e) =>
                    updateValue("margin", "top", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>R</Label>
                <Input
                  type="number"
                  value={values.margin.right}
                  onChange={(e) =>
                    updateValue("margin", "right", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>B</Label>
                <Input
                  type="number"
                  value={values.margin.bottom}
                  onChange={(e) =>
                    updateValue("margin", "bottom", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
              <div className={styles.unlinkedInputGroup}>
                <Label className={styles.directionLabel}>L</Label>
                <Input
                  type="number"
                  value={values.margin.left}
                  onChange={(e) =>
                    updateValue("margin", "left", Number(e.target.value))
                  }
                  className={styles.controlInput}
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
