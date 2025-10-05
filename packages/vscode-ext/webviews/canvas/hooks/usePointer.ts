// src/webviews/canvas/hooks/usePointer.ts
import { useEffect, useState } from "react";

export function usePointer(ref: React.RefObject<HTMLCanvasElement>) {
  const [keys, setKeys] = useState({
    space: false,
    shift: false,
    alt: false,
    meta: false,
    ctrl: false,
  });
  useEffect(() => {
    const down = (e: KeyboardEvent) =>
      setKeys((k) => ({
        ...k,
        space: e.code === "Space" ? true : k.space,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
        ctrl: e.ctrlKey,
      }));
    const up = (e: KeyboardEvent) =>
      setKeys((k) => ({
        ...k,
        space: e.code === "Space" ? false : k.space,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
        ctrl: e.ctrlKey,
      }));
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  return { keys } as const;
}
