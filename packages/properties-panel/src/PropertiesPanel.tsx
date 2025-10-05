/**
 * @fileoverview Main properties panel component
 * @author @darianrosebrook
 */

// Use global React object if available (for webview context)
const React = (globalThis as any).React || require("react");
const { useMemo } = React;
import { PropertiesService } from "./properties-service.js";
import { PropertyRegistry } from "./property-registry.js";
import { PropertySectionComponent } from "./PropertySection.js";
import type {
  PropertiesPanelProps,
  PropertySection,
  PropertySectionProps,
} from "./types.js";
import { useProperties } from "./use-properties.js";
import { VirtualizedList } from "./VirtualizedList.js";

/**
 * Main properties panel component
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selection: externalSelection,
  onPropertyChange,
  onSelectionChange,
  className = "",
  style = {},
  fonts = [],
  propertyError,
  onDismissError,
}) => {
  // Use the properties hook for state management
  const {
    selection,
    updateSelection,
    handlePropertyChange,
    getCurrentPropertyValue,
  } = useProperties();

  // Use external selection if provided, otherwise use internal state
  const currentSelection = externalSelection || selection;

  // Get initial advanced toggle state from service
  const propertiesService = React.useMemo(
    () => PropertiesService.getInstance(),
    []
  );
  const [showAdvanced, setShowAdvanced] = React.useState(
    () => (propertiesService.getUIState("showAdvanced") as boolean) ?? false
  );

  // Persist advanced toggle state changes
  const handleAdvancedToggle = React.useCallback(
    (newValue: boolean) => {
      setShowAdvanced(newValue);
      propertiesService.setUIState("showAdvanced", newValue);
    },
    [propertiesService]
  );

  // Determine if we should use virtualization (more than 10 sections total)
  const shouldVirtualize = useMemo(() => {
    if (currentSelection.selectedNodeIds.length === 0) {
      return false;
    }
    const allSections = PropertyRegistry.getSections();
    return allSections.length > 10;
  }, [currentSelection.selectedNodeIds.length]);

  // Get applicable sections for the current selection
  const sections = useMemo(() => {
    if (currentSelection.selectedNodeIds.length === 0) {
      return {
        primary: [],
        advanced: [],
      };
    }

    const allSections = PropertyRegistry.getSections();

    const groupByDisclosure = (
      predicate: (disclosure?: "primary" | "advanced") => boolean
    ) =>
      allSections
        .map((section) => ({
          ...section,
          properties: section.properties.filter((property) =>
            predicate(property.disclosure)
          ),
        }))
        .filter((section) => section.properties.length > 0);

    return {
      primary: groupByDisclosure((disclosure) => disclosure !== "advanced"),
      advanced: groupByDisclosure((disclosure) => disclosure === "advanced"),
    };
  }, [currentSelection.selectedNodeIds.length]);

  // Handle selection changes
  React.useEffect(() => {
    if (externalSelection !== undefined && onSelectionChange !== undefined) {
      updateSelection(externalSelection);
    }
  }, [externalSelection, updateSelection, onSelectionChange]);

  if (currentSelection.selectedNodeIds.length === 0) {
    return (
      <div
        className={`properties-panel ${className}`}
        style={{
          width: 280,
          height: "100%",
          backgroundColor: "#f8f9fa",
          borderLeft: "1px solid #e1e5e9",
          padding: "16px",
          overflowY: "auto",
          ...style,
        }}
      >
        <div className="properties-panel-empty">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No Selection</h3>
            <p>Select an element to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`properties-panel ${className}`}
      style={{
        width: 280,
        height: "100%",
        backgroundColor: "#ffffff",
        borderLeft: "1px solid #e1e5e9",
        overflowY: "auto",
        ...style,
      }}
    >
      {propertyError && (
        <div className="properties-panel-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">
              Failed to update {propertyError.propertyKey}:{" "}
              {propertyError.error}
            </span>
            <button
              type="button"
              className="error-dismiss"
              onClick={onDismissError}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="properties-panel-header">
        <h2 className="panel-title">Properties</h2>
        <div className="selection-info">
          {currentSelection.selectedNodeIds.length} element
          {currentSelection.selectedNodeIds.length !== 1 ? "s" : ""} selected
        </div>
      </div>

      <div className="properties-panel-content">
        {shouldVirtualize ? (
          <VirtualizedList
            items={[
              ...sections.primary,
              ...(showAdvanced
                ? sections.advanced.map((section: PropertySection) => ({
                    ...section,
                    defaultCollapsed: true,
                  }))
                : []),
            ]}
            itemHeight={120} // Estimated height per section
            containerHeight={400} // Container height for virtualization
            renderItem={(section: PropertySection) => (
              <PropertySectionComponent
                key={`${section.id}`}
                section={section}
                selection={currentSelection}
                onPropertyChange={(event) => {
                  handlePropertyChange(event);
                  onPropertyChange?.(event);
                }}
                getPropertyValue={getCurrentPropertyValue}
                fonts={fonts}
              />
            )}
          />
        ) : (
          <>
            {sections.primary.map((section: PropertySection) => (
              <PropertySectionComponent
                key={`primary-${section.id}`}
                section={section}
                selection={currentSelection}
                onPropertyChange={(event) => {
                  handlePropertyChange(event);
                  onPropertyChange?.(event);
                }}
                getPropertyValue={getCurrentPropertyValue}
                fonts={fonts}
              />
            ))}

            {sections.advanced.length > 0 && (
              <div className="properties-panel-advanced">
                <button
                  type="button"
                  className="advanced-toggle"
                  onClick={() => handleAdvancedToggle(!showAdvanced)}
                >
                  <span>
                    {showAdvanced ? "Hide advanced" : "Show advanced"}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={showAdvanced ? "expanded" : "collapsed"}
                  >
                    <path
                      d="M3 4l3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {showAdvanced &&
                  sections.advanced.map((section: PropertySection) => (
                    <PropertySectionComponent
                      key={`advanced-${section.id}`}
                      section={{
                        ...section,
                        defaultCollapsed: true,
                      }}
                      selection={currentSelection}
                      onPropertyChange={(event) => {
                        handlePropertyChange(event);
                        onPropertyChange?.(event);
                      }}
                      getPropertyValue={getCurrentPropertyValue}
                      fonts={fonts}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * CSS styles for the properties panel
 */
export const propertiesPanelStyles = `
.properties-panel-error {
  background-color: #fee;
  border-bottom: 1px solid #fcc;
  padding: 8px 16px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #c33;
}

.error-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.error-message {
  flex: 1;
  line-height: 1.4;
}

.error-dismiss {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 16px;
  opacity: 0.7;
}

.error-dismiss:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.2);
}

.properties-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: #333333;
}

.properties-panel-header {
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  background-color: #f8f9fa;
}

.panel-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.selection-info {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
}

.properties-panel-content {
  padding: 0;
}

.properties-panel-advanced {
  padding: 8px 16px 16px;
  border-top: 1px solid #e1e5e9;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #495057;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 0;
}

.advanced-toggle:hover {
  color: #1a1a1a;
}

.advanced-toggle svg {
  transition: transform 0.15s ease;
}

.advanced-toggle svg.expanded {
  transform: rotate(180deg);
}

.property-row {
  position: relative;
}

.property-row-mixed .property-label label::after {
  content: ' (mixed)';
  font-style: italic;
  color: #6c757d;
}

.property-row .mixed-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #6c757d;
}

.properties-panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.empty-state {
  padding: 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

/* Responsive design */
@media (max-width: 768px) {
  .properties-panel {
    width: 100% !important;
    border-left: none;
    border-top: 1px solid #e1e5e9;
  }
}
`;
