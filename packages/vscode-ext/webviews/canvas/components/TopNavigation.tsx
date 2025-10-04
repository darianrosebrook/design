/**
 * @fileoverview Top Navigation Component
 * @author @darianrosebrook
 *
 * Top navigation bar showing file name, metadata, and global actions.
 */

import type { CanvasDocumentType } from "@paths-design/canvas-schema";
import { Button } from "@paths-design/design-system";
import {
  ChevronDown,
  File,
  Settings,
  Share,
  Download,
  Save,
  Undo,
  Redo,
  MoreHorizontal,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

interface TopNavigationProps {
  canvasDocument: CanvasDocumentType | null;
  fileName?: string;
  filePath?: string;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  canvasDocument,
  fileName,
  filePath,
  onSave,
  onExport,
  onShare,
  onSettings,
}) => {
  // Early return if document is not available to prevent DOM access errors
  if (!canvasDocument && !fileName) {
    return null;
  }

  const displayName = canvasDocument?.name || fileName || "Untitled Document";
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!window.document) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsFileMenuOpen(false);
        setIsSettingsMenuOpen(false);
      }
    };

    window.document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fileMenuItems = [
    { label: "Save", icon: Save, action: onSave, shortcut: "Ctrl+S" },
    { label: "Export", icon: Download, action: onExport, shortcut: "Ctrl+E" },
    { label: "Share", icon: Share, action: onShare, shortcut: "Ctrl+H" },
  ];

  const settingsMenuItems = [
    {
      label: "Undo",
      icon: Undo,
      action: () => console.log("Undo"),
      shortcut: "Ctrl+Z",
    },
    {
      label: "Redo",
      icon: Redo,
      action: () => console.log("Redo"),
      shortcut: "Ctrl+Y",
    },
    {
      label: "Settings",
      icon: Settings,
      action: onSettings,
      shortcut: "Ctrl+,",
    },
  ];

  return (
    <div className="top-navigation">
      <div className="nav-content">
        {/* File info */}
        <div className="file-info">
          <h1 className="document-title">{displayName}</h1>
          {filePath && <span className="file-path">{filePath}</span>}
        </div>

        {/* Spacer */}
        <div className="nav-spacer" />

        {/* Global actions with progressive disclosure */}
        <div>
          <div ref={dropdownRef} className="dropdown-container">
            {/* File Menu */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              aria-label="File actions"
              className="dropdown-toggle"
            >
              <File size={14} />
              File
              <ChevronDown size={12} />
            </Button>
            {isFileMenuOpen && (
              <div className="dropdown-menu">
                {fileMenuItems.map(
                  (item) =>
                    item.action && (
                      <button
                        key={item.label}
                        className="dropdown-item"
                        onClick={() => {
                          item.action?.();
                          setIsFileMenuOpen(false);
                        }}
                      >
                        <item.icon size={14} />
                        <span>{item.label}</span>
                        <span className="shortcut">{item.shortcut}</span>
                      </button>
                    )
                )}
              </div>
            )}
          </div>

          {/* Settings Menu */}
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
              aria-label="Settings and actions"
              className="dropdown-toggle"
            >
              <MoreHorizontal size={14} />
              Actions
              <ChevronDown size={12} />
            </Button>
            {isSettingsMenuOpen && (
              <div className="dropdown-menu">
                {settingsMenuItems.map(
                  (item) =>
                    item.action && (
                      <button
                        key={item.label}
                        className="dropdown-item"
                        onClick={() => {
                          item.action?.();
                          setIsSettingsMenuOpen(false);
                        }}
                      >
                        <item.icon size={14} />
                        <span>{item.label}</span>
                        <span className="shortcut">{item.shortcut}</span>
                      </button>
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
