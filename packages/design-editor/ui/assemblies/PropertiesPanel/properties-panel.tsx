"use client";

import type React from "react";
import { useState } from "react";
import { LayoutSection } from "./components/LayoutSection";
import { PositionSection } from "./components/PositionSection";
import { PropertiesPanelHeader } from "./components/PropertiesPanelHeader";
import { PropertiesPanelSection } from "./components/PropertiesPanelSection";
import { ComponentPropsPanel } from "./components/ComponentPropsPanel";
import { PrimitivePropsPanel } from "./components/PrimitivePropsPanel";
import { useCanvas, findObject } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";
import { CanvasBackgroundControls } from "@/ui/composers/CanvasBackgroundControls";
import { AlignmentGrid } from "@/ui/composers/AlignmentGrid";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import { Button } from "@/ui/primitives/Button";
import { Plus } from "lucide-react";

interface PropertySection {
  id: string;
  title: string;
  expanded: boolean;
}

export function PropertiesPanel() {
  const { objects, selectedId, updateObject } = useCanvas();
  const [sections, setSections] = useState<PropertySection[]>([
    { id: "layout", title: "Layout", expanded: true },
    { id: "position", title: "Position", expanded: true },
    { id: "alignment", title: "Alignment", expanded: true },
    { id: "appearance", title: "Appearance", expanded: true },
    { id: "typography", title: "Typography", expanded: false },
    { id: "effects", title: "Effects", expanded: false },
  ]);

  const [aspectLocked, setAspectLocked] = useState(true);

  // Find selected object
  const selectedObject = selectedId ? findObject(objects, selectedId) : null;

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };

  if (!selectedObject) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Properties</h2>
          <span className="text-sm text-muted-foreground">Canvas</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <CanvasBackgroundControls />
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PropertiesPanelHeader selectedObjectType={selectedObject.type} />
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Component Props Panel */}
          {selectedObject.type === "component" && (
            <PropertiesPanelSection
              id="component-props"
              title="Component Properties"
              expanded={true}
              onToggle={toggleSection}
            >
              <ComponentPropsPanel
                object={selectedObject}
                onUpdateProps={(props) =>
                  updateObject(selectedObject.id, {
                    componentProps: {
                      ...selectedObject.componentProps,
                      ...props,
                    },
                  })
                }
              />
            </PropertiesPanelSection>
          )}

          {/* Position Section */}
          <PropertiesPanelSection
            id="position"
            title="Position"
            expanded={sections.find((s) => s.id === "position")!.expanded}
            onToggle={toggleSection}
          >
            <PositionSection
              x={selectedObject.x}
              y={selectedObject.y}
              onXChange={(value) =>
                updateObject(selectedObject.id, { x: value })
              }
              onYChange={(value) =>
                updateObject(selectedObject.id, { y: value })
              }
            />
          </PropertiesPanelSection>

          {/* Layout Section */}
          <PropertiesPanelSection
            id="layout"
            title="Layout"
            expanded={sections.find((s) => s.id === "layout")!.expanded}
            onToggle={toggleSection}
          >
            <LayoutSection
              width={selectedObject.width}
              height={selectedObject.height}
              aspectLocked={aspectLocked}
              onWidthChange={(value) =>
                updateObject(selectedObject.id, { width: value })
              }
              onHeightChange={(value) =>
                updateObject(selectedObject.id, { height: value })
              }
              onAspectLockToggle={() => setAspectLocked(!aspectLocked)}
            />
          </PropertiesPanelSection>

          {/* Alignment Section */}
          <PropertiesPanelSection
            id="alignment"
            title="Alignment"
            expanded={sections.find((s) => s.id === "alignment")!.expanded}
            onToggle={toggleSection}
          >
            <AlignmentGrid
              onAlign={(alignment) => {
                console.log("Alignment:", alignment);
                // TODO: Implement alignment logic
              }}
              currentAlignment={{
                horizontal: "left",
                vertical: "top",
              }}
            />
          </PropertiesPanelSection>

          {/* Primitive Properties Section */}
          {selectedObject.type !== "component" && (
            <PropertiesPanelSection
              id="primitive-props"
              title="Properties"
              expanded={true}
              onToggle={toggleSection}
            >
              <PrimitivePropsPanel
                object={selectedObject}
                onUpdateProps={(props) =>
                  updateObject(selectedObject.id, props)
                }
              />
            </PropertiesPanelSection>
          )}

          {/* Typography Section */}
          {selectedObject.type === "text" && (
            <PropertiesPanelSection
              id="typography"
              title="Typography"
              expanded={sections.find((s) => s.id === "typography")!.expanded}
              onToggle={toggleSection}
            >
              <div className="p-4 text-center text-muted-foreground text-sm">
                Typography controls (coming soon)
              </div>
            </PropertiesPanelSection>
          )}

          {/* Effects Section */}
          <PropertiesPanelSection
            id="effects"
            title="Effects"
            expanded={sections.find((s) => s.id === "effects")!.expanded}
            onToggle={toggleSection}
          >
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Effect
            </Button>
          </PropertiesPanelSection>
        </div>
      </ScrollArea>
    </div>
  );
}
