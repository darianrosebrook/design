"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  Package,
  X,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Folder,
  Code,
} from "lucide-react";
import {
  loadFromDesignSystemPackage,
  ingestComponent,
  type IngestedComponent,
} from "@/lib/utils/dynamic-component-registry";
import { ingestComponentsFromFiles } from "@/lib/utils/folder-ingestion";
import { validatePackageName } from "@/lib/utils/component-parser";
import {
  validateW3CDesignTokens,
  type TokenValidationResult,
} from "@paths-design/design-tokens";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { Label } from "@paths-design/design-system";
import { updateIngestedComponent } from "@/lib/utils/dynamic-component-registry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/Dialog";
import { Badge } from "@/ui/primitives/Badge";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import { Alert, AlertDescription } from "@/ui/primitives/Alert";
import { cn } from "@/lib/utils";

interface LibraryIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (components: IngestedComponent[]) => void;
}

type IngestionMethod =
  | "npm-package"
  | "file-upload"
  | "folder-scan"
  | "design-system"
  | "tokens";

interface IngestionState {
  method: IngestionMethod;
  packageName: string;
  selectedFiles: FileList | null;
  selectedTokenFile: File | null;
  tokenValidation: TokenValidationResult | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  ingestedComponents: IngestedComponent[];
}

export function LibraryIngestionModal({
  isOpen,
  onClose,
  onSuccess,
}: LibraryIngestionModalProps) {
  const [state, setState] = useState<IngestionState>({
    method: "design-system",
    packageName: "",
    selectedFiles: null,
    selectedTokenFile: null,
    tokenValidation: null,
    isLoading: false,
    error: null,
    success: false,
    ingestedComponents: [],
  });

  const resetState = useCallback(() => {
    setState({
      method: "design-system",
      packageName: "",
      selectedFiles: null,
      selectedTokenFile: null,
      tokenValidation: null,
      isLoading: false,
      error: null,
      success: false,
      ingestedComponents: [],
    });
  }, []);

  const handleComponentNameChange = useCallback(
    (componentId: string, newName: string) => {
      console.log(`Updating component ${componentId} name to: ${newName}`);
      const success = updateIngestedComponent(componentId, { name: newName });
      if (success) {
        // Update local state
        setState((prev) => ({
          ...prev,
          ingestedComponents: prev.ingestedComponents.map((comp) =>
            comp.id === componentId ? { ...comp, name: newName } : comp
          ),
        }));
      }
    },
    []
  );

  // Editable component name component
  const EditableComponentName = React.memo(
    ({
      component,
      onNameChange,
    }: {
      component: IngestedComponent;
      onNameChange: (newName: string) => void;
    }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [editValue, setEditValue] = useState(component.name);

      const handleDoubleClick = () => {
        setIsEditing(true);
        setEditValue(component.name);
      };

      const handleSave = () => {
        if (editValue.trim() && editValue !== component.name) {
          onNameChange(editValue.trim());
        }
        setIsEditing(false);
      };

      const handleCancel = () => {
        setEditValue(component.name);
        setIsEditing(false);
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleSave();
        } else if (e.key === "Escape") {
          handleCancel();
        }
      };

      if (isEditing) {
        return (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="font-medium text-sm h-6 px-1"
            autoFocus
          />
        );
      }

      return (
        <p
          className="font-medium text-sm truncate cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5"
          onDoubleClick={handleDoubleClick}
          title="Double-click to edit component name"
        >
          {component.name}
        </p>
      );
    }
  );

  const handleClose = useCallback(() => {
    if (!state.isLoading) {
      resetState();
      onClose();
    }
  }, [state.isLoading, resetState, onClose]);

  const handleMethodChange = useCallback((method: IngestionMethod) => {
    setState((prev) => ({
      ...prev,
      method,
      error: null,
      success: false,
      ingestedComponents: [],
      packageName: method === "npm-package" ? prev.packageName : "",
      selectedFiles: method === "folder-scan" ? prev.selectedFiles : null,
      selectedTokenFile: method === "tokens" ? prev.selectedTokenFile : null,
      tokenValidation: method === "tokens" ? prev.tokenValidation : null,
    }));
  }, []);

  const handlePackageNameChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      packageName: value,
      error: null,
    }));
  }, []);

  const handleFileSelection = useCallback((files: FileList | null) => {
    setState((prev) => ({
      ...prev,
      selectedFiles: files,
      error: null,
    }));
  }, []);

  const handleIngestPackage = useCallback(async () => {
    const validation = validatePackageName(state.packageName);
    if (!validation.isValid) {
      setState((prev) => ({
        ...prev,
        error: validation.error || "Invalid package name",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      success: false,
    }));

    try {
      const components = await loadFromDesignSystemPackage(state.packageName);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        success: true,
        ingestedComponents: components,
      }));

      onSuccess?.(components);
    } catch (error) {
      console.error("Failed to ingest package:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to ingest package",
      }));
    }
  }, [state.packageName, onSuccess]);

  const handleIngestFiles = useCallback(async () => {
    if (!state.selectedFiles || state.selectedFiles.length === 0) {
      setState((prev) => ({
        ...prev,
        error: "Please select component files to ingest",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      success: false,
    }));

    try {
      const result = await ingestComponentsFromFiles({
        files: state.selectedFiles,
        baseCategory: "File Import",
      });

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          success: true,
          ingestedComponents: result.components,
        }));

        onSuccess?.(result.components);
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Ingestion completed with errors. ${result.processedFiles}/${result.totalFiles} components processed.`,
          ingestedComponents: result.components,
        }));

        onSuccess?.(result.components);
      }
    } catch (error) {
      console.error("Failed to ingest files:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to ingest files",
      }));
    }
  }, [state.selectedFiles, onSuccess]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        success: false,
      }));

      try {
        // For now, we'll mock file processing
        // In a real implementation, this would parse component files
        console.log("Processing file:", file.name);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mock ingested components from file
        const mockComponents: IngestedComponent[] = [
          {
            id: `file-${file.name}-button`,
            name: "FileButton",
            description: `Button component from ${file.name}`,
            category: "Interactive",
            icon: "🔘",
            defaultProps: {
              children: "File Button",
              variant: "outline",
            },
            component: React.forwardRef<HTMLButtonElement>((props, ref) => (
              <button
                ref={ref}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                {...props}
              />
            )),
            source: file.name,
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
          },
        ];

        mockComponents.forEach((comp) => {
          ingestComponent(comp);
        });

        setState((prev) => ({
          ...prev,
          isLoading: false,
          success: true,
          ingestedComponents: mockComponents,
        }));

        onSuccess?.(mockComponents);
      } catch (error) {
        console.error("Failed to process file:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to process file",
        }));
      }
    },
    [onSuccess]
  );

  const handleTokenFileSelection = useCallback((file: File | null) => {
    setState((prev) => ({
      ...prev,
      selectedTokenFile: file,
      tokenValidation: null,
      error: null,
    }));

    if (file) {
      // Validate the token file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const tokens = JSON.parse(content);
          const validation = validateW3CDesignTokens(tokens);
          setState((prev) => ({
            ...prev,
            tokenValidation: validation,
          }));
        } catch (error) {
          setState((prev) => ({
            ...prev,
            error:
              error instanceof Error
                ? error.message
                : "Failed to parse token file",
            tokenValidation: null,
          }));
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const handleIngestTokens = useCallback(async () => {
    if (!state.selectedTokenFile) return;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      success: false,
    }));

    try {
      // For now, we'll just validate and show success
      // In a real implementation, this would save the tokens to the design system
      console.log("Ingesting tokens from file:", state.selectedTokenFile.name);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setState((prev) => ({
        ...prev,
        isLoading: false,
        success: true,
      }));

      // For now, we don't have actual components to ingest from tokens
      // In the future, this could generate component variations based on tokens
      onSuccess?.([]);
    } catch (error) {
      console.error("Failed to ingest tokens:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to ingest tokens",
      }));
    }
  }, [state.selectedTokenFile, state.tokenValidation, onSuccess]);

  const renderMethodSelector = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => handleMethodChange("design-system")}
          className={cn(
            "flex items-center gap-3 p-4 border rounded-lg text-left transition-colors",
            state.method === "design-system"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent/50"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Design System Package</h3>
            <p className="text-sm text-muted-foreground">
              Import components from an npm design system package
            </p>
          </div>
          {state.method === "design-system" && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>

        <button
          onClick={() => handleMethodChange("tokens")}
          className={cn(
            "flex items-center gap-3 p-4 border rounded-lg text-left transition-colors",
            state.method === "tokens"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent/50"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Design Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Import design tokens in W3C Design Tokens format
            </p>
          </div>
          {state.method === "tokens" && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>

        <button
          onClick={() => handleMethodChange("npm-package")}
          className={cn(
            "flex items-center gap-3 p-4 border rounded-lg text-left transition-colors",
            state.method === "npm-package"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent/50"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Code className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">NPM Package</h3>
            <p className="text-sm text-muted-foreground">
              Import any React component library from npm
            </p>
          </div>
          {state.method === "npm-package" && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>

        <button
          onClick={() => handleMethodChange("file-upload")}
          className={cn(
            "flex items-center gap-3 p-4 border rounded-lg text-left transition-colors",
            state.method === "file-upload"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent/50"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">File Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload component files or design system exports
            </p>
          </div>
          {state.method === "file-upload" && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>

        <button
          onClick={() => handleMethodChange("folder-scan")}
          className={cn(
            "flex items-center gap-3 p-4 border rounded-lg text-left transition-colors",
            state.method === "folder-scan"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent/50"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Folder className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Component Files</h3>
            <p className="text-sm text-muted-foreground">
              Select multiple component files from folders to import
            </p>
          </div>
          {state.method === "folder-scan" && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>
      </div>
    </div>
  );

  const renderPackageInput = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="package-name">Package Name</Label>
        <Input
          id="package-name"
          placeholder="@your-org/design-system or react-components"
          value={state.packageName}
          onChange={(e) => handlePackageNameChange(e.target.value)}
          disabled={state.isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Enter the npm package name of the design system you want to import
        </p>
      </div>

      <Button
        onClick={handleIngestPackage}
        disabled={!state.packageName.trim() || state.isLoading}
        className="w-full"
      >
        {state.isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Importing Components...
          </>
        ) : (
          <>
            <Package className="h-4 w-4 mr-2" />
            Import Package
          </>
        )}
      </Button>
    </div>
  );

  const renderFileUpload = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".js,.jsx,.ts,.tsx,.json"
          onChange={handleFileUpload}
          disabled={state.isLoading}
        />
        <label
          htmlFor="file-upload"
          className={cn(
            "cursor-pointer flex flex-col items-center gap-4",
            state.isLoading && "pointer-events-none opacity-50"
          )}
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">Click to upload component files</p>
            <p className="text-sm text-muted-foreground">
              Supports .js, .jsx, .ts, .tsx, and .json files
            </p>
          </div>
        </label>
      </div>

      {state.isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing files...
        </div>
      )}
    </div>
  );

  const renderFolderScan = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <input
          type="file"
          id="folder-files"
          className="hidden"
          accept=".js,.jsx,.ts,.tsx"
          multiple
          onChange={(e) => handleFileSelection(e.target.files)}
          disabled={state.isLoading}
        />
        <label
          htmlFor="folder-files"
          className={cn(
            "cursor-pointer flex flex-col items-center gap-4",
            state.isLoading && "pointer-events-none opacity-50"
          )}
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {state.selectedFiles && state.selectedFiles.length > 0
                ? `${state.selectedFiles.length} file${
                    state.selectedFiles.length !== 1 ? "s" : ""
                  } selected`
                : "Click to select component files"}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports .js, .jsx, .ts, .tsx files from folders
            </p>
          </div>
        </label>
      </div>

      {state.selectedFiles && state.selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files:</Label>
          <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50">
            <ul className="space-y-1">
              {Array.from(state.selectedFiles).map((file, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Button
        onClick={handleIngestFiles}
        disabled={
          !state.selectedFiles ||
          state.selectedFiles.length === 0 ||
          state.isLoading
        }
        className="w-full"
      >
        {state.isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Files...
          </>
        ) : (
          <>
            <Folder className="h-4 w-4 mr-2" />
            Import Components
          </>
        )}
      </Button>
    </div>
  );

  const renderTokensInput = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <input
          type="file"
          id="token-file"
          className="hidden"
          accept=".json"
          onChange={(e) =>
            handleTokenFileSelection(e.target.files?.[0] || null)
          }
          disabled={state.isLoading}
        />
        <label
          htmlFor="token-file"
          className={cn(
            "cursor-pointer flex flex-col items-center gap-4",
            state.isLoading && "pointer-events-none opacity-50"
          )}
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {state.selectedTokenFile
                ? state.selectedTokenFile.name
                : "Click to select tokens file"}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports .json files in W3C Design Tokens format
            </p>
          </div>
        </label>
      </div>

      {state.tokenValidation && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {state.tokenValidation.valid ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Valid W3C Design Tokens
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  Validation Errors Found
                </span>
              </>
            )}
          </div>

          {state.tokenValidation.errors.length > 0 && (
            <div className="max-h-32 overflow-y-auto border border-red-200 rounded-md p-3 bg-red-50">
              <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
              <ul className="space-y-1">
                {state.tokenValidation.errors
                  .slice(0, 5)
                  .map((error, index) => (
                    <li key={index} className="text-xs text-red-700">
                      <strong>{error.path}:</strong> {error.message}
                    </li>
                  ))}
                {state.tokenValidation.errors.length > 5 && (
                  <li className="text-xs text-red-600">
                    ...and {state.tokenValidation.errors.length - 5} more errors
                  </li>
                )}
              </ul>
            </div>
          )}

          {state.tokenValidation.warnings.length > 0 && (
            <div className="max-h-32 overflow-y-auto border border-yellow-200 rounded-md p-3 bg-yellow-50">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Warnings:
              </p>
              <ul className="space-y-1">
                {state.tokenValidation.warnings
                  .slice(0, 3)
                  .map((warning, index) => (
                    <li key={index} className="text-xs text-yellow-700">
                      <strong>{warning.path}:</strong> {warning.message}
                    </li>
                  ))}
                {state.tokenValidation.warnings.length > 3 && (
                  <li className="text-xs text-yellow-600">
                    ...and {state.tokenValidation.warnings.length - 3} more
                    warnings
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {state.tokenValidation && !state.tokenValidation.valid && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Warning:</strong> Some tokens failed validation and may need
            to be connected manually after import. You can proceed with the
            import, but disconnected tokens will require manual configuration.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleIngestTokens}
        disabled={!state.selectedTokenFile || state.isLoading}
        className="w-full"
      >
        {state.isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Tokens...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            {state.tokenValidation?.valid
              ? "Import Tokens"
              : "Import Tokens (with warnings)"}
          </>
        )}
      </Button>
    </div>
  );

  const renderSuccess = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Check className="h-5 w-5 text-green-600" />
        <div>
          <h3 className="font-medium text-green-900">
            {state.method === "tokens"
              ? "Design Tokens Imported Successfully!"
              : "Components Imported Successfully!"}
          </h3>
          <p className="text-sm text-green-700">
            {state.method === "tokens"
              ? "Design tokens have been validated and are ready to use"
              : `${state.ingestedComponents.length} component${
                  state.ingestedComponents.length !== 1 ? "s" : ""
                } added to your library`}
          </p>
        </div>
      </div>

      {state.method !== "tokens" && (
        <ScrollArea className="max-h-48">
          <div className="space-y-2">
            {state.ingestedComponents.map((component) => (
              <div
                key={component.id}
                className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-sm">
                  {component.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <EditableComponentName
                    component={component}
                    onNameChange={(newName) =>
                      handleComponentNameChange(component.id, newName)
                    }
                  />
                  <p className="text-xs text-muted-foreground truncate">
                    {component.description}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {component.category}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <Button onClick={handleClose} className="w-full">
        Done
      </Button>
    </div>
  );

  const renderError = () =>
    state.error && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import Design System
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!state.success && (
            <>
              {renderMethodSelector()}

              <div className="border-t pt-6">
                {state.method === "design-system" && renderPackageInput()}
                {state.method === "npm-package" && renderPackageInput()}
                {state.method === "file-upload" && renderFileUpload()}
                {state.method === "folder-scan" && renderFolderScan()}
                {state.method === "tokens" && renderTokensInput()}

                {renderError()}
              </div>
            </>
          )}

          {state.success && renderSuccess()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
