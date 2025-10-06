"use client";

import type React from "react";
import { useState } from "react";
import { LayoutSection } from "./components/LayoutSection";
import { PositionSection } from "./components/PositionSection";
import styles from "./properties-panel.module.scss";
import { useCanvas, findObject } from "@/lib/canvas-context";
import type { CanvasObject } from "@/lib/types";
import { CanvasBackgroundControls } from "@/ui/composers/CanvasBackgroundControls";
import {
  Panel,
  PanelHeader,
  PanelSection,
  PanelContent,
} from "@/ui/composers/Panel";

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
      <Panel>
        <PanelHeader title="Properties" subtitle="Canvas" />
        <PanelContent scrollable>
          <CanvasBackgroundControls />
        </PanelContent>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader title="Properties" subtitle={selectedObject.type} />
      <PanelContent scrollable>
        {/* Component Props Panel - Temporarily disabled */}
        {selectedObject.type === "component" && (
          <div className={styles.propertiesPanelComponentNotice}>
            Component properties panel temporarily disabled
          </div>
        )}

        {/* Position Section */}
        <PanelSection
          id="position"
          title="Position"
          expanded={sections.find((s) => s.id === "position")!.expanded}
          onToggle={toggleSection}
        >
          <PositionSection
            x={selectedObject.x}
            y={selectedObject.y}
            onXChange={(value) => updateObject(selectedObject.id, { x: value })}
            onYChange={(value) => updateObject(selectedObject.id, { y: value })}
          />
        </PanelSection>

        {/* Layout Section */}
        <PanelSection
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
        </PanelSection>

        {/* Placeholder for other sections */}
        <PanelSection
          id="appearance"
          title="Appearance"
          expanded={sections.find((s) => s.id === "appearance")!.expanded}
          onToggle={toggleSection}
        >
          <div className={styles.propertiesPanelPlaceholder}>
            Appearance controls (coming soon)
          </div>
        </PanelSection>

        <PanelSection
          id="typography"
          title="Typography"
          expanded={sections.find((s) => s.id === "typography")!.expanded}
          onToggle={toggleSection}
        >
          <div className={styles.propertiesPanelPlaceholder}>
            Typography controls (coming soon)
          </div>
        </PanelSection>

        <PanelSection
          id="effects"
          title="Effects"
          expanded={sections.find((s) => s.id === "effects")!.expanded}
          onToggle={toggleSection}
        >
          <div className={styles.propertiesPanelPlaceholder}>
            Effects controls (coming soon)
          </div>
        </PanelSection>
      </PanelContent>
    </Panel>
  );
}
