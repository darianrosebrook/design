/**
 * Library storage system for persisting ingested components
 * @author @darianrosebrook
 */

import type { IngestedComponent } from "./dynamic-component-registry";

interface SerializableComponent {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  defaultProps: Record<string, any>;
  source: string;
  version?: string;
  lastUpdated: string;
}

const STORAGE_KEY = "design-editor-ingested-components";
const STORAGE_VERSION = "1.0.0";

interface StoredLibraryData {
  version: string;
  components: Record<string, IngestedComponent>;
  lastUpdated: string;
}

/**
 * Save ingested components to localStorage
 */
export function saveIngestedComponents(
  components: Map<string, IngestedComponent>
): void {
  try {
    // Convert to serializable format (exclude component functions)
    const serializableComponents: Record<string, SerializableComponent> = {};

    for (const [id, component] of components) {
      if (component.source !== "design-system") {
        serializableComponents[id] = {
          id: component.id,
          name: component.name,
          description: component.description,
          category: component.category,
          icon: component.icon,
          defaultProps: component.defaultProps,
          source: component.source,
          version: component.version,
          lastUpdated: component.lastUpdated,
        };
      }
    }

    const storageData: StoredLibraryData = {
      version: STORAGE_VERSION,
      components: serializableComponents,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error("Failed to save ingested components:", error);
  }
}

/**
 * Load ingested components from localStorage
 */
export function loadIngestedComponents(): Map<string, IngestedComponent> {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return new Map();
    }

    const parsedData: StoredLibraryData = JSON.parse(storedData);

    // Check version compatibility
    if (parsedData.version !== STORAGE_VERSION) {
      console.warn(
        `Library storage version mismatch. Expected ${STORAGE_VERSION}, got ${parsedData.version}. Clearing stored data.`
      );
      localStorage.removeItem(STORAGE_KEY);
      return new Map();
    }

    return new Map(Object.entries(parsedData.components));
  } catch (error) {
    console.error("Failed to load ingested components:", error);
    return new Map();
  }
}

/**
 * Clear all stored ingested components
 */
export function clearStoredComponents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear stored components:", error);
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  hasStoredData: boolean;
  storedComponentsCount: number;
  lastUpdated?: string;
  storageSize?: string;
} {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return {
        hasStoredData: false,
        storedComponentsCount: 0,
      };
    }

    const parsedData: StoredLibraryData = JSON.parse(storedData);
    const storageSize = new Blob([storedData]).size;

    return {
      hasStoredData: true,
      storedComponentsCount: Object.keys(parsedData.components).length,
      lastUpdated: parsedData.lastUpdated,
      storageSize: `${(storageSize / 1024).toFixed(2)} KB`,
    };
  } catch (error) {
    console.error("Failed to get storage stats:", error);
    return {
      hasStoredData: false,
      storedComponentsCount: 0,
    };
  }
}

/**
 * Export stored components as JSON
 */
export function exportStoredComponents(): string | null {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData;
  } catch (error) {
    console.error("Failed to export stored components:", error);
    return null;
  }
}

/**
 * Import components from JSON data
 */
export function importStoredComponents(jsonData: string): boolean {
  try {
    const parsedData: StoredLibraryData = JSON.parse(jsonData);

    // Validate structure
    if (!parsedData.version || !parsedData.components) {
      throw new Error("Invalid library data format");
    }

    // Save to storage
    localStorage.setItem(STORAGE_KEY, jsonData);
    return true;
  } catch (error) {
    console.error("Failed to import stored components:", error);
    return false;
  }
}

/**
 * Migrate old storage format (if needed in future)
 */
export function migrateStorageIfNeeded(): void {
  // Future migrations can be added here
  // For now, just ensure version compatibility
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    try {
      const parsedData: StoredLibraryData = JSON.parse(storedData);
      if (parsedData.version !== STORAGE_VERSION) {
        console.log("Migrating library storage...");
        // Perform migration logic here
        // For now, just clear and let it rebuild
        clearStoredComponents();
      }
    } catch (error) {
      console.warn("Invalid stored data, clearing:", error);
      clearStoredComponents();
    }
  }
}
