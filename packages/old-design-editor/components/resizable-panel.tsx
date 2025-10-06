"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth: number
  minWidth: number
  maxWidth: number
  side: "left" | "right"
}

export function ResizablePanel({ children, defaultWidth, minWidth, maxWidth, side }: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return

      const panelRect = panelRef.current.getBoundingClientRect()
      let newWidth: number

      if (side === "left") {
        newWidth = e.clientX - panelRect.left
      } else {
        newWidth = panelRect.right - e.clientX
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, minWidth, maxWidth, side])

  return (
    <div
      ref={panelRef}
      className="relative bg-card border border-border rounded-2xl overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {children}
      <div
        className={`absolute top-0 ${
          side === "left" ? "right-0" : "left-0"
        } w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group`}
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="absolute inset-y-0 -inset-x-1" />
      </div>
    </div>
  )
}
