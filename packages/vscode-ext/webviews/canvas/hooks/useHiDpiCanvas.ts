// src/webviews/canvas/hooks/useHiDpiCanvas.ts
import { useEffect, useMemo, useRef, useState } from "react";

export function useHiDpiCanvas(
  ref: React.RefObject<HTMLCanvasElement>,
  initial: { width: number; height: number }
) {
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [size, setSize] = useState({
    width: initial.width,
    height: initial.height,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) {return;}
    const ro = new ResizeObserver(() => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = el.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(rect.width * dpr));
      el.height = Math.max(1, Math.floor(rect.height * dpr));
      setSize({ width: el.width, height: el.height });
      const c = el.getContext("2d");
      if (c) {setCtx(c);}
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref.current]);

  return { ctx, size } as const;
}
