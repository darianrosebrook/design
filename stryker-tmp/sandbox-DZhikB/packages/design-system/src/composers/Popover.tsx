/**
 * @fileoverview Popover composer component
 * @author @darianrosebrook
 */

import React, {
  useRef,
  useId,
  useContext,
  createContext,
  useLayoutEffect,
  useEffect,
  useState,
  useCallback,
  forwardRef,
} from "react";
import { createPortal } from "react-dom";
import { defaultTokens as tokens } from "../tokens.js";

interface PopoverProps {
  children: React.ReactNode;
  offset?: number;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  triggerStrategy?: "click" | "hover";
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state should change */
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

interface TriggerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  onClick?: (e: React.MouseEvent) => void;
}

interface ContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface Position {
  top: number;
  left: number;
}

interface PopoverContextType {
  popoverId: string;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  position: Position;
  updatePosition: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  offset: number;
  placement: Required<NonNullable<PopoverProps["placement"]>>;
  triggerStrategy: Required<NonNullable<PopoverProps["triggerStrategy"]>>;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
}

const PopoverContext = createContext<PopoverContextType | null>(null);

/**
 * Popover composer - floating content triggered by user interaction
 */
export const Popover: React.FC<PopoverProps> & {
  Trigger: React.FC<TriggerProps>;
  Content: React.FC<ContentProps>;
} = ({
  children,
  offset = 8,
  placement = "auto",
  triggerStrategy = "click",
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className,
  onOpen,
  onClose,
  open,
  onOpenChange,
}) => {
  const popoverId = `popover-${useId()}`;
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? (open as boolean) : internalOpen;

  const setIsOpen = useCallback(
    (next: boolean) => {
      if (isControlled) {
        onOpenChange?.(next);
        return;
      }
      setInternalOpen(next);
    },
    [isControlled, onOpenChange]
  );

  const updatePosition = useCallback(() => {
    if (triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (placement) {
        case "top":
          top = triggerRect.top - contentRect.height - offset;
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
          break;
        case "bottom":
          top = triggerRect.bottom + offset;
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
          break;
        case "left":
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
          left = triggerRect.left - contentRect.width - offset;
          break;
        case "right":
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
          left = triggerRect.right + offset;
          break;
        case "auto":
        default: {
          let calculatedLeft =
            triggerRect.left + (triggerRect.width - contentRect.width) / 2;
          let calculatedTop = triggerRect.bottom + offset;

          const bottomOverflow =
            calculatedTop + contentRect.height > window.innerHeight;
          if (bottomOverflow) {
            calculatedTop = triggerRect.top - contentRect.height - offset;
          }

          if (calculatedLeft + contentRect.width > window.innerWidth) {
            calculatedLeft = window.innerWidth - contentRect.width - 8;
          }
          if (calculatedLeft < 8) {calculatedLeft = 8;}

          top = calculatedTop;
          left = calculatedLeft;
        }
      }

      setPosition({ top, left });
    }
  }, [offset, placement]);

  // Open/Close side effects
  useLayoutEffect(() => {
    if (isOpen) {onOpen?.();}
    else {onClose?.();}
  }, [isOpen, onOpen, onClose]);

  // Outside click and Escape handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen) {return;}
      const targetNode = e.target as Node;
      const insideContent = contentRef.current?.contains(targetNode);
      const insideTrigger = triggerRef.current?.contains(targetNode);
      const isInside = Boolean(insideContent || insideTrigger);
      if (!isInside) {setIsOpen(false);}
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {setIsOpen(false);}
    };

    if (closeOnOutsideClick)
      {document.addEventListener("mousedown", handleClickOutside);}
    if (closeOnEscape) {document.addEventListener("keydown", handleEscapeKey);}

    return () => {
      if (closeOnOutsideClick) {
        document.removeEventListener("mousedown", handleClickOutside);
      }
      if (closeOnEscape) {
        document.removeEventListener("keydown", handleEscapeKey);
      }
    };
  }, [isOpen, closeOnOutsideClick, closeOnEscape, setIsOpen]);

  return (
    <PopoverContext.Provider
      value={{
        popoverId,
        triggerRef,
        contentRef,
        position,
        updatePosition,
        isOpen,
        setIsOpen,
        offset,
        placement,
        triggerStrategy,
        closeOnOutsideClick,
        closeOnEscape,
      }}
    >
      <div className={`popover-container ${className || ""}`}>{children}</div>
    </PopoverContext.Provider>
  );
};

/**
 * Popover trigger component
 */
const Trigger = forwardRef<HTMLElement, TriggerProps>(
  ({ children, className, as: Component = "div", onClick }, forwardedRef) => {
    const context = useContext(PopoverContext);

    if (!context) {
      throw new Error(
        "Popover.Trigger must be used within a Popover component"
      );
    }

    const { triggerRef, isOpen, setIsOpen, triggerStrategy } = context;

    const handleRefs = (element: HTMLElement | null) => {
      triggerRef.current = element;

      if (forwardedRef) {
        if (typeof forwardedRef === "function") {
          forwardedRef(element);
        } else {
          forwardedRef.current = element;
        }
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (triggerStrategy === "click") {setIsOpen(!isOpen);}
      onClick?.(e);
    };

    const handleMouseEnter = () => {
      if (triggerStrategy === "hover") {setIsOpen(true);}
    };

    const handleMouseLeave = () => {
      if (triggerStrategy === "hover") {setIsOpen(false);}
    };

    return (
      <Component
        ref={handleRefs}
        className={`popover-trigger ${isOpen ? "active" : ""} ${
          className || ""
        }`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {children}
      </Component>
    );
  }
);

Trigger.displayName = "PopoverTrigger";

/**
 * Popover content component
 */
const Content: React.FC<ContentProps> = ({ children, className, style }) => {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error("Popover.Content must be used within a Popover component");
  }

  const { popoverId, position, updatePosition, isOpen, contentRef } = context;

  // Animation setup
  useLayoutEffect(() => {
    if (contentRef.current && isOpen) {
      updatePosition();

      const contentElement = contentRef.current;
      contentElement.style.opacity = "0";
      contentElement.style.transform = "translateY(-10px) scale(0.95)";

      // Simple animation
      requestAnimationFrame(() => {
        contentElement.style.transition =
          "opacity 0.15s ease-out, transform 0.15s ease-out";
        contentElement.style.opacity = "1";
        contentElement.style.transform = "translateY(0) scale(1)";
      });

      const handleUpdate = () => updatePosition();
      window.addEventListener("resize", handleUpdate);
      window.addEventListener("scroll", handleUpdate);

      return () => {
        window.removeEventListener("resize", handleUpdate);
        window.removeEventListener("scroll", handleUpdate);
      };
    }
  }, [updatePosition, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen && contentRef.current) {
      const contentElement = contentRef.current;
      contentElement.style.transition = "opacity 0.1s ease-in";
      contentElement.style.opacity = "0";
    }
  }, [isOpen]);

  if (!isOpen) {return null;}

  const node = (
    <div
      ref={contentRef}
      id={popoverId}
      className={`popover-content ${className || ""}`}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(node, document.body)
    : node;
};

Content.displayName = "PopoverContent";

Popover.Trigger = Trigger;
Popover.Content = Content;
