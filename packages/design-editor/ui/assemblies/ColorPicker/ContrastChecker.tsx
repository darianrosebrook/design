"use client";

import type React from "react";
import { Check, X, AlertCircle, Type } from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { Label } from "@/ui/primitives/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/Select";
import {
  contrastRatio,
  meetsContrastRequirement,
  hexToRgb,
} from "@/lib/utils/helpers/color";

// Types for contrast checking
export interface ContrastResult {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  description: string;
}

export function checkContrast(
  foregroundHex: string,
  backgroundHex: string
): ContrastResult {
  const fgRgb = hexToRgb(foregroundHex);
  const bgRgb = hexToRgb(backgroundHex);

  if (!fgRgb || !bgRgb) {
    return {
      ratio: 1,
      meetsAA: false,
      meetsAAA: false,
      description: "Invalid colors",
    };
  }

  const ratio = contrastRatio(fgRgb, bgRgb);
  const meetsAA = meetsContrastRequirement(fgRgb, bgRgb, "AA");
  const meetsAAA = meetsContrastRequirement(fgRgb, bgRgb, "AAA");

  let description = "";
  if (meetsAAA) {
    description = "Excellent contrast (AAA)";
  } else if (meetsAA) {
    description = "Good contrast (AA)";
  } else {
    description = `Poor contrast (${ratio.toFixed(1)}:1)`;
  }

  return {
    ratio,
    meetsAA,
    meetsAAA,
    description,
  };
}

interface ContrastCheckerProps {
  foregroundColor: string;
  backgroundColor: string;
  selectedObject?: any;
  onAutoCorrect?: () => void;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

type ContrastCategory = "auto" | "large-text" | "normal-text" | "graphics";
type ComplianceLevel = "aa" | "aaa";

/**
 * Contrast checker component for accessibility validation
 * @author @darianrosebrook
 */
export function ContrastChecker({
  foregroundColor,
  backgroundColor,
  selectedObject,
  onAutoCorrect,
  showDetails = false,
  onToggleDetails,
}: ContrastCheckerProps) {
  const [contrastCategory, setContrastCategory] =
    React.useState<ContrastCategory>("auto");
  const [complianceLevel, setComplianceLevel] =
    React.useState<ComplianceLevel>("aa");

  // Calculate contrast
  const contrastResult: ContrastResult = checkContrast(
    foregroundColor,
    backgroundColor
  );

  // Determine which contrast threshold to use based on context
  const getContrastThreshold = (): number => {
    if (contrastCategory === "auto") {
      // Auto-detect based on selected object
      if (selectedObject?.type === "text") {
        const fontSize = selectedObject.fontSize || 16;
        return fontSize >= 18 ||
          (fontSize >= 14 && selectedObject.fontWeight === "700")
          ? complianceLevel === "aaa"
            ? 4.5
            : 3
          : complianceLevel === "aaa"
          ? 7
          : 4.5;
      }
      return complianceLevel === "aaa" ? 4.5 : 3;
    }

    if (contrastCategory === "large-text") {
      return complianceLevel === "aaa" ? 4.5 : 3;
    }

    if (contrastCategory === "normal-text") {
      return complianceLevel === "aaa" ? 7 : 4.5;
    }

    return complianceLevel === "aaa" ? 4.5 : 3; // graphics
  };

  const meetsContrast = contrastResult.ratio >= getContrastThreshold();

  return (
    <div className="space-y-3">
      {/* Contrast indicator */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: foregroundColor }}
          />
          <span className="text-sm font-medium">
            {contrastResult.ratio.toFixed(2)}:1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onToggleDetails}
          >
            <Type className="h-3 w-3 mr-1" />
            AA
          </Button>
          {!meetsContrast && onAutoCorrect && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onAutoCorrect}
            >
              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
            </Button>
          )}
          {meetsContrast && <Check className="h-4 w-4 text-green-500" />}
        </div>
      </div>

      {/* Contrast details (collapsible) */}
      {showDetails && (
        <div className="px-4 py-3 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Foreground</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: foregroundColor }}
                />
                <span className="text-xs font-mono">{foregroundColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Background</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: backgroundColor }}
                />
                <span className="text-xs font-mono">{backgroundColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>
                AA: {complianceLevel === "aa" ? getContrastThreshold() : "4.5"}
              </span>
              {contrastResult.aa.normalText ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>
                AAA:{" "}
                {complianceLevel === "aaa" ? getContrastThreshold() : "7.0"}
              </span>
              {contrastResult.aaa.normalText ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-red-500" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={contrastCategory}
                onValueChange={(v) =>
                  setContrastCategory(v as ContrastCategory)
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="large-text">Large text</SelectItem>
                  <SelectItem value="normal-text">Normal text</SelectItem>
                  <SelectItem value="graphics">Graphics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Level</Label>
              <Select
                value={complianceLevel}
                onValueChange={(v) => setComplianceLevel(v as ComplianceLevel)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aa">AA</SelectItem>
                  <SelectItem value="aaa">AAA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
