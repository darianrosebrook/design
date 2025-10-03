/**
 * @fileoverview Property section component
 * @author @darianrosebrook
 */
import React from "react";
import type { PropertySectionProps, PropertyValue } from "./types";
/**
 * Property section component that groups related properties
 */
export declare const PropertySectionComponent: React.FC<PropertySectionProps & {
    getPropertyValue?: (propertyKey: string) => PropertyValue | "mixed";
}>;
/**
 * CSS styles for property sections
 */
export declare const propertySectionStyles = "\n.property-section {\n  border-bottom: 1px solid #e1e5e9;\n}\n\n.section-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 12px 16px;\n  cursor: pointer;\n  background-color: #f8f9fa;\n  transition: background-color 0.15s ease;\n}\n\n.section-header:hover {\n  background-color: #e9ecef;\n}\n\n.section-title {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.section-icon {\n  font-size: 14px;\n  opacity: 0.8;\n}\n\n.section-label {\n  margin: 0;\n  font-size: 13px;\n  font-weight: 600;\n  color: #1a1a1a;\n}\n\n.section-toggle {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  border: none;\n  background: none;\n  cursor: pointer;\n  color: #6c757d;\n  border-radius: 4px;\n  transition: all 0.15s ease;\n}\n\n.section-toggle:hover {\n  background-color: rgba(0, 0, 0, 0.05);\n  color: #495057;\n}\n\n.section-toggle.collapsed svg {\n  transform: rotate(-90deg);\n}\n\n.section-content {\n  padding: 8px 0;\n  background-color: #ffffff;\n}\n";
//# sourceMappingURL=PropertySection.d.ts.map