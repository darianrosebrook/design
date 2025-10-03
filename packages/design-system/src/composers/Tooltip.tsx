/**
 * @fileoverview Tooltip composer component
 * @author @darianrosebrook
 */

import React, { useState, useRef, useEffect } from "react";
import { defaultTokens as tokens } from "../../design-tokens/src/tokens";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end";
  trigger?: "hover" | "click" | "focus";
  delay?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Tooltip composer - shows contextual information on hover/focus
 *
 * @example
 * ```tsx
 * <Tooltip content="This is helpful information" placement="top">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  trigger = "hover",
  delay = 300,
  disabled = false,
  className = "",
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) {return;}

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case "bottom":
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case "left":
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case "right":
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + 8;
        break;
      case "top-start":
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left;
        break;
      case "top-end":
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.right - tooltipRect.width;
        break;
      case "bottom-start":
        top = triggerRect.bottom + 8;
        left = triggerRect.left;
        break;
      case "bottom-end":
        top = triggerRect.bottom + 8;
        left = triggerRect.right - tooltipRect.width;
        break;
      case "left-start":
        top = triggerRect.top;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case "left-end":
        top = triggerRect.bottom - tooltipRect.height;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case "right-start":
        top = triggerRect.top;
        left = triggerRect.right + 8;
        break;
      case "right-end":
        top = triggerRect.bottom - tooltipRect.height;
        left = triggerRect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport
    if (left < 8) {left = 8;}
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 8) {top = 8;}
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  };

  const showTooltip = () => {
    if (disabled) {return;}

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, placement]);

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    const handleResize = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isVisible, placement]);

  const triggerProps: React.HTMLAttributes<HTMLDivElement> = {};

  if (trigger === "hover") {
    triggerProps.onMouseEnter = showTooltip;
    triggerProps.onMouseLeave = hideTooltip;
  } else if (trigger === "focus") {
    triggerProps.onFocus = showTooltip;
    triggerProps.onBlur = hideTooltip;
  } else if (trigger === "click") {
    triggerProps.onClick = () => setIsVisible(!isVisible);
  }

  return (
    <div
      ref={triggerRef}
      className={`tooltip-trigger ${className}`}
      style={{ position: "relative", display: "inline-block", ...style }}
      {...triggerProps}
    >
      {children}

      {isVisible && !disabled && (
        <div
          ref={tooltipRef}
          className="tooltip-content"
          role="tooltip"
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: tokens.zIndex.tooltip,
            backgroundColor: tokens.color.background.elevated,
            color: tokens.color.text.primary,
            padding: `${tokens.space.sm}px ${tokens.space.md}px`,
            borderRadius: tokens.radius.md,
            fontSize: tokens.type.size.sm,
            fontFamily: tokens.type.family.sans,
            boxShadow: tokens.shadow.lg,
            border: `${tokens.borderWidth.sm}px solid ${tokens.color.border.subtle}`,
            maxWidth: "250px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(-4px)",
            transition: "opacity 0.15s ease-in-out, transform 0.15s ease-in-out",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
