"use client"

import { useEffect } from "react"
import { useCanvas } from "@/lib/canvas-context"
import { Copy, Trash2, Lock, Eye, MoveUp, MoveDown, Group } from "lucide-react"

export function ContextMenu() {
  const { contextMenu, setContextMenu, objects, selectedId } = useCanvas()

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    const handleScroll = () => setContextMenu(null)

    if (contextMenu) {
      document.addEventListener("click", handleClick)
      document.addEventListener("scroll", handleScroll, true)
      return () => {
        document.removeEventListener("click", handleClick)
        document.removeEventListener("scroll", handleScroll, true)
      }
    }
  }, [contextMenu, setContextMenu])

  if (!contextMenu) return null

  const menuItems = [
    { icon: Copy, label: "Duplicate", shortcut: "⌘D" },
    { icon: Trash2, label: "Delete", shortcut: "⌫", danger: true },
    { type: "separator" },
    { icon: Lock, label: "Lock", shortcut: "⌘L" },
    { icon: Eye, label: "Hide", shortcut: "⌘H" },
    { type: "separator" },
    { icon: MoveUp, label: "Bring Forward", shortcut: "⌘]" },
    { icon: MoveDown, label: "Send Backward", shortcut: "⌘[" },
    { type: "separator" },
    { icon: Group, label: "Group Selection", shortcut: "⌘G" },
  ]

  return (
    <div
      className="fixed z-50 min-w-[200px] bg-card border border-border rounded-xl shadow-2xl py-1"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.type === "separator") {
          return <div key={index} className="h-px bg-border my-1" />
        }

        const Icon = item.icon!
        return (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors ${
              item.danger ? "text-red-500 hover:text-red-600" : ""
            }`}
            onClick={() => {
              console.log("[v0] Context menu action:", item.label)
              setContextMenu(null)
            }}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-xs text-muted-foreground">{item.shortcut}</span>}
          </button>
        )
      })}
    </div>
  )
}
