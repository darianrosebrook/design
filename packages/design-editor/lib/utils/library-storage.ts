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
  components: Record<string, SerializableComponent>;
  packages: string[]; // Package names for re-ingestion
  lastUpdated: string;
}

/**
 * Save ingested components to localStorage
 */
export function saveIngestedComponents(
  components: Map<string, IngestedComponent>,
  packageNames: string[] = []
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
      packages: packageNames,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error("Failed to save ingested components:", error);
  }
}

/**
 * Re-ingest packages from stored package names
 * This function should be called by the component registry when needed
 */
export async function reingestStoredPackages(
  onPackageLoaded?: (
    packageName: string,
    components: Map<string, IngestedComponent>
  ) => void
): Promise<Map<string, IngestedComponent>> {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return new Map();
    }

    const parsedData: StoredLibraryData = JSON.parse(storedData);

    // Check version compatibility
    if (parsedData.version !== STORAGE_VERSION) {
      console.warn(
        `Library storage version mismatch. Expected ${STORAGE_VERSION}, got ${parsedData.version}.`
      );
      return new Map();
    }

    const reingestedComponents = new Map<string, IngestedComponent>();

    // Re-ingest each package
    for (const packageName of parsedData.packages) {
      try {
        console.log(`Re-ingesting package: ${packageName}`);
        // This would need to be implemented in the component registry
        // For now, we'll just log that re-ingestion is needed
        // The actual implementation would call the package ingestion logic
        if (onPackageLoaded) {
          // Placeholder - actual implementation would load and parse the package
          onPackageLoaded(packageName, new Map());
        }
      } catch (error) {
        console.error(`Failed to re-ingest package ${packageName}:`, error);
      }
    }

    return reingestedComponents;
  } catch (error) {
    console.error("Failed to re-ingest stored packages:", error);
    return new Map();
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

    // Return empty map - we store package names but need to re-ingest to get components
    // This prevents serialization issues with React components
    // Use reingestStoredPackages() to reload packages and get actual components
    console.log(
      `Found ${
        Object.keys(parsedData.components).length
      } stored component references and ${
        parsedData.packages?.length || 0
      } stored packages for re-ingestion`
    );

    return new Map();
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
 * Get stored package names for re-ingestion
 */
export function getStoredPackageNames(): string[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return [];
    }

    const parsedData: StoredLibraryData = JSON.parse(storedData);

    // Check version compatibility
    if (parsedData.version !== STORAGE_VERSION) {
      return [];
    }

    return parsedData.packages || [];
  } catch (error) {
    console.error("Failed to get stored package names:", error);
    return [];
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  hasStoredData: boolean;
  storedComponentsCount: number;
  storedPackagesCount: number;
  lastUpdated?: string;
  storageSize?: string;
} {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return {
        hasStoredData: false,
        storedComponentsCount: 0,
        storedPackagesCount: 0,
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
