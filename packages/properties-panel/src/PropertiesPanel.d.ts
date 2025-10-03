/**
 * @fileoverview Main properties panel component
 * @author @darianrosebrook
 */
import React from "react";
import type { PropertiesPanelProps } from "./types";
/**
 * Main properties panel component
 */
export declare const PropertiesPanel: React.FC<PropertiesPanelProps>;
/**
 * CSS styles for the properties panel
 */
export declare const propertiesPanelStyles = "\n.properties-panel {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n  font-size: 13px;\n  line-height: 1.4;\n  color: #333333;\n}\n\n.properties-panel-header {\n  padding: 16px;\n  border-bottom: 1px solid #e1e5e9;\n  background-color: #f8f9fa;\n}\n\n.panel-title {\n  margin: 0 0 4px 0;\n  font-size: 14px;\n  font-weight: 600;\n  color: #1a1a1a;\n}\n\n.selection-info {\n  font-size: 12px;\n  color: #6c757d;\n  margin: 0;\n}\n\n.properties-panel-content {\n  padding: 0;\n}\n\n.properties-panel-empty {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  height: 200px;\n  text-align: center;\n}\n\n.empty-state {\n  padding: 24px;\n}\n\n.empty-icon {\n  font-size: 48px;\n  margin-bottom: 16px;\n  opacity: 0.5;\n}\n\n.empty-state h3 {\n  margin: 0 0 8px 0;\n  font-size: 16px;\n  font-weight: 600;\n  color: #1a1a1a;\n}\n\n.empty-state p {\n  margin: 0;\n  font-size: 13px;\n  color: #6c757d;\n  line-height: 1.4;\n}\n\n/* Responsive design */\n@media (max-width: 768px) {\n  .properties-panel {\n    width: 100% !important;\n    border-left: none;\n    border-top: 1px solid #e1e5e9;\n  }\n}\n";
//# sourceMappingURL=PropertiesPanel.d.ts.map