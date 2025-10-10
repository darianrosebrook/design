/**
 * @fileoverview Design Tokens Manager - Movable and resizable popover for design token management
 * @author @darianrosebrook
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import {
  Settings,
  Palette,
  Type,
  Layers,
  X,
  Plus,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { Badge } from "@/ui/primitives/Badge";
import { Separator } from "@/ui/primitives/Separator";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/ui/primitives/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/Select";
import { cn } from "@/lib/utils";
import {
  DesignTokensManagerModal,
  type DesignTokensManagerModalProps,
} from "./DesignTokensManagerModal";

export interface DesignTokensManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

/**
 * Design Tokens Manager - Main component for managing design tokens
 */
export function DesignTokensManager({
  isOpen,
  onClose,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 800, height: 600 },
}: DesignTokensManagerProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("default");
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [modalProps, setModalProps] =
    useState<DesignTokensManagerModalProps | null>(null);

  // Mock data for demonstration
  const mockTokens = {
    color: {
      background: {
        primary: { $value: "#ffffff", $type: "color" },
        secondary: { $value: "#f8fafc", $type: "color" },
        tertiary: { $value: "#f1f5f9", $type: "color" },
      },
      text: {
        primary: { $value: "#0f172a", $type: "color" },
        secondary: { $value: "#64748b", $type: "color" },
        inverse: { $value: "#ffffff", $type: "color" },
      },
      border: {
        subtle: { $value: "#e2e8f0", $type: "color" },
        default: { $value: "#cbd5e1", $type: "color" },
        strong: { $value: "#94a3b8", $type: "color" },
      },
    },
    spacing: {
      xs: { $value: 4, $type: "spacing" },
      sm: { $value: 8, $type: "spacing" },
      md: { $value: 16, $type: "spacing" },
      lg: { $value: 24, $type: "spacing" },
      xl: { $value: 32, $type: "spacing" },
    },
    typography: {
      fontFamily: {
        sans: { $value: "Inter, system-ui, sans-serif", $type: "fontFamily" },
        mono: { $value: "JetBrains Mono, monospace", $type: "fontFamily" },
      },
      fontSize: {
        xs: { $value: 12, $type: "fontSize" },
        sm: { $value: 14, $type: "fontSize" },
        md: { $value: 16, $type: "fontSize" },
        lg: { $value: 18, $type: "fontSize" },
        xl: { $value: 20, $type: "fontSize" },
      },
    },
  };

  const [tokens, setTokens] = useState(mockTokens);

  const categories = [
    { id: "all", label: "All", icon: Layers },
    { id: "color", label: "Colors", icon: Palette },
    { id: "typography", label: "Typography", icon: Type },
    { id: "spacing", label: "Spacing", icon: Layers },
  ];

  const themes = [
    { id: "default", label: "Default" },
    { id: "dark", label: "Dark Mode" },
    { id: "high-contrast", label: "High Contrast" },
  ];

  const filteredTokens = React.useMemo(() => {
    let filtered = tokens;

    if (selectedCategory !== "all") {
      filtered = {
        [selectedCategory]: tokens[selectedCategory as keyof typeof tokens],
      };
    }

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const filterTokens = (obj: any, path = ""): any => {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (
            typeof value === "object" &&
            value !== null &&
            "$value" in value
          ) {
            const tokenValue = String(value.$value).toLowerCase();
            const tokenPath = currentPath.toLowerCase();
            if (tokenPath.includes(search) || tokenValue.includes(search)) {
              result[key] = value;
            }
          } else if (typeof value === "object" && value !== null) {
            const nested = filterTokens(value, currentPath);
            if (Object.keys(nested).length > 0) {
              result[key] = nested;
            }
          }
        }
        return result;
      };
      filtered = filterTokens(filtered);
    }

    return filtered;
  }, [tokens, selectedCategory, searchQuery]);

  const handleTokenEdit = useCallback((path: string, newValue: any) => {
    const pathParts = path.split(".");
    setTokens((prev) => {
      const newTokens = { ...prev };
      let current: any = newTokens;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = newValue;
      return newTokens;
    });
  }, []);

  const handleExportTokens = useCallback(() => {
    const dataStr = JSON.stringify(tokens, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "design-tokens.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, [tokens]);

  const handleImportTokens = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            setTokens(imported);
          } catch (error) {
            console.error("Failed to import tokens:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  if (!isOpen) return null;

  return (
    <Rnd
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
        setPosition(position);
      }}
      minWidth={600}
      minHeight={400}
      maxWidth={1200}
      maxHeight={800}
      bounds="window"
      className="z-50"
    >
      <div className="w-full h-full bg-background border border-border rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Design Tokens</h2>
              <p className="text-sm text-muted-foreground">
                Manage your design system tokens and themes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportTokens}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Tokens
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportTokens}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Tokens
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClose}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <category.icon className="h-4 w-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Token
            </Button>
          </div>
        </div>

        {/* Token Grid */}
        <div className="flex-1 overflow-hidden">
          <TokenGrid
            tokens={filteredTokens}
            onTokenEdit={handleTokenEdit}
            selectedTheme={selectedTheme}
          />
        </div>
      </div>
    </Rnd>
  );
}

/**
 * Token Grid Component - Displays tokens in a hierarchical table
 */
function TokenGrid({
  tokens,
  onTokenEdit,
  selectedTheme,
}: {
  tokens: any;
  onTokenEdit: (path: string, value: any) => void;
  selectedTheme: string;
}) {
  const renderTokens = (obj: any, path = ""): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (value && typeof value === "object" && "$value" in value) {
        // This is a token
        nodes.push(
          <TokenRow
            key={currentPath}
            path={currentPath}
            token={value}
            onEdit={(newValue) => onTokenEdit(currentPath, newValue)}
          />
        );
      } else if (value && typeof value === "object") {
        // This is a group
        nodes.push(
          <tr key={currentPath} className="bg-muted/30">
            <td
              colSpan={4}
              className="px-4 py-2 font-medium text-sm text-muted-foreground"
            >
              {key}
            </td>
          </tr>
        );
        nodes.push(...renderTokens(value, currentPath));
      }
    }

    return nodes;
  };

  return (
    <ScrollArea className="h-full">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background/95 backdrop-blur">
          <tr className="border-b border-border">
            <th className="text-left p-4 font-medium">Token</th>
            <th className="text-left p-4 font-medium">Value</th>
            <th className="text-left p-4 font-medium">Type</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>{renderTokens(tokens)}</tbody>
      </table>
    </ScrollArea>
  );
}

/**
 * Token Row Component - Individual token display and editing
 */
function TokenRow({
  path,
  token,
  onEdit,
}: {
  path: string;
  token: any;
  onEdit: (value: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(token.$value));

  const handleSave = () => {
    const newValue = editValue.trim();
    if (newValue && newValue !== String(token.$value)) {
      onEdit({ ...token, $value: newValue });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(token.$value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {path}
          </code>
          <Badge variant="outline" className="text-xs">
            {token.$type || "unknown"}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
            autoFocus
          />
        ) : (
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1"
            onClick={() => setIsEditing(true)}
          >
            <div
              className="w-4 h-4 rounded border"
              style={{
                backgroundColor:
                  token.$type === "color" ? token.$value : "transparent",
              }}
            />
            <span className="font-mono text-sm">{String(token.$value)}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant="secondary" className="text-xs">
          {token.$type || "unknown"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}





















