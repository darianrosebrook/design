"use client";

import type React from "react";
import { createContext, useContext, useEffect, useCallback } from "react";
import { useCanvas } from "./canvas-context";
import { findShortcut, type KeyboardShortcut } from "./keyboard-shortcuts";

interface GlobalShortcutsContextType {
  handleShortcut: (shortcut: KeyboardShortcut) => void;
}

const GlobalShortcutsContext = createContext<
  GlobalShortcutsContextType | undefined
>(undefined);

export function useGlobalShortcuts() {
  const context = useContext(GlobalShortcutsContext);
  if (!context) {
    throw new Error(
      "useGlobalShortcuts must be used within a GlobalShortcutsProvider"
    );
  }
  return context;
}

interface GlobalShortcutsProviderProps {
  children: React.ReactNode;
}

export function GlobalShortcutsProvider({
  children,
}: GlobalShortcutsProviderProps) {
  const {
    selectedId,
    setSelectedId,
    objects,
    updateObject,
    activeTool,
    setActiveTool,
    duplicateObject,
    deleteObject,
    bringForward,
    sendBackward,
    selectAll,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToSelection,
    zoomTo100,
  } = useCanvas();

  const handleShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
      console.log(`[Global Shortcut] Executing: ${shortcut.action}`);

      switch (shortcut.action) {
        // Essential
        case "toggle-ui":
          // TODO: Implement UI toggle functionality
          console.log("Toggle UI - not implemented yet");
          break;

        case "pick-color":
          // TODO: Implement color picker tool
          console.log("Pick Color - not implemented yet");
          break;

        case "search-menu":
          // TODO: Implement global search menu
          console.log("Search Menu - not implemented yet");
          break;

        // Tools
        case "select-tool":
          setActiveTool("select");
          break;

        case "frame-tool":
          setActiveTool("frame");
          break;

        case "pen-tool":
          setActiveTool("line");
          break;

        case "pencil-tool":
          setActiveTool("line");
          break;

        case "text-tool":
          setActiveTool("text");
          break;

        case "rectangle-tool":
          setActiveTool("rectangle");
          break;

        case "ellipse-tool":
          setActiveTool("ellipse");
          break;

        case "line-tool":
          setActiveTool("line");
          break;

        case "arrow-tool":
          setActiveTool("line");
          break;

        case "add-comments":
          // TODO: Implement comments system
          console.log("Add Comments - not implemented yet");
          break;

        case "slice-tool":
          setActiveTool("scale");
          break;

        // Zoom (these need to prevent default browser zoom)
        case "zoom-in":
          zoomIn();
          break;

        case "zoom-out":
          zoomOut();
          break;

        case "zoom-to-100":
          zoomTo100();
          break;

        case "zoom-to-fit":
          zoomToFit();
          break;

        case "zoom-to-selection":
          zoomToSelection();
          break;

        case "zoom-to-previous-frame":
          // TODO: Implement frame-based zoom navigation
          console.log("Zoom to Previous Frame - not implemented yet");
          break;

        case "zoom-to-next-frame":
          // TODO: Implement frame-based zoom navigation
          console.log("Zoom to Next Frame - not implemented yet");
          break;

        case "previous-page":
          // TODO: Implement multi-page navigation
          console.log("Previous Page - not implemented yet");
          break;

        case "next-page":
          // TODO: Implement multi-page navigation
          console.log("Next Page - not implemented yet");
          break;

        case "find-previous-frame":
          // TODO: Implement frame navigation
          console.log("Find Previous Frame - not implemented yet");
          break;

        case "find-next-frame":
          // TODO: Implement frame navigation
          console.log("Find Next Frame - not implemented yet");
          break;

        // Text
        case "text-bold":
          if (selectedId) {
            updateObject(selectedId, { fontWeight: "700" });
          }
          break;

        case "text-italic":
          if (selectedId) {
            console.log("Text Italic - not implemented yet");
          }
          break;

        case "text-underline":
          if (selectedId) {
            console.log("Text Underline - not implemented yet");
          }
          break;

        case "paste-match-style":
          console.log("Paste Match Style - not implemented yet");
          break;

        case "text-align-left":
          if (selectedId) {
            updateObject(selectedId, { textAlign: "left" });
          }
          break;

        case "text-align-center":
          if (selectedId) {
            updateObject(selectedId, { textAlign: "center" });
          }
          break;

        case "text-align-right":
          if (selectedId) {
            updateObject(selectedId, { textAlign: "right" });
          }
          break;

        case "text-align-justified":
          if (selectedId) {
            console.log("Text Align Justified - not implemented yet");
          }
          break;

        // Shape
        case "remove-fill":
          if (selectedId) {
            updateObject(selectedId, { fill: undefined });
          }
          break;

        case "remove-stroke":
          if (selectedId) {
            updateObject(selectedId, { stroke: undefined, strokeWidth: 0 });
          }
          break;

        case "swap-fill-stroke":
          if (selectedId) {
            console.log("Swap Fill and Stroke - not implemented yet");
          }
          break;

        // Selection
        case "select-all":
          selectAll();
          break;

        case "select-inverse":
          // TODO: Implement inverse selection functionality
          console.log("Select Inverse - not implemented yet");
          break;

        case "select-none":
          setSelectedId(null);
          break;

        case "delete":
          if (selectedId) {
            deleteObject(selectedId);
          }
          break;

        case "select-child":
          console.log("Select Child - not implemented yet");
          break;

        case "select-parent":
          console.log("Select Parent - not implemented yet");
          break;

        case "select-next-sibling":
          console.log("Select Next Sibling - not implemented yet");
          break;

        case "select-previous-sibling":
          console.log("Select Previous Sibling - not implemented yet");
          break;

        case "group-selection":
          console.log("Group Selection - not implemented yet");
          break;

        case "ungroup-selection":
          console.log("Ungroup Selection - not implemented yet");
          break;

        case "frame-selection":
          console.log("Frame Selection - not implemented yet");
          break;

        case "show-hide-selection":
          if (selectedId) {
            const selectedObject =
              objects.find((obj) => obj.id === selectedId) ||
              objects
                .flatMap((obj) => obj.children || [])
                .find((obj) => obj.id === selectedId);
            if (selectedObject) {
              updateObject(selectedId, { visible: !selectedObject.visible });
            }
          }
          break;

        case "lock-unlock-selection":
          if (selectedId) {
            const selectedObject =
              objects.find((obj) => obj.id === selectedId) ||
              objects
                .flatMap((obj) => obj.children || [])
                .find((obj) => obj.id === selectedId);
            if (selectedObject) {
              updateObject(selectedId, { locked: !selectedObject.locked });
            }
          }
          break;

        // Edit
        case "copy":
          // TODO: Implement clipboard copy functionality
          console.log("Copy - not implemented yet");
          break;

        case "cut":
          // TODO: Implement clipboard cut functionality
          console.log("Cut - not implemented yet");
          break;

        case "paste":
          // TODO: Implement clipboard paste functionality
          console.log("Paste - not implemented yet");
          break;

        case "paste-over-selection":
          // TODO: Implement paste over selection functionality
          console.log("Paste Over Selection - not implemented yet");
          break;

        case "duplicate":
          if (selectedId) {
            duplicateObject(selectedId);
          }
          break;

        case "rename":
          console.log("Rename - not implemented yet");
          break;

        case "export":
          console.log("Export - not implemented yet");
          break;

        case "copy-properties":
          console.log("Copy Properties - not implemented yet");
          break;

        case "paste-properties":
          console.log("Paste Properties - not implemented yet");
          break;

        // Transform
        case "flip-horizontal":
          if (selectedId) {
            console.log("Flip Horizontal - not implemented yet");
          }
          break;

        case "flip-vertical":
          if (selectedId) {
            console.log("Flip Vertical - not implemented yet");
          }
          break;

        case "use-as-mask":
          if (selectedId) {
            console.log("Use as Mask - not implemented yet");
          }
          break;

        case "edit-shape-or-image":
          console.log("Edit Shape or Image - not implemented yet");
          break;

        case "opacity-10":
          if (selectedId) {
            updateObject(selectedId, { opacity: 10 });
          }
          break;

        case "opacity-50":
          if (selectedId) {
            updateObject(selectedId, { opacity: 50 });
          }
          break;

        case "opacity-100":
          if (selectedId) {
            updateObject(selectedId, { opacity: 100 });
          }
          break;

        // Arrange
        case "bring-forward":
          if (selectedId) {
            bringForward(selectedId);
          }
          break;

        case "send-backward":
          if (selectedId) {
            sendBackward(selectedId);
          }
          break;

        case "bring-to-front":
          console.log("Bring to Front - not implemented yet");
          break;

        case "send-to-back":
          console.log("Send to Back - not implemented yet");
          break;

        case "align-left":
          console.log("Align Left - not implemented yet");
          break;

        case "align-right":
          console.log("Align Right - not implemented yet");
          break;

        case "align-top":
          console.log("Align Top - not implemented yet");
          break;

        case "align-bottom":
          console.log("Align Bottom - not implemented yet");
          break;

        case "align-horizontal-centers":
          console.log("Align Horizontal Centers - not implemented yet");
          break;

        case "align-vertical-centers":
          console.log("Align Vertical Centers - not implemented yet");
          break;

        case "tidy-up":
          console.log("Tidy Up - not implemented yet");
          break;

        // Components
        case "create-component":
          console.log("Create Component - not implemented yet");
          break;

        case "detach-instance":
          console.log("Detach Instance - not implemented yet");
          break;

        default:
          console.log(`[Global Shortcut] Unknown action: ${shortcut.action}`);
      }
    },
    [
      selectedId,
      setSelectedId,
      objects,
      updateObject,
      activeTool,
      setActiveTool,
      duplicateObject,
      deleteObject,
      bringForward,
      sendBackward,
      selectAll,
      zoomIn,
      zoomOut,
      zoomToFit,
      zoomToSelection,
      zoomTo100,
    ]
  );

  useEffect(() => {
    const blocklist = new Set(["=", "+", "-", "0"]);
    const handleKeyDown = (e: KeyboardEvent) => {
      // ignore text inputs
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      const isPrimary = navigator.platform.toUpperCase().includes("MAC") ? e.metaKey : e.ctrlKey;

      // Hard block page zoom/reset first (works in browsers)
      if (isPrimary && blocklist.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      const modifiers = {
        ctrl: !navigator.platform.toUpperCase().includes("MAC") ? e.ctrlKey : false,
        cmd:  navigator.platform.toUpperCase().includes("MAC") ? e.metaKey : false,
        shift: e.shiftKey,
        alt: e.altKey,
      };

      const shortcut = findShortcut(e.key, modifiers);
      if (shortcut) {
        e.preventDefault();
        e.stopPropagation();
        handleShortcut(shortcut);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Prevent Ctrl/⌘ + wheel zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (e.deltaY < 0) zoomIn();
        else if (e.deltaY > 0) zoomOut();
      }
    };

    // Safari pinch-zoom (non-standard) – prevents viewport scaling
    const preventGesture = (e: Event) => e.preventDefault();

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("gesturestart", preventGesture as any, { passive: false });
    window.addEventListener("gesturechange", preventGesture as any, { passive: false });
    window.addEventListener("gestureend", preventGesture as any, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true } as any);
      window.removeEventListener("wheel", handleWheel as any);
      window.removeEventListener("gesturestart", preventGesture as any);
      window.removeEventListener("gesturechange", preventGesture as any);
      window.removeEventListener("gestureend", preventGesture as any);
    };
  }, [handleShortcut, zoomIn, zoomOut]);

  const contextValue: GlobalShortcutsContextType = {
    handleShortcut,
  };

  return (
    <GlobalShortcutsContext.Provider value={contextValue}>
      {children}
    </GlobalShortcutsContext.Provider>
  );
}
