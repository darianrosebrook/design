"use client";

import { GripVerticalIcon } from "lucide-react";
import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import styles from "./resizable.module.scss";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={`${styles.resizablePanelGroup} ${className || ""}`}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={`${styles.resizableHandle} ${className || ""}`}
      {...props}
    >
      {withHandle && (
        <div className={styles.resizableHandleGrip}>
          <GripVerticalIcon />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

// Component implementation

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
