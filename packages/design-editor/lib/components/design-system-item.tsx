"use client";

import type React from "react";
import { Badge } from '@/ui/primitives/Badge';
import { Button } from '@/ui/primitives/Button';
import {
  Star,
  Bookmark,
  Download,
  Eye,
  Heart,
  Clock,
  User,
  Tag,
} from "./icons";

export interface DesignSystemItem {
  id: string;
  name: string;
  type: "component" | "snippet" | "page" | "icon";
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tags: string[];
  usage: number;
  lastUsed: string;
  author: string;
  version: string;
  isFavorite: boolean;
  isBookmarked: boolean;
  complexity: "simple" | "medium" | "complex";
  accessibility: "basic" | "enhanced" | "full";
}

interface DesignSystemItemProps {
  item: DesignSystemItem;
  viewMode: "grid" | "list";
  onInsert: (item: DesignSystemItem) => void;
  onToggleFavorite: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

function getComplexityColor(complexity: string) {
  switch (complexity) {
    case "simple":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "complex":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getAccessibilityColor(accessibility: string) {
  switch (accessibility) {
    case "basic":
      return "bg-gray-100 text-gray-800";
    case "enhanced":
      return "bg-blue-100 text-blue-800";
    case "full":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function DesignSystemItem({
  item,
  viewMode,
  onInsert,
  onToggleFavorite,
  onToggleBookmark,
}: DesignSystemItemProps) {
  const IconComponent = item.icon;

  if (viewMode === "list") {
    return (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <IconComponent className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{item.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {item.type}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${getComplexityColor(item.complexity)}`}
              >
                {item.complexity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {item.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {item.usage}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.lastUsed}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {item.author}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(item.id)}
          >
            <Star
              className={`h-3 w-3 ${
                item.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleBookmark(item.id)}
          >
            <Bookmark
              className={`h-3 w-3 ${
                item.isBookmarked ? "fill-blue-400 text-blue-400" : ""
              }`}
            />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onInsert(item)}>
            <Download className="h-3 w-3 mr-1" />
            Insert
          </Button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <IconComponent className="h-6 w-6 text-muted-foreground" />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onToggleFavorite(item.id)}
          >
            <Star
              className={`h-3 w-3 ${
                item.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onToggleBookmark(item.id)}
          >
            <Bookmark
              className={`h-3 w-3 ${
                item.isBookmarked ? "fill-blue-400 text-blue-400" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {item.description}
        </p>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <Badge variant="secondary" className="text-xs">
          {item.type}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs ${getComplexityColor(item.complexity)}`}
        >
          {item.complexity}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {item.usage}
        </span>
        <span>v{item.version}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onInsert(item)}
      >
        <Download className="h-3 w-3 mr-1" />
        Insert
      </Button>
    </div>
  );
}
