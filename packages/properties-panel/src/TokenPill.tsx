/**
 * @fileoverview Token pill component for design token linking
 * @author @darianrosebrook
 */

import React from "react";

export interface TokenPillProps {
  tokenPath: string;
  resolvedValue: string | number;
  isOverride?: boolean;
  onUnlink?: () => void;
  onLink?: () => void;
  className?: string;
}

/**
 * Token pill component showing token linkage and allowing override/unlink
 */
export const TokenPill: React.FC<TokenPillProps> = ({
  tokenPath,
  resolvedValue,
  isOverride = false,
  onUnlink,
  onLink,
  className = "",
}) => {
  const displayPath = tokenPath.replace(/^type\./, "").replace(/^color\./, "");

  return (
    <div
      className={`token-pill ${
        isOverride ? "override" : "linked"
      } ${className}`}
    >
      <div className="token-pill-content">
        <span className="token-icon">🎨</span>
        <span className="token-path">{displayPath}</span>
        <span className="token-value">({resolvedValue})</span>
      </div>
      <div className="token-pill-actions">
        {onUnlink && (
          <button
            type="button"
            className="token-unlink-btn"
            onClick={onUnlink}
            title="Unlink from token"
            aria-label="Unlink from token"
          >
            ×
          </button>
        )}
        {onLink && (
          <button
            type="button"
            className="token-link-btn"
            onClick={onLink}
            title="Link to token"
            aria-label="Link to token"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * CSS styles for token pill
 */
export const tokenPillStyles = `
.token-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  background-color: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  margin-left: 4px;
}

.token-pill.override {
  border-color: var(--vscode-charts-yellow);
  background-color: var(--vscode-charts-yellow);
  color: var(--vscode-editor-background);
}

.token-pill.linked {
  border-color: var(--vscode-charts-blue);
  background-color: var(--vscode-charts-blue);
  color: white;
}

.token-pill-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.token-icon {
  font-size: 10px;
}

.token-path {
  font-weight: 600;
}

.token-value {
  opacity: 0.8;
  font-weight: 400;
}

.token-pill-actions {
  display: flex;
  align-items: center;
}

.token-unlink-btn,
.token-link-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  opacity: 0.7;
  transition: opacity 0.1s ease;
}

.token-unlink-btn:hover,
.token-link-btn:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}
`;
