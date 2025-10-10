/**
 * @fileoverview Token selector component for linking properties to design tokens
 * @author @darianrosebrook
 */

import type { DesignTokens } from "@paths-design/design-tokens";
import React, { useState, useMemo } from "react";

export interface TokenSelectorProps {
  tokens: DesignTokens;
  propertyType: "color" | "typography" | "spacing" | "radius" | "shadow";
  currentValue?: string;
  onSelectToken: (tokenPath: string) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Token selector component for browsing and selecting design tokens
 */
export const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  propertyType,
  currentValue,
  onSelectToken,
  onCancel,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Flatten tokens into selectable options based on property type
  const tokenOptions = useMemo(() => {
    const options: Array<{
      path: string;
      value: string | number;
      category: string;
    }> = [];

    if (propertyType === "color") {
      // Color tokens
      Object.entries(
        tokens.color as Record<string, Record<string, unknown>>
      ).forEach(([category, categoryTokens]) => {
        Object.entries(categoryTokens as Record<string, unknown>).forEach(
          ([name, value]) => {
            options.push({
              path: `color.${category}.${name}`,
              value:
                typeof value === "string" || typeof value === "number"
                  ? value
                  : String(value),
              category,
            });
          }
        );
      });
    } else if (propertyType === "typography") {
      // Typography tokens
      Object.entries(
        tokens.type as Record<string, Record<string, unknown>>
      ).forEach(([category, categoryTokens]) => {
        Object.entries(categoryTokens as Record<string, unknown>).forEach(
          ([name, value]) => {
            options.push({
              path: `type.${category}.${name}`,
              value:
                typeof value === "string" || typeof value === "number"
                  ? value
                  : String(value),
              category,
            });
          }
        );
      });
    } else if (propertyType === "spacing") {
      // Spacing tokens (assuming they exist in tokens)
      if ("spacing" in tokens) {
        Object.entries((tokens as any).spacing).forEach(([name, value]) => {
          options.push({
            path: `spacing.${name}`,
            value: typeof value === "string" ? value : String(value),
            category: "spacing",
          });
        });
      }
    }

    return options;
  }, [tokens, propertyType]);

  // Filter options based on search and category
  const filteredOptions = useMemo(() => {
    return tokenOptions.filter((option) => {
      const matchesSearch = option.path
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || option.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tokenOptions, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(tokenOptions.map((opt) => opt.category));
    return ["all", ...Array.from(cats)];
  }, [tokenOptions]);

  return (
    <div className={`token-selector ${className}`}>
      <div className="token-selector-header">
        <h3>Select Design Token</h3>
        <button type="button" className="close-btn" onClick={onCancel}>
          ×
        </button>
      </div>

      <div className="token-selector-controls">
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="token-search"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="token-category-filter"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "all"
                ? "All Categories"
                : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="token-list">
        {filteredOptions.length === 0 ? (
          <div className="no-tokens">No tokens found</div>
        ) : (
          filteredOptions.map((option) => (
            <button
              key={option.path}
              type="button"
              className={`token-option ${
                currentValue === `{${option.path}}` ? "selected" : ""
              }`}
              onClick={() => onSelectToken(`{${option.path}}`)}
            >
              <div className="token-path">{option.path}</div>
              <div className="token-value">{option.value}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * CSS styles for token selector
 */
export const tokenSelectorStyles = `
.token-selector {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--vscode-quickInput-background);
  border: 1px solid var(--vscode-widget-border);
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.token-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vscode-widget-border);
}

.token-selector-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.close-btn {
  background: none;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 4px;
  border-radius: 2px;
  font-size: 16px;
  opacity: 0.7;
}

.close-btn:hover {
  opacity: 1;
  background-color: var(--vscode-toolbar-hoverBackground);
}

.token-selector-controls {
  padding: 8px 12px;
  border-bottom: 1px solid var(--vscode-widget-border);
  display: flex;
  gap: 8px;
}

.token-search {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 3px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-size: 12px;
}

.token-category-filter {
  padding: 4px 8px;
  border: 1px solid var(--vscode-input-border);
  border-radius: 3px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  font-size: 12px;
}

.token-list {
  flex: 1;
  overflow-y: auto;
  max-height: 200px;
}

.token-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid var(--vscode-list-inactiveSelectionBackground);
  transition: background-color 0.1s ease;
}

.token-option:hover {
  background: var(--vscode-list-hoverBackground);
}

.token-option.selected {
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
}

.token-path {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.token-value {
  font-size: 11px;
  opacity: 0.8;
  color: var(--vscode-descriptionForeground);
  margin-top: 2px;
}

.no-tokens {
  padding: 16px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}
`;
