"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { CanvasObject } from "./types"

export type CanvasTool =
  | "select"
  | "hand"
  | "scale"
  | "frame"
  | "text"
  | "image"
  | "rectangle"
  | "ellipse"
  | "line"
  | "polygon"
export type CanvasBackground = "dot-grid" | "square-grid" | "solid"

interface CanvasContextType {
  objects: CanvasObject[]
  setObjects: (objects: CanvasObject[]) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  updateObject: (id: string, updates: Partial<CanvasObject>) => void
  contextMenu: { x: number; y: number; objectId: string } | null
  setContextMenu: (menu: { x: number; y: number; objectId: string } | null) => void
  activeTool: CanvasTool
  setActiveTool: (tool: CanvasTool) => void
  canvasBackground: CanvasBackground
  setCanvasBackground: (bg: CanvasBackground) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined)

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>("text-1")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: string } | null>(null)
  const [activeTool, setActiveTool] = useState<CanvasTool>("select")
  const [canvasBackground, setCanvasBackground] = useState<CanvasBackground>("dot-grid")

  const [objects, setObjects] = useState<CanvasObject[]>([
    {
      id: "frame-1",
      type: "frame",
      name: "Design Frame",
      x: 100,
      y: 100,
      width: 800,
      height: 600,
      rotation: 0,
      visible: true,
      locked: false,
      opacity: 100,
      fill: "#1a1a1a",
      cornerRadius: 16,
      expanded: true,
      children: [
        {
          id: "text-1",
          type: "text",
          name: "Heading Text",
          x: 150,
          y: 150,
          width: 300,
          height: 60,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          text: "Design Editor",
          fontSize: 48,
          fontFamily: "Inter",
          fontWeight: "700",
          textAlign: "left",
          lineHeight: 1.2,
          letterSpacing: -0.02,
          fill: "#ffffff",
        },
        {
          id: "rect-1",
          type: "rectangle",
          name: "Card Background",
          x: 150,
          y: 240,
          width: 400,
          height: 200,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          fill: "#2a2a2a",
          stroke: "#3a3a3a",
          strokeWidth: 2,
          cornerRadius: 16,
        },
        {
          id: "circle-1",
          type: "circle",
          name: "Avatar",
          x: 600,
          y: 150,
          width: 80,
          height: 80,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          fill: "#4a9eff",
          stroke: "#ffffff",
          strokeWidth: 3,
        },
        {
          id: "image-1",
          type: "image",
          name: "Product Image",
          x: 180,
          y: 270,
          width: 120,
          height: 120,
          rotation: 0,
          visible: true,
          locked: false,
          opacity: 100,
          src: "/diverse-products-still-life.png",
          cornerRadius: 8,
        },
      ],
    },
    {
      id: "rect-2",
      type: "rectangle",
      name: "Background",
      x: 50,
      y: 50,
      width: 900,
      height: 700,
      rotation: 0,
      visible: true,
      locked: true,
      opacity: 100,
      fill: "#0a0a0a",
      cornerRadius: 0,
    },
  ])

  const updateObject = (id: string, updates: Partial<CanvasObject>) => {
    const updateRecursive = (objs: CanvasObject[]): CanvasObject[] => {
      return objs.map((obj) => {
        if (obj.id === id) {
          return { ...obj, ...updates }
        }
        if (obj.children) {
          return { ...obj, children: updateRecursive(obj.children) }
        }
        return obj
      })
    }
    setObjects(updateRecursive(objects))
  }

  const reorderLayers = (fromIndex: number, toIndex: number) => {
    const newObjects = [...objects]
    const [removed] = newObjects.splice(fromIndex, 1)
    newObjects.splice(toIndex, 0, removed)
    setObjects(newObjects)
  }

  return (
    <CanvasContext.Provider
      value={{
        objects,
        setObjects,
        selectedId,
        setSelectedId,
        updateObject,
        contextMenu,
        setContextMenu,
        activeTool,
        setActiveTool,
        canvasBackground,
        setCanvasBackground,
        reorderLayers,
      }}
    >
      {children}
    </CanvasContext.Provider>
  )
}

export function useCanvas() {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error("useCanvas must be used within CanvasProvider")
  }
  return context
}
