"use client";

import {
  Link2,
  Unlink,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  ArrowLeftRight,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from '@/ui/primitives/button';
import { Input } from '@/ui/primitives/input';
import { Label } from '@/ui/primitives/label';
import { Switch } from '@/ui/primitives/switch';
import type { CanvasObject } from "@/lib/types";

interface LayoutSectionProps {
  object: CanvasObject;
  onUpdate: (updates: Partial<CanvasObject>) => void;
}

export function LayoutSection({ object, onUpdate }: LayoutSectionProps) {
  const [aspectLocked, setAspectLocked] = useState(true);
  const [autoLayout, setAutoLayout] = useState(false);

  const handleDimensionChange = (
    dimension: "width" | "height",
    value: number
  ) => {
    const updates: Partial<CanvasObject> = { [dimension]: value };

    if (aspectLocked && dimension === "width") {
      const aspectRatio = object.height / object.width;
      updates.height = value * aspectRatio;
    } else if (aspectLocked && dimension === "height") {
      const aspectRatio = object.width / object.height;
      updates.width = value * aspectRatio;
    }

    onUpdate(updates);
  };

  const handleRotationChange = (rotation: number) => {
    onUpdate({ rotation });
  };

  const resetRotation = () => {
    onUpdate({ rotation: 0 });
  };

  const toggleAutoLayout = () => {
    setAutoLayout(!autoLayout);
    // TODO: Implement auto layout logic
  };

  return (
    <div className="space-y-3">
      {/* Layout Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">Auto Layout</Label>
          <Switch
            checked={autoLayout}
            onCheckedChange={toggleAutoLayout}
            className="scale-75"
          />
        </div>
        {autoLayout && (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              title="Horizontal"
            >
              <ArrowLeftRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              title="Vertical"
            >
              <ArrowUpDown className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Size</Label>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setAspectLocked(!aspectLocked)}
            title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
          >
            {aspectLocked ? (
              <Link2 className="h-3 w-3" />
            ) : (
              <Unlink className="h-3 w-3" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">W</Label>
            <Input
              type="number"
              value={object.width}
              onChange={(e) =>
                handleDimensionChange("width", Number(e.target.value))
              }
              className="h-8 text-sm"
              step="0.1"
            />
          </div>

          <div className="flex flex-col items-center gap-1 mb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setAspectLocked(!aspectLocked)}
              title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {aspectLocked ? (
                <Link2 className="h-3 w-3" />
              ) : (
                <Unlink className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">H</Label>
            <Input
              type="number"
              value={object.height}
              onChange={(e) =>
                handleDimensionChange("height", Number(e.target.value))
              }
              className="h-8 text-sm"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Resize Mode */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Resize</Label>
        <div className="grid grid-cols-2 gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            title="Fill container"
          >
            <Maximize2 className="h-3 w-3 mr-1" />
            Fill
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            title="Hug contents"
          >
            <Minimize2 className="h-3 w-3 mr-1" />
            Hug
          </Button>
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Rotation</Label>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={resetRotation}
            title="Reset rotation"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={object.rotation}
            onChange={(e) => handleRotationChange(Number(e.target.value))}
            className="h-8 text-sm flex-1"
            step="0.1"
            min="-360"
            max="360"
          />
          <span className="text-xs text-muted-foreground">°</span>
        </div>
      </div>

      {/* Constraints */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Constraints</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Horizontal</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                title="Left"
              >
                L
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                title="Center"
              >
                C
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                title="Right"
              >
                R
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vertical</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                title="Top"
              >
                T
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                title="Center"
              >
                C
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                title="Bottom"
              >
                B
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Clip Content */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Clip content</Label>
        <Switch
          checked={object.clipContent || false}
          onCheckedChange={(checked) => onUpdate({ clipContent: checked })}
          className="scale-75"
        />
      </div>
    </div>
  );
}
