// src/webviews/canvas/hooks/useRafLoop.ts
import { useEffect, useRef } from "react";

export function useRafLoop(cb: () => void, deps: any[]) {
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const tick = () => {
      cb();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) {cancelAnimationFrame(raf.current);}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
