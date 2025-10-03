/**
 * @fileoverview Top Navigation Component
 * @author @darianrosebrook
 *
 * Top navigation bar showing file name, metadata, and global actions.
 */

import React from "react";
import { Button, Stack } from "@paths-design/design-system";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";

interface TopNavigationProps {
  document: CanvasDocumentType | null;
  fileName?: string;
  filePath?: string;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  document,
  fileName,
  filePath,
  onSave,
  onExport,
  onShare,
  onSettings,
}) => {
  const displayName = document?.name || fileName || "Untitled Document";

  return (
    <div className="top-navigation">
      <div className="nav-content">
        <Stack direction="horizontal" align="center" spacing="md">
          {/* File info */}
          <div className="file-info">
            <h1 className="document-title">{displayName}</h1>
            {filePath && <span className="file-path">{filePath}</span>}
          </div>

          {/* Spacer */}
          <div className="nav-spacer" />

          {/* Global actions */}
          <Stack direction="horizontal" spacing="xs">
            {onSave && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSave}
                aria-label="Save document"
              >
                💾 Save
              </Button>
            )}

            {onExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onExport}
                aria-label="Export document"
              >
                📤 Export
              </Button>
            )}

            {onShare && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onShare}
                aria-label="Share document"
              >
                🔗 Share
              </Button>
            )}

            {onSettings && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSettings}
                aria-label="Settings"
              >
                ⚙️
              </Button>
            )}
          </Stack>
        </Stack>
      </div>
    </div>
  );
};
