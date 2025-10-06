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
  Code,
} from "lucide-react";
import {
  loadFromDesignSystemPackage,
  ingestComponent,
  type IngestedComponent,
} from "@/lib/utils/dynamic-component-registry";
import { validatePackageName } from "@/lib/utils/component-parser";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { Label } from "@/ui/primitives/Input";
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

type IngestionMethod = "npm-package" | "file-upload" | "design-system";

interface IngestionState {
  method: IngestionMethod;
  packageName: string;
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
    isLoading: false,
    error: null,
    success: false,
    ingestedComponents: [],
  });

  const resetState = useCallback(() => {
    setState({
      method: "design-system",
      packageName: "",
      isLoading: false,
      error: null,
      success: false,
      ingestedComponents: [],
    });
  }, []);

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
    }));
  }, []);

  const handlePackageNameChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      packageName: value,
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

  const renderSuccess = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Check className="h-5 w-5 text-green-600" />
        <div>
          <h3 className="font-medium text-green-900">
            Components Imported Successfully!
          </h3>
          <p className="text-sm text-green-700">
            {state.ingestedComponents.length} component
            {state.ingestedComponents.length !== 1 ? "s" : ""} added to your
            library
          </p>
        </div>
      </div>

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
                <p className="font-medium text-sm truncate">{component.name}</p>
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
