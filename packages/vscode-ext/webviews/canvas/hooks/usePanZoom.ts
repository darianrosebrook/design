// src/webviews/canvas/hooks/usePanZoom.ts
import { useMemo, useState } from "react";

export function usePanZoom(opts?: { onChanged?: () => void }) {
  const [state, set] = useState({ x: 0, y: 0, z: 1 }); // translate (x,y), scale z

  const api = useMemo(
    () => ({
      state,
      panBy(dx: number, dy: number) {
        set((s) => {
          const n = { ...s, x: s.x + dx, y: s.y + dy };
          opts?.onChanged?.();
          return n;
        });
      },
      zoomAt(lx: number, ly: number, factor: number) {
        // keep point (lx, ly) stable while zooming
        set((s) => {
          const z = clamp(s.z * factor, 0.1, 8);
          const k = z / s.z;
          const nx = lx - k * (lx - s.x);
          const ny = ly - k * (ly - s.y);
          const n = { x: nx, y: ny, z };
          opts?.onChanged?.();
          return n;
        });
      },
      toWorld(lx: number, ly: number): [number, number] {
        const wx = (lx - state.x) / state.z;
        const wy = (ly - state.y) / state.z;
        return [wx, wy];
      },
      applyTo(ctx: CanvasRenderingContext2D) {
        ctx.setTransform(state.z, 0, 0, state.z, state.x, state.y);
      },
    }),
    [state]
  );

  return api;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
